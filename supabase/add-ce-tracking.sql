-- Add CE compliance tracking fields to agents table

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS ce_hours_core INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ce_hours_other INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mandatory_course_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ce_last_updated TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN agents.ce_hours_core IS 'Core CE hours completed this cycle';
COMMENT ON COLUMN agents.ce_hours_other IS 'Other CE hours completed this cycle';
COMMENT ON COLUMN agents.mandatory_course_completed IS 'Whether mandatory 3-hour course is completed';
COMMENT ON COLUMN agents.ce_last_updated IS 'Last time CE data was updated from state report';
