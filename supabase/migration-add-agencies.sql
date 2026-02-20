-- ============================================================
-- Migration: Add Agency Agreements (Clean)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create enums for agency agreements
DO $$ BEGIN
  CREATE TYPE agreement_type AS ENUM ('listing_agreement', 'buyer_agency_agreement');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE agreement_status AS ENUM ('active', 'expired', 'terminated', 'fulfilled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE agency_role AS ENUM ('listing_agent', 'buyer_agent', 'dual_agency');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create agency_agreements table
CREATE TABLE IF NOT EXISTS agency_agreements (
  id uuid primary key default uuid_generate_v4(),
  broker_id uuid not null references brokers(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  
  agreement_type agreement_type not null,
  
  client_first_name text not null,
  client_last_name text not null,
  client_email text,
  client_phone text,
  
  property_address text,
  property_city text,
  property_state text default 'UT',
  property_zip text,
  property_type property_type,
  list_price numeric,
  
  agreement_date date not null,
  expiration_date date,
  
  status agreement_status not null default 'active',
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table agency_agreements enable row level security;

DROP POLICY IF EXISTS "Brokers can manage own agency agreements" ON agency_agreements;
CREATE POLICY "Brokers can manage own agency agreements"
  ON agency_agreements FOR ALL
  USING (broker_id IN (SELECT id FROM brokers WHERE auth_user_id = auth.uid()));

-- 3. Add new columns to transactions (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='agency_agreement_id') THEN
    ALTER TABLE transactions ADD COLUMN agency_agreement_id uuid references agency_agreements(id) on delete set null;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='agency_role') THEN
    ALTER TABLE transactions ADD COLUMN agency_role agency_role;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='buyer_first_name') THEN
    ALTER TABLE transactions ADD COLUMN buyer_first_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='buyer_last_name') THEN
    ALTER TABLE transactions ADD COLUMN buyer_last_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='buyer_email') THEN
    ALTER TABLE transactions ADD COLUMN buyer_email text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='buyer_phone') THEN
    ALTER TABLE transactions ADD COLUMN buyer_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='seller_first_name') THEN
    ALTER TABLE transactions ADD COLUMN seller_first_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='seller_last_name') THEN
    ALTER TABLE transactions ADD COLUMN seller_last_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='seller_email') THEN
    ALTER TABLE transactions ADD COLUMN seller_email text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='seller_phone') THEN
    ALTER TABLE transactions ADD COLUMN seller_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='purchase_price') THEN
    ALTER TABLE transactions ADD COLUMN purchase_price numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='earnest_money') THEN
    ALTER TABLE transactions ADD COLUMN earnest_money numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='contract_date') THEN
    ALTER TABLE transactions ADD COLUMN contract_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='anticipated_closing_date') THEN
    ALTER TABLE transactions ADD COLUMN anticipated_closing_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='actual_closing_date') THEN
    ALTER TABLE transactions ADD COLUMN actual_closing_date date;
  END IF;
END $$;

-- 4. Rename address columns (if needed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='transactions' AND column_name='address') THEN
    ALTER TABLE transactions RENAME COLUMN address TO property_address;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='transactions' AND column_name='city') THEN
    ALTER TABLE transactions RENAME COLUMN city TO property_city;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='transactions' AND column_name='state') THEN
    ALTER TABLE transactions RENAME COLUMN state TO property_state;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='transactions' AND column_name='zip') THEN
    ALTER TABLE transactions RENAME COLUMN zip TO property_zip;
  END IF;
END $$;

COMMENT ON TABLE agency_agreements IS 'Listing agreements and buyer agency agreements';
COMMENT ON COLUMN transactions.agency_agreement_id IS 'Optional link to the agency agreement that led to this transaction';
COMMENT ON COLUMN transactions.agency_role IS 'Your role: listing_agent, buyer_agent, or dual_agency';
