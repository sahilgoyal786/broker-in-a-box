-- Clean up old test transactions with legacy/invalid transaction_type values
-- Option 1: DELETE all transactions with old values (safest - fresh start)

DELETE FROM transactions
WHERE transaction_type NOT IN ('listing', 'buyer_agency', 'limited_agency');

-- This will remove transactions with values like:
-- 'purchase', 'seller_purchase', 'buyer_purchase', 'unrepresented_buyer', 'fsbo_purchase'

-- If you want to keep any of them, run Option 2 instead:
/*
-- Option 2: UPDATE old values to new standardized values
UPDATE transactions
SET transaction_type = CASE
  WHEN transaction_type IN ('seller_purchase') THEN 'limited_agency'
  WHEN transaction_type IN ('buyer_purchase', 'unrepresented_buyer', 'fsbo_purchase', 'purchase') THEN 'buyer_agency'
  ELSE transaction_type
END
WHERE transaction_type NOT IN ('listing', 'buyer_agency', 'limited_agency');
*/
