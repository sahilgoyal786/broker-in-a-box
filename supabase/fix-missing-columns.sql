-- Add missing columns to transactions table
-- Run this in Supabase SQL Editor

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS property_city text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS property_state text DEFAULT 'UT';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS property_zip text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_first_name text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_last_name text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_email text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_phone text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_first_name text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_last_name text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_email text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_phone text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS purchase_price numeric;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS earnest_money numeric;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS contract_date date;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS anticipated_closing_date date;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS actual_closing_date date;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agency_agreement_id uuid REFERENCES agency_agreements(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agency_role agency_role;

-- Also rename old columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='address') THEN
    ALTER TABLE transactions RENAME COLUMN address TO property_address;
  END IF;
END $$;
