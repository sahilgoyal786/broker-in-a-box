-- Add sort_order column to agency_compliance_items
ALTER TABLE agency_compliance_items
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999;

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_agency_compliance_sort 
  ON agency_compliance_items(agency_agreement_id, sort_order);
