-- Add limited agency disclosure tracking

ALTER TABLE transactions
ADD COLUMN limited_agency_disclosure_received BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN transactions.limited_agency_disclosure_received IS 'Whether Limited Agency Disclosure and Agreement has been received (required when agency_role = limited_agency)';
