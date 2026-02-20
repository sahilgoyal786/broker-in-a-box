-- ============================================================
-- Migration: Split into Agency Agreements + Transactions
-- ============================================================

-- 1. Create agency_agreements table
create type agreement_type as enum ('listing_agreement', 'buyer_agency_agreement');
create type agreement_status as enum ('active', 'expired', 'terminated', 'fulfilled');

create table agency_agreements (
  id uuid primary key default uuid_generate_v4(),
  broker_id uuid not null references brokers(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  
  -- Type
  agreement_type agreement_type not null,
  
  -- Client
  client_first_name text not null,
  client_last_name text not null,
  client_email text,
  client_phone text,
  
  -- Property (for listing agreements)
  property_address text,
  property_city text,
  property_state text default 'UT',
  property_zip text,
  property_type property_type,
  list_price numeric,
  
  -- Dates
  agreement_date date not null,
  expiration_date date,
  
  -- Status
  status agreement_status not null default 'active',
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table agency_agreements enable row level security;

create policy "Brokers can manage own agency agreements"
  on agency_agreements for all
  using (broker_id in (select id from brokers where auth_user_id = auth.uid()));

-- 2. Update transactions table
-- Drop old transaction_type enum
alter table transactions 
  alter column transaction_type drop default,
  alter column transaction_type type text;

drop type if exists transaction_type cascade;

-- Create new simplified enums
create type transaction_type as enum ('purchase', 'lease');
create type agency_role as enum ('listing_agent', 'buyer_agent', 'dual_agency');

-- Add new columns
alter table transactions 
  add column agency_agreement_id uuid references agency_agreements(id) on delete set null,
  add column agency_role agency_role;

-- Set defaults for existing data
update transactions set 
  agency_role = 'buyer_agent'
  where agency_role is null;

-- Convert to new transaction_type
update transactions set transaction_type = 'purchase';

-- Apply new types
alter table transactions 
  alter column transaction_type type transaction_type using transaction_type::transaction_type,
  alter column transaction_type set default 'purchase'::transaction_type,
  alter column agency_role type agency_role using agency_role::agency_role,
  alter column agency_role set not null;

-- Rename columns for clarity
alter table transactions rename column address to property_address;
alter table transactions rename column city to property_city;
alter table transactions rename column state to property_state;
alter table transactions rename column zip to property_zip;

-- Add buyer/seller info
alter table transactions 
  add column buyer_first_name text,
  add column buyer_last_name text,
  add column buyer_email text,
  add column buyer_phone text,
  add column seller_first_name text,
  add column seller_last_name text,
  add column seller_email text,
  add column seller_phone text,
  add column purchase_price numeric,
  add column earnest_money numeric,
  add column contract_date date,
  add column anticipated_closing_date date,
  add column actual_closing_date date;

-- Update status enum
alter table transactions 
  alter column status drop default,
  alter column status type text;

drop type if exists transaction_status cascade;

create type transaction_status as enum ('pending', 'under_contract', 'closed', 'cancelled');

alter table transactions 
  alter column status type transaction_status using status::transaction_status,
  alter column status set default 'pending'::transaction_status;

-- 3. Create compliance templates for agency agreements
insert into compliance_templates (property_type, transaction_type, display_name, display_order, created_at)
values 
  -- Listing Agreement templates (one per property type)
  ('residential', 'listing_agreement', 'Listing Agreement Templates', 1, now()),
  ('vacant_land', 'listing_agreement', 'Listing Agreement Templates', 1, now()),
  ('mobile_home', 'listing_agreement', 'Listing Agreement Templates', 1, now()),
  ('commercial', 'listing_agreement', 'Listing Agreement Templates', 1, now()),
  ('multi_unit', 'listing_agreement', 'Listing Agreement Templates', 1, now()),
  ('farm', 'listing_agreement', 'Listing Agreement Templates', 1, now()),
  ('residential_lease', 'listing_agreement', 'Listing Agreement Templates', 1, now()),
  
  -- Buyer Agency Agreement template (property-agnostic)
  (null, 'buyer_agency_agreement', 'Buyer Agency Agreement Templates', 1, now());

-- Add standard listing agreement forms
insert into template_forms (template_id, form_name, tracking_type, required, display_order, created_at)
select 
  ct.id,
  'Listing Agreement',
  'manual_upload',
  true,
  1,
  now()
from compliance_templates ct
where ct.transaction_type = 'listing_agreement';

insert into template_forms (template_id, form_name, tracking_type, required, display_order, created_at)
select 
  ct.id,
  'MLS Entry Confirmation',
  'pdf_auto',
  true,
  2,
  now()
from compliance_templates ct
where ct.transaction_type = 'listing_agreement' and ct.property_type != 'residential_lease';

-- Add buyer agency agreement forms
insert into template_forms (template_id, form_name, tracking_type, required, display_order, created_at)
select 
  ct.id,
  'Buyer Agency Agreement',
  'manual_upload',
  true,
  1,
  now()
from compliance_templates ct
where ct.transaction_type = 'buyer_agency_agreement';

comment on table agency_agreements is 'Listing agreements and buyer agency agreements - the preparatory contracts';
comment on column transactions.agency_agreement_id is 'Optional link to the agency agreement that led to this transaction';
comment on column transactions.agency_role is 'Your role in this transaction: listing agent, buyer agent, or dual agency';
