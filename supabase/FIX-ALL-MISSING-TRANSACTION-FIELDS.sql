-- COMPREHENSIVE FIX: Add all missing fields to transactions table
-- Run this ONCE in Supabase SQL Editor

-- Core client/transaction fields
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_first_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_last_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS contract_date DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS offer_reference_date DATE;

-- Buyer/Seller information
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_first_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_last_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_phone TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_first_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_last_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_email TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_phone TEXT;

-- Property details
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS property_city TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS property_state TEXT DEFAULT 'UT';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS property_zip TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS county TEXT;

-- Financial
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS earnest_money_amount DECIMAL(12,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS earnest_money_location TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS earnest_money_held_by TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS earnest_money_contact_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS earnest_money_contact_email TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS earnest_money_contact_phone TEXT;

-- Title companies
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_title_company TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_title_contact_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_title_contact_email TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_title_contact_phone TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_title_company TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_title_contact_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_title_contact_email TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_title_contact_phone TEXT;

-- Cooperating broker
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cooperating_brokerage TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cooperating_agent_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cooperating_agent_phone TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cooperating_agent_email TEXT;

-- Section 24 deadlines
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_disclosure_deadline DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS due_diligence_deadline DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS financing_appraisal_deadline DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS settlement_deadline DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS anticipated_closing_date DATE;

-- Custom deadlines
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS custom_deadline_1_label TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS custom_deadline_1_date DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS custom_deadline_2_label TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS custom_deadline_2_date DATE;

-- Limited agency
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS limited_agency_disclosure_received BOOLEAN DEFAULT FALSE;

-- Link to agency agreement
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agency_agreement_id UUID REFERENCES agency_agreements(id);
