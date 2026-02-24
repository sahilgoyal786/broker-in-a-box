-- Add file ID tracking to brokers table
ALTER TABLE brokers
ADD COLUMN current_sales_id INTEGER DEFAULT 0,
ADD COLUMN current_agency_id INTEGER DEFAULT 0,
ADD COLUMN id_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Add file_id to agency_agreements
ALTER TABLE agency_agreements
ADD COLUMN file_id VARCHAR(20) UNIQUE;

-- Add file_id to transactions
ALTER TABLE transactions
ADD COLUMN file_id VARCHAR(20) UNIQUE;

-- Create index for file_id lookups
CREATE INDEX idx_agency_file_id ON agency_agreements(file_id);
CREATE INDEX idx_transaction_file_id ON transactions(file_id);

-- Function to generate next agency file ID
CREATE OR REPLACE FUNCTION generate_agency_file_id(broker_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  stored_year INTEGER;
  next_id INTEGER;
  file_id TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get broker's current counters
  SELECT id_year, current_agency_id 
  INTO stored_year, next_id
  FROM brokers 
  WHERE id = broker_uuid;
  
  -- Reset counter if new year
  IF stored_year != current_year THEN
    next_id := 0;
    UPDATE brokers 
    SET id_year = current_year, 
        current_agency_id = 0,
        current_sales_id = 0
    WHERE id = broker_uuid;
  END IF;
  
  -- Increment counter
  next_id := next_id + 1;
  
  -- Update broker's counter
  UPDATE brokers 
  SET current_agency_id = next_id
  WHERE id = broker_uuid;
  
  -- Generate file ID: YYYY-A#####
  file_id := current_year || '-A' || LPAD(next_id::TEXT, 5, '0');
  
  RETURN file_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate next sales file ID
CREATE OR REPLACE FUNCTION generate_sales_file_id(broker_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  stored_year INTEGER;
  next_id INTEGER;
  file_id TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get broker's current counters
  SELECT id_year, current_sales_id 
  INTO stored_year, next_id
  FROM brokers 
  WHERE id = broker_uuid;
  
  -- Reset counter if new year
  IF stored_year != current_year THEN
    next_id := 0;
    UPDATE brokers 
    SET id_year = current_year, 
        current_agency_id = 0,
        current_sales_id = 0
    WHERE id = broker_uuid;
  END IF;
  
  -- Increment counter
  next_id := next_id + 1;
  
  -- Update broker's counter
  UPDATE brokers 
  SET current_sales_id = next_id
  WHERE id = broker_uuid;
  
  -- Generate file ID: YYYY-S#####
  file_id := current_year || '-S' || LPAD(next_id::TEXT, 5, '0');
  
  RETURN file_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate file_id on agency creation
CREATE OR REPLACE FUNCTION set_agency_file_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.file_id IS NULL THEN
    NEW.file_id := generate_agency_file_id(NEW.broker_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_file_id_trigger
BEFORE INSERT ON agency_agreements
FOR EACH ROW
EXECUTE FUNCTION set_agency_file_id();

-- Trigger to auto-generate file_id on transaction creation
CREATE OR REPLACE FUNCTION set_transaction_file_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.file_id IS NULL THEN
    NEW.file_id := generate_sales_file_id(NEW.broker_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_file_id_trigger
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_transaction_file_id();

-- Backfill existing records (optional - run if you want to assign IDs to existing data)
-- WARNING: This will assign file IDs to existing records in creation order
-- Comment out if you don't want to backfill

DO $$
DECLARE
  broker_rec RECORD;
  agency_rec RECORD;
  transaction_rec RECORD;
  agency_counter INTEGER;
  sales_counter INTEGER;
BEGIN
  -- For each broker
  FOR broker_rec IN SELECT id FROM brokers LOOP
    agency_counter := 0;
    sales_counter := 0;
    
    -- Backfill agencies
    FOR agency_rec IN 
      SELECT id FROM agency_agreements 
      WHERE broker_id = broker_rec.id AND file_id IS NULL
      ORDER BY created_at
    LOOP
      agency_counter := agency_counter + 1;
      UPDATE agency_agreements
      SET file_id = '2026-A' || LPAD(agency_counter::TEXT, 5, '0')
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
      SET file_id = '2026-S' || LPAD(sales_counter::TEXT, 5, '0')
      WHERE id = transaction_rec.id;
    END LOOP;
    
    -- Update broker's counters
    UPDATE brokers
    SET current_agency_id = agency_counter,
        current_sales_id = sales_counter,
        id_year = 2026
    WHERE id = broker_rec.id;
  END LOOP;
END $$;
