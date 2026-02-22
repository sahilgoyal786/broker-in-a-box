-- Add sales_price to listings table and link transactions to agency agreements
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS sales_price DECIMAL(12, 2);

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS agency_agreement_id UUID REFERENCES agency_agreements(id);

COMMENT ON COLUMN listings.sales_price IS 'Final sales price from purchase contract (updates when contract created from this listing)';
COMMENT ON COLUMN transactions.agency_agreement_id IS 'Link to the listing agency agreement if created from a listing';
