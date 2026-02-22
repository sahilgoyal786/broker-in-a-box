-- Fix Section 24 deadline fields to match actual REPC
-- Section 24 has 4 deadlines: (a) Seller Disclosure, (b) Due Diligence, (c) Financing & Appraisal, (d) Settlement

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS financing_appraisal_deadline DATE,
ADD COLUMN IF NOT EXISTS settlement_deadline DATE;

COMMENT ON COLUMN transactions.seller_disclosure_deadline IS 'Section 24(a) - Seller Disclosure Deadline';
COMMENT ON COLUMN transactions.due_diligence_deadline IS 'Section 24(b) - Due Diligence Deadline (formerly called inspection)';
COMMENT ON COLUMN transactions.financing_appraisal_deadline IS 'Section 24(c) - Financing & Appraisal Deadline (combined)';
COMMENT ON COLUMN transactions.settlement_deadline IS 'Section 24(d) - Settlement Deadline';

-- Note: anticipated_closing_date should mirror settlement_deadline
