-- Manual backfill for transaction file IDs
-- Run this to assign file IDs to existing transactions

DO $$
DECLARE
  broker_rec RECORD;
  transaction_rec RECORD;
  sales_counter INTEGER;
BEGIN
  -- For each broker
  FOR broker_rec IN SELECT id FROM brokers LOOP
    sales_counter := 0;
    
    -- Loop through transactions for this broker (ordered by creation date)
    FOR transaction_rec IN 
      SELECT t.id 
      FROM transactions t
      WHERE t.broker_id = broker_rec.id 
        AND t.file_id IS NULL
      ORDER BY t.created_at
    LOOP
      sales_counter := sales_counter + 1;
      
      -- Assign file ID
      UPDATE transactions
      SET file_id = '2026-S' || LPAD(sales_counter::TEXT, 5, '0')
      WHERE id = transaction_rec.id;
      
      RAISE NOTICE 'Assigned 2026-S% to transaction %', LPAD(sales_counter::TEXT, 5, '0'), transaction_rec.id;
    END LOOP;
    
    -- Update broker's sales counter
    UPDATE brokers
    SET current_sales_id = sales_counter
    WHERE id = broker_rec.id;
    
    RAISE NOTICE 'Updated broker % counter to %', broker_rec.id, sales_counter;
  END LOOP;
END $$;

-- Verify results
SELECT id, file_id, buyer_first_name, buyer_last_name, created_at
FROM transactions
ORDER BY created_at;
