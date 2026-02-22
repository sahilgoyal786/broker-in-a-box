-- CORRECT cleanup: Delete transactions with OLD/LEGACY values
-- Keep only transactions with NEW values (listing, buyer_agency, limited_agency)

DELETE FROM transactions
WHERE transaction_type IN ('purchase', 'seller_purchase', 'buyer_purchase', 'unrepresented_buyer', 'fsbo_purchase');

-- This deletes the OLD test data and keeps the NEW properly formatted transactions
