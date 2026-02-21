-- Add REPC summary fields (contract date, earnest money tracking)

ALTER TABLE transactions
ADD COLUMN contract_date DATE,
ADD COLUMN earnest_money_amount NUMERIC(10, 2),
ADD COLUMN earnest_money_location TEXT,
ADD COLUMN earnest_money_held_by TEXT,
ADD COLUMN earnest_money_contact_name TEXT,
ADD COLUMN earnest_money_contact_email TEXT,
ADD COLUMN earnest_money_contact_phone TEXT;

-- Add comments
COMMENT ON COLUMN transactions.contract_date IS 'Date contract was accepted/signed by all parties';
COMMENT ON COLUMN transactions.earnest_money_amount IS 'Earnest money deposit amount';
COMMENT ON COLUMN transactions.earnest_money_location IS 'Where earnest money is held: title_company, buyer_broker, listing_broker';
COMMENT ON COLUMN transactions.earnest_money_held_by IS 'Name of title company or brokerage holding earnest money';
COMMENT ON COLUMN transactions.earnest_money_contact_name IS 'Contact person at title company/brokerage';
COMMENT ON COLUMN transactions.earnest_money_contact_email IS 'Contact email for earnest money holder';
COMMENT ON COLUMN transactions.earnest_money_contact_phone IS 'Contact phone for earnest money holder';

-- Add check constraint for earnest money location
ALTER TABLE transactions
ADD CONSTRAINT earnest_money_location_check 
CHECK (earnest_money_location IS NULL OR earnest_money_location IN ('title_company', 'buyer_broker', 'listing_broker'));
