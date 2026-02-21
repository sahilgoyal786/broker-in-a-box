-- Add REPC date fields to transactions table

ALTER TABLE transactions
ADD COLUMN offer_reference_date DATE,
ADD COLUMN seller_disclosure_deadline DATE,
ADD COLUMN due_diligence_deadline DATE,
ADD COLUMN finance_appraisal_deadline DATE,
ADD COLUMN settlement_deadline DATE;

-- Add comments explaining the fields
COMMENT ON COLUMN transactions.offer_reference_date IS 'REPC front page - primary date when offer was made';
COMMENT ON COLUMN transactions.seller_disclosure_deadline IS 'Section 24(a) - Seller Disclosure Deadline';
COMMENT ON COLUMN transactions.due_diligence_deadline IS 'Section 24(b) - Due Diligence Deadline';
COMMENT ON COLUMN transactions.finance_appraisal_deadline IS 'Section 24(c) - Finance and Appraisal Deadline';
COMMENT ON COLUMN transactions.settlement_deadline IS 'Section 24(d) - Settlement Deadline (when signing happens)';

-- Create index on settlement_deadline for sorting/filtering
CREATE INDEX idx_transactions_settlement_deadline ON transactions(settlement_deadline);
CREATE INDEX idx_transactions_offer_reference_date ON transactions(offer_reference_date);
