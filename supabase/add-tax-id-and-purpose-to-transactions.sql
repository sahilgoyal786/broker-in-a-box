-- Add tax_id and purpose fields to transactions table

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS purpose TEXT CHECK (purpose IN ('purchase', 'lease')) DEFAULT 'purchase';

COMMENT ON COLUMN transactions.tax_id IS 'Tax ID Number for the property (used when property address is not available, especially for vacant land)';
COMMENT ON COLUMN transactions.purpose IS 'Transaction purpose: purchase or lease';
