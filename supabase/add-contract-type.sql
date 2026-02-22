-- Add contract_type column to transactions table (purchase vs lease)

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS contract_type TEXT;

COMMENT ON COLUMN transactions.contract_type IS 'Type of contract: purchase or lease';

-- Add check constraint
ALTER TABLE transactions
ADD CONSTRAINT contract_type_check 
CHECK (contract_type IS NULL OR contract_type IN ('purchase', 'lease'));
