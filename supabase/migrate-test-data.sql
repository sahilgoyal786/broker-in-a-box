-- Migrate the two test records from transactions to agency_agreements
-- Run this in Supabase SQL Editor

-- Step 1: Check what we have
SELECT 
  id,
  broker_id,
  agent_id,
  property_address,
  property_city,
  property_state,
  property_zip,
  property_type,
  transaction_type,
  status,
  buyer_first_name,
  buyer_last_name,
  seller_first_name,
  seller_last_name
FROM transactions
ORDER BY created_at;

-- Step 2: Migrate to agency_agreements
-- This assumes the old transaction_type values are still text ('listing', 'buyer_agency')
-- If they're already the new enum ('purchase', 'lease'), you may need to skip this

INSERT INTO agency_agreements (
  broker_id,
  agent_id,
  agreement_type,
  client_first_name,
  client_last_name,
  property_address,
  property_city,
  property_state,
  property_zip,
  property_type,
  agreement_date,
  status,
  created_at
)
SELECT 
  broker_id,
  agent_id,
  -- Map transaction_type to agreement_type
  CASE 
    WHEN transaction_type::text = 'listing' THEN 'listing_agreement'::agreement_type
    WHEN transaction_type::text = 'buyer_agency' THEN 'buyer_agency_agreement'::agreement_type
    ELSE 'buyer_agency_agreement'::agreement_type
  END,
  -- Client name (use seller for listing, buyer for buyer agency)
  CASE 
    WHEN transaction_type::text = 'listing' THEN COALESCE(seller_first_name, buyer_first_name, 'Client')
    ELSE COALESCE(buyer_first_name, seller_first_name, 'Client')
  END,
  CASE 
    WHEN transaction_type::text = 'listing' THEN COALESCE(seller_last_name, buyer_last_name, 'Name')
    ELSE COALESCE(buyer_last_name, seller_last_name, 'Name')
  END,
  property_address,
  property_city,
  property_state,
  property_zip,
  property_type,
  COALESCE(contract_date, CURRENT_DATE),
  CASE 
    WHEN status::text = 'active' THEN 'active'::agreement_status
    ELSE 'active'::agreement_status
  END,
  created_at
FROM transactions
WHERE transaction_type::text IN ('listing', 'buyer_agency');

-- Step 3: Delete the old transaction records (ONLY if migration worked)
-- DELETE FROM transactions WHERE transaction_type::text IN ('listing', 'buyer_agency');
