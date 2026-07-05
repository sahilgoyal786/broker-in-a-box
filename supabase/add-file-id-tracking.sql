-- File ID tracking for Broker in a Box
-- Agency file IDs: A-YYYY-#####  (e.g. A-2026-00001)
-- Contract file IDs: C-YYYY-##### (e.g. C-2026-00001)
--
-- NOTE: file_id columns on agency_agreements and transactions already exist
-- in schema-current.sql. Run this script to add the counter columns,
-- functions, triggers, and backfill existing records.

-- Add counter columns to brokers table (skip if already exist)
ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS current_sales_id INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_agency_id INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS id_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Add indexes for file_id lookups (skip if already exist)
CREATE INDEX IF NOT EXISTS idx_agency_file_id ON agency_agreements(file_id);
CREATE INDEX IF NOT EXISTS idx_transaction_file_id ON transactions(file_id);

-- ─────────────────────────────────────────────
-- Function: generate_agency_file_id → A-YYYY-#####
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_agency_file_id(broker_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  stored_year  INTEGER;
  next_id      INTEGER;
  file_id      TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  SELECT id_year, current_agency_id
    INTO stored_year, next_id
    FROM brokers
   WHERE id = broker_uuid;

  -- Reset counter on new year
  IF stored_year IS DISTINCT FROM current_year THEN
    next_id := 0;
    UPDATE brokers
       SET id_year          = current_year,
           current_agency_id = 0,
           current_sales_id  = 0
     WHERE id = broker_uuid;
  END IF;

  next_id := next_id + 1;

  UPDATE brokers
     SET current_agency_id = next_id
   WHERE id = broker_uuid;

  -- Format: A-YYYY-#####
  file_id := 'A-' || current_year || '-' || LPAD(next_id::TEXT, 5, '0');

  RETURN file_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- Function: generate_sales_file_id → C-YYYY-#####
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_sales_file_id(broker_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  stored_year  INTEGER;
  next_id      INTEGER;
  file_id      TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  SELECT id_year, current_sales_id
    INTO stored_year, next_id
    FROM brokers
   WHERE id = broker_uuid;

  -- Reset counter on new year
  IF stored_year IS DISTINCT FROM current_year THEN
    next_id := 0;
    UPDATE brokers
       SET id_year          = current_year,
           current_agency_id = 0,
           current_sales_id  = 0
     WHERE id = broker_uuid;
  END IF;

  next_id := next_id + 1;

  UPDATE brokers
     SET current_sales_id = next_id
   WHERE id = broker_uuid;

  -- Format: C-YYYY-#####
  file_id := 'C-' || current_year || '-' || LPAD(next_id::TEXT, 5, '0');

  RETURN file_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- Trigger: auto-assign agency file ID on insert
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_agency_file_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.file_id IS NULL THEN
    NEW.file_id := generate_agency_file_id(NEW.broker_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agency_file_id_trigger ON agency_agreements;
CREATE TRIGGER agency_file_id_trigger
BEFORE INSERT ON agency_agreements
FOR EACH ROW
EXECUTE FUNCTION set_agency_file_id();

-- ─────────────────────────────────────────────
-- Trigger: auto-assign contract file ID on insert
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_transaction_file_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.file_id IS NULL THEN
    NEW.file_id := generate_sales_file_id(NEW.broker_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transaction_file_id_trigger ON transactions;
CREATE TRIGGER transaction_file_id_trigger
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_transaction_file_id();

-- ─────────────────────────────────────────────
-- Backfill existing records that have no file_id
-- Assigns IDs in created_at order
-- ─────────────────────────────────────────────
DO $$
DECLARE
  broker_rec      RECORD;
  agency_rec      RECORD;
  transaction_rec RECORD;
  agency_counter  INTEGER;
  sales_counter   INTEGER;
  current_year    INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  FOR broker_rec IN SELECT id FROM brokers LOOP
    agency_counter := 0;
    sales_counter  := 0;

    -- Backfill agency agreements
    FOR agency_rec IN
      SELECT id FROM agency_agreements
       WHERE broker_id = broker_rec.id AND file_id IS NULL
       ORDER BY created_at
    LOOP
      agency_counter := agency_counter + 1;
      UPDATE agency_agreements
         SET file_id = 'A-' || current_year || '-' || LPAD(agency_counter::TEXT, 5, '0')
       WHERE id = agency_rec.id;
    END LOOP;

    -- Backfill transactions
    FOR transaction_rec IN
      SELECT id FROM transactions
       WHERE broker_id = broker_rec.id AND file_id IS NULL
       ORDER BY created_at
    LOOP
      sales_counter := sales_counter + 1;
      UPDATE transactions
         SET file_id = 'C-' || current_year || '-' || LPAD(sales_counter::TEXT, 5, '0')
       WHERE id = transaction_rec.id;
    END LOOP;

    -- Update broker counters
    UPDATE brokers
       SET current_agency_id = agency_counter,
           current_sales_id  = sales_counter,
           id_year           = current_year
     WHERE id = broker_rec.id;
  END LOOP;
END $$;
