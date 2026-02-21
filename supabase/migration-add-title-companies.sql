-- Add title company fields to transactions
-- Clean approach: separate fields for each title company, dropdown for earnest money location

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS buyer_title_company TEXT,
ADD COLUMN IF NOT EXISTS seller_title_company TEXT,
ADD COLUMN IF NOT EXISTS earnest_money_location_other TEXT;

-- Update earnest_money_location constraint to include title company options + other
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS earnest_money_location_check;
ALTER TABLE transactions ADD CONSTRAINT earnest_money_location_check 
  CHECK (earnest_money_location IN ('buyer_title_company', 'seller_title_company', 'buyer_broker', 'listing_broker', 'other'));

-- Comments for clarity
COMMENT ON COLUMN transactions.buyer_title_company IS 'Title company representing buyer';
COMMENT ON COLUMN transactions.seller_title_company IS 'Title company representing seller';
COMMENT ON COLUMN transactions.earnest_money_location IS 'Where earnest money is held: buyer_title_company, seller_title_company, buyer_broker, listing_broker, or other';
COMMENT ON COLUMN transactions.earnest_money_location_other IS 'Specify location when earnest_money_location = other';
