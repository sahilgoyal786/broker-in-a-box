-- Migrate existing transaction records that are actually agency agreements
-- to the agency_agreements table

-- First, let's see what we have
SELECT id, client_first_name, client_last_name, property_address, transaction_type 
FROM transactions;

-- For "Buyer, Betty" (buyer_agency) → Buyer Agency Agreement
-- For "Seller, Sally" (listing) → Listing Agreement

-- Insert into agency_agreements (you'll need to adjust the IDs after checking)
-- This is a template - run the SELECT first to see the actual data

/*
INSERT INTO agency_agreements (
  broker_id,
  agent_id,
  agreement_type,
  client_first_name,
  client_last_name,
  client_email,
  client_phone,
  property_address,
  property_city,
  property_state,
  property_zip,
  property_type,
  agreement_date,
  status
)
SELECT 
  broker_id,
  agent_id,
  CASE 
    WHEN transaction_type = 'listing' THEN 'listing_agreement'::agreement_type
    WHEN transaction_type = 'buyer_agency' THEN 'buyer_agency_agreement'::agreement_type
    ELSE 'buyer_agency_agreement'::agreement_type
  END,
  client_first_name,
  client_last_name,
  NULL, -- client_email
  NULL, -- client_phone
  address,
  city,
  state,
  zip,
  property_type,
  CURRENT_DATE, -- agreement_date
  'active'::agreement_status
FROM transactions
WHERE transaction_type IN ('listing', 'buyer_agency');

-- Then delete the old transaction records
DELETE FROM transactions WHERE transaction_type IN ('listing', 'buyer_agency');
*/
