-- Add original_list_price and current_list_price to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS original_list_price DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS current_list_price DECIMAL(12, 2);

COMMENT ON COLUMN transactions.original_list_price IS 'Original listing price when property first listed';
COMMENT ON COLUMN transactions.current_list_price IS 'Current/final listing price (may differ from original if price reduced)';
COMMENT ON COLUMN transactions.list_price IS 'Legacy field - use original_list_price instead';
