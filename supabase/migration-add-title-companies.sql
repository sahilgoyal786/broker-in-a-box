-- Add seller's and buyer's title company fields to transactions table
-- 2026-02-21: Track both sides' title companies with contact details

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS seller_title_company TEXT,
ADD COLUMN IF NOT EXISTS seller_title_contact_name TEXT,
ADD COLUMN IF NOT EXISTS seller_title_contact_email TEXT,
ADD COLUMN IF NOT EXISTS seller_title_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS buyer_title_company TEXT,
ADD COLUMN IF NOT EXISTS buyer_title_contact_name TEXT,
ADD COLUMN IF NOT EXISTS buyer_title_contact_email TEXT,
ADD COLUMN IF NOT EXISTS buyer_title_contact_phone TEXT;
