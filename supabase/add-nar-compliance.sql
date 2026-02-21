-- Add NAR compliance tracking to agents table
ALTER TABLE agents
ADD COLUMN nar_code_of_ethics_date DATE,
ADD COLUMN nar_fair_housing_date DATE,
ADD COLUMN nar_cycle_end DATE DEFAULT '2027-12-31';

-- Add comment for documentation
COMMENT ON COLUMN agents.nar_code_of_ethics_date IS 'Date when Code of Ethics training was last completed (NAR requirement)';
COMMENT ON COLUMN agents.nar_fair_housing_date IS 'Date when Fair Housing training was last completed (NAR requirement)';
COMMENT ON COLUMN agents.nar_cycle_end IS 'End date of current NAR 3-year training cycle (default: Dec 31, 2027)';
