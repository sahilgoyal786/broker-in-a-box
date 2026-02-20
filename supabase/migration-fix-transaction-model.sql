-- ============================================================
-- Migration: Fix Transaction Model
-- Transaction = REPC (Real Estate Purchase Contract)
-- Separate agency role from transaction type
-- ============================================================

-- 1. Add new agency_role column
alter table transactions add column agency_role text;

-- 2. Migrate existing data
-- Map old transaction_type to new model
update transactions set 
  agency_role = case 
    when transaction_type = 'listing' then 'listing_agent'
    when transaction_type = 'buyer_agency' then 'buyer_agent'
    when transaction_type = 'seller_purchase' then 'listing_agent'
    when transaction_type = 'buyer_purchase' then 'buyer_agent'
    when transaction_type = 'unrepresented_buyer' then 'transaction_broker'
    when transaction_type = 'fsbo_purchase' then 'buyer_agent'
    else 'buyer_agent'
  end;

-- 3. Drop old enum constraint
alter table transactions 
  alter column transaction_type drop default,
  alter column transaction_type type text;

drop type if exists transaction_type cascade;

-- 4. Create new simpler transaction_type enum
create type transaction_type as enum (
  'purchase',
  'lease'
);

-- 5. Set all existing transactions to 'purchase' (can manually correct leases later)
update transactions set transaction_type = 'purchase';

-- 6. Convert column to new enum
alter table transactions 
  alter column transaction_type type transaction_type using transaction_type::transaction_type,
  alter column transaction_type set default 'purchase'::transaction_type;

-- 7. Create agency_role enum and apply
create type agency_role as enum (
  'listing_agent',
  'buyer_agent',
  'dual_agent',
  'transaction_broker'
);

alter table transactions 
  alter column agency_role type agency_role using agency_role::agency_role,
  alter column agency_role set not null;

-- 8. Add helpful constraints
alter table transactions 
  add constraint valid_agency_role 
  check (agency_role in ('listing_agent', 'buyer_agent', 'dual_agent', 'transaction_broker'));

comment on column transactions.transaction_type is 'Type of real estate transaction: purchase or lease';
comment on column transactions.agency_role is 'How the broker/agent represents the client in this transaction';
