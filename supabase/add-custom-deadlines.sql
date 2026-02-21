-- Add two wildcard/custom deadline fields to transactions table

ALTER TABLE transactions
ADD COLUMN custom_deadline_1_label TEXT,
ADD COLUMN custom_deadline_1_date DATE,
ADD COLUMN custom_deadline_2_label TEXT,
ADD COLUMN custom_deadline_2_date DATE;

-- Add comments
COMMENT ON COLUMN transactions.custom_deadline_1_label IS 'Custom deadline label (e.g., "HOA Approval", "Septic Inspection")';
COMMENT ON COLUMN transactions.custom_deadline_1_date IS 'Custom deadline date';
COMMENT ON COLUMN transactions.custom_deadline_2_label IS 'Custom deadline label (e.g., "Well Test", "Zoning Approval")';
COMMENT ON COLUMN transactions.custom_deadline_2_date IS 'Custom deadline date';
