-- Add Section 24 deadline fields to transactions table

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS inspection_deadline DATE,
ADD COLUMN IF NOT EXISTS loan_approval_deadline DATE,
ADD COLUMN IF NOT EXISTS appraisal_deadline DATE,
ADD COLUMN IF NOT EXISTS buyer_property_sale_deadline DATE;

COMMENT ON COLUMN transactions.inspection_deadline IS 'Section 24(A) - Buyer Inspection/Due Diligence deadline';
COMMENT ON COLUMN transactions.loan_approval_deadline IS 'Section 24(B) - Loan approval deadline';
COMMENT ON COLUMN transactions.appraisal_deadline IS 'Section 24(C) - Appraisal deadline';
COMMENT ON COLUMN transactions.buyer_property_sale_deadline IS 'Section 24(D) - Sale of buyer property deadline';
