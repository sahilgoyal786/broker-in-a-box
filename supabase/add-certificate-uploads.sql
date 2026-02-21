-- Add certificate storage to agents table (Option A: Self-Service)
ALTER TABLE agents
ADD COLUMN nar_code_of_ethics_cert_url TEXT,
ADD COLUMN nar_fair_housing_cert_url TEXT;

-- Add comments
COMMENT ON COLUMN agents.nar_code_of_ethics_cert_url IS 'Storage URL of uploaded Code of Ethics certificate';
COMMENT ON COLUMN agents.nar_fair_housing_cert_url IS 'Storage URL of uploaded Fair Housing certificate';
