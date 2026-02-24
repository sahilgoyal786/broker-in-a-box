-- Check agency file IDs
SELECT id, file_id, client_first_name, client_last_name, created_at
FROM agency_agreements
ORDER BY created_at;

-- Check transaction file IDs
SELECT id, file_id, buyer_first_name, buyer_last_name, created_at, broker_id
FROM transactions
ORDER BY created_at;

-- Check broker counters
SELECT id, current_agency_id, current_sales_id, id_year
FROM brokers;
