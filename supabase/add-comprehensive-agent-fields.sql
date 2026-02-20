-- Add comprehensive agent fields for brokerage management
-- Based on standard agent onboarding form

-- Identity
ALTER TABLE agents ADD COLUMN IF NOT EXISTS middle_initial text;

-- Payment structure (1099 reporting)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS payment_method text; -- 'entity' or 'person'
ALTER TABLE agents ADD COLUMN IF NOT EXISTS entity_name text; -- if paid as entity
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ssn_last_4 text; -- if paid as person (last 4 only for security)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ein text; -- if paid as entity

-- Contact
-- phone already exists
ALTER TABLE agents ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS state text DEFAULT 'UT';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS zip text;

-- Professional
ALTER TABLE agents ADD COLUMN IF NOT EXISTS primary_board text; -- Which MLS/board (e.g., "Wasatch Front Regional MLS")
ALTER TABLE agents ADD COLUMN IF NOT EXISTS original_license_date date; -- When first licensed
ALTER TABLE agents ADD COLUMN IF NOT EXISTS current_company text; -- Company they're leaving

-- Onboarding metrics
ALTER TABLE agents ADD COLUMN IF NOT EXISTS listings_at_hire integer DEFAULT 0; -- How many listings they brought
ALTER TABLE agents ADD COLUMN IF NOT EXISTS hire_date date; -- When they joined this brokerage

-- Calculated fields (age and years_licensed can be computed from dates)
-- We'll calculate these in the app from date_of_birth and original_license_date

-- Comments
COMMENT ON COLUMN agents.middle_initial IS 'Middle initial';
COMMENT ON COLUMN agents.payment_method IS 'How agent is paid: entity or person (for 1099 reporting)';
COMMENT ON COLUMN agents.entity_name IS 'Legal entity name if paid as entity';
COMMENT ON COLUMN agents.ssn_last_4 IS 'Last 4 of SSN if paid as person (for 1099-MISC)';
COMMENT ON COLUMN agents.ein IS 'EIN if paid as entity (for 1099-NEC)';
COMMENT ON COLUMN agents.address IS 'Street address';
COMMENT ON COLUMN agents.city IS 'City';
COMMENT ON COLUMN agents.state IS 'State';
COMMENT ON COLUMN agents.zip IS 'ZIP code';
COMMENT ON COLUMN agents.primary_board IS 'Primary MLS/board membership';
COMMENT ON COLUMN agents.original_license_date IS 'Date agent was first licensed (to calculate years licensed)';
COMMENT ON COLUMN agents.current_company IS 'Company agent is leaving (for context)';
COMMENT ON COLUMN agents.listings_at_hire IS 'Number of listings agent brought when joining';
COMMENT ON COLUMN agents.hire_date IS 'Date agent joined this brokerage';
