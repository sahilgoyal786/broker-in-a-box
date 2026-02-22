-- Add purpose field to agency_agreements
ALTER TABLE agency_agreements
ADD COLUMN IF NOT EXISTS purpose TEXT CHECK (purpose IN ('purchase', 'lease'));

-- Set default to 'purchase' for existing records
UPDATE agency_agreements
SET purpose = 'purchase'
WHERE purpose IS NULL;

COMMENT ON COLUMN agency_agreements.purpose IS 'Whether this is for a purchase or lease transaction';
