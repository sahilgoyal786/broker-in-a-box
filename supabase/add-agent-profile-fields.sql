-- Add additional agent profile fields
ALTER TABLE agents ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS gender text;

COMMENT ON COLUMN agents.phone IS 'Agent phone number';
COMMENT ON COLUMN agents.date_of_birth IS 'Agent date of birth (for compliance/HR)';
COMMENT ON COLUMN agents.gender IS 'Agent gender (optional, for demographic purposes)';
