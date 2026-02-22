-- Add mls_number column to agency_agreements table

ALTER TABLE agency_agreements 
ADD COLUMN IF NOT EXISTS mls_number text;

COMMENT ON COLUMN agency_agreements.mls_number IS 'MLS listing number for quick reference';
