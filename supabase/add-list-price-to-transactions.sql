-- Add list_price column to transactions table for list-to-sale ratio tracking

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS list_price NUMERIC(10, 2);

COMMENT ON COLUMN transactions.list_price IS 'Original listing price (for calculating list-to-sale ratio)';
