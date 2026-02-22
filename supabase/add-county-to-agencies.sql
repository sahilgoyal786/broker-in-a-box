-- Add county column to agency_agreements table

ALTER TABLE agency_agreements 
ADD COLUMN IF NOT EXISTS county text;

COMMENT ON COLUMN agency_agreements.county IS 'Property county (Utah counties)';
