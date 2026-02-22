-- Backfill sort_order for existing compliance items based on form names

-- Residential Listing Forms
UPDATE agency_compliance_items
SET sort_order = 1
WHERE form_name = 'EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT & AGENCY DISCLOSURE';

UPDATE agency_compliance_items
SET sort_order = 2
WHERE form_name = 'Data Form - Residential';

UPDATE agency_compliance_items
SET sort_order = 3
WHERE form_name = 'SELLER''S PROPERTY CONDITION DISCLOSURE';

UPDATE agency_compliance_items
SET sort_order = 4
WHERE form_name = 'WIRE FRAUD ALERT DISCLOSURE';

UPDATE agency_compliance_items
SET sort_order = 5
WHERE form_name = 'DISCLOSURE & ACKNOWLEDGEMENT REGARDING LEAD-BASED PAINT AND/OR LEAD-BASED PAINT HAZARDS';

-- Residential Buyer Forms
UPDATE agency_compliance_items
SET sort_order = 1
WHERE form_name = 'EXCLUSIVE BUYER-BROKER AGREEMENT & AGENCY DISCLOSURE';

UPDATE agency_compliance_items
SET sort_order = 2
WHERE form_name = 'BUYER DUE DILIGENCE CHECKLIST';

UPDATE agency_compliance_items
SET sort_order = 3
WHERE form_name = 'FOR YOUR PROTECTION GET AN INSPECTION';

UPDATE agency_compliance_items
SET sort_order = 4
WHERE form_name = 'WIRE FRAUD ALERT';
