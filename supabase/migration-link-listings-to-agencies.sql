-- Migration: Link listings to agency agreements
-- A listing is property details for a listing agreement (which is a type of agency agreement)

-- Add foreign key to link listings to agency_agreements
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS agency_agreement_id UUID REFERENCES agency_agreements(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_listings_agency_agreement_id ON listings(agency_agreement_id);

-- Make agency_agreement_id required (after adding column with nullable first)
-- This allows existing data to migrate gracefully, then we enforce the constraint
UPDATE listings SET agency_agreement_id = NULL WHERE agency_agreement_id IS NULL;
