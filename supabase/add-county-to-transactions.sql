-- Add county to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS county TEXT;

COMMENT ON COLUMN transactions.county IS 'Property county (29 Utah counties)';
