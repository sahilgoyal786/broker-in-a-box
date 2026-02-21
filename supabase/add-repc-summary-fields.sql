-- Add REPC summary fields (contract date, earnest money tracking)

ALTER TABLE transactions
ADD COLUMN contract_date DATE,
ADD COLUMN earnest_money_amount NUMERIC(10, 2),
ADD COLUMN earnest_money_location TEXT;

-- Add comments
COMMENT ON COLUMN transactions.contract_date IS 'Date contract was accepted/signed by all parties';
COMMENT ON COLUMN transactions.earnest_money_amount IS 'Earnest money deposit amount';
COMMENT ON COLUMN transactions.earnest_money_location IS 'Where earnest money is held: title_company, buyer_broker, listing_broker';

-- Add check constraint for earnest money location
ALTER TABLE transactions
ADD CONSTRAINT earnest_money_location_check 
CHECK (earnest_money_location IS NULL OR earnest_money_location IN ('title_company', 'buyer_broker', 'listing_broker'));
