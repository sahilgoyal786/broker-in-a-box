-- Add tax_id column to agency_agreements table

ALTER TABLE agency_agreements 
ADD COLUMN IF NOT EXISTS tax_id text;

COMMENT ON COLUMN agency_agreements.tax_id IS 'Tax ID Number - required if no street address';
