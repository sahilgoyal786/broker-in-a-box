-- ============================================================
-- Broker in a Box — Seed Data
-- System-level compliance templates (broker_id = NULL)
-- Run AFTER schema.sql
-- ============================================================

-- ── residential / listing ──────────────────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values (null, 'residential', 'listing', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('Exclusive Right to Sell Listing Agreement - Designated Agency', 'exclusive_right_to_sell_listing', 'pdf_auto', 1, true, 'Exclusive Right to Sell Listing Agreement & Agency Disclosure', 'UAR Form 61U', 'Primary listing contract'),
  ('Residential Listing Input Form', 'residential_listing_input', 'pdf_auto', 2, true, 'MLS Data Input — Residential', null, 'Agent fills MLS form -> DocuSign -> publishes listing'),
  ('Wire Fraud Alert Disclosure', 'wire_fraud_alert_disclosure', 'pdf_auto', 3, true, 'Wire Fraud Alert Disclosure', 'UAR Form 76U (or similar)', 'Required for all transaction types'),
  ('Seller''s Property Condition Disclosure', 'sellers_pcd_residential', 'pdf_auto', 4, true, 'Seller''s Property Condition Disclosure — Residential', 'UAR Form 7U (or similar)', '11-page residential disclosure form'),
  ('Lead-Based Paint Disclosure and Acknowledgement', 'lead_based_paint', 'pdf_auto', 5, false, 'Lead-Based Paint Addendum', 'UAR Form (Lead-Based Paint)', 'Pre-1978 properties only — optional/conditional'),
  ('Exclusive Right To Sell Listing Agreement & Agency Disclosure (Blank), Addendum to', 'listing_agreement_addendum', 'pdf_auto', 6, false, 'Addendum to Listing Agreement', null, 'Optional addendum to listing agreement'),
  ('MLS Listing Exclusion Form', 'mls_listing_exclusion', 'manual_checkbox', 7, false, 'MLS Listing Exclusion Form', null, 'MLS office exclusion')
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'residential' and t.transaction_type = 'listing';

-- ── residential / buyer_agency ─────────────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values (null, 'residential', 'buyer_agency', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('Exclusive Buyer-Broker Agreement - Designated Agency', 'exclusive_buyer_broker', 'pdf_auto', 1, true, 'Exclusive Buyer-Broker Agreement & Agency Disclosure', 'UAR Form 8B (or similar)', 'Required before showing homes'),
  ('Buyer Due Diligence Checklist', 'buyer_due_diligence', 'pdf_auto', 2, true, 'Buyer Due Diligence Checklist', null, null),
  ('For Your Protection Get an Inspection', 'for_your_protection_inspection', 'manual_checkbox', 3, true, 'For Your Protection: Get a Home Inspection (HUD)', null, 'HUD/FHA disclosure'),
  ('Wire Fraud Alert', 'wire_fraud_alert', 'pdf_auto', 4, true, 'Wire Fraud Alert Disclosure', 'UAR Form 76U (or similar)', 'Same form, different name in buyer sections'),
  ('Exclusive Buyer Broker Agreement & Agency Disclosure (Blank), Addendum to', 'buyer_broker_addendum', 'pdf_auto', 5, false, 'Addendum to Exclusive Buyer-Broker Agreement', null, 'Optional addendum')
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'residential' and t.transaction_type = 'buyer_agency';

-- ── residential / seller_purchase ─────────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values (null, 'residential', 'seller_purchase', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('All Seller Agency Documents and', 'inherited_seller_agency', 'inherited', 1, true, '(CUMULATIVE) — All Listing documents carry forward', null, 'Not a form — means all listing section docs are also required here'),
  ('Real Estate Purchase Contract (REPC)', 'repc', 'pdf_auto', 2, true, 'Real Estate Purchase Contract', 'Commission/AG Approved — Standard, Land, Commercial, or New Construction version', 'AI will identify which version based on content'),
  ('Seller''s Property Condition Disclosure Signed by Buyer', 'sellers_pcd_buyer_signed', 'pdf_auto', 3, true, 'Seller''s Property Condition Disclosure (Buyer-signed copy)', null, 'Confirmation buyer received disclosure'),
  ('Confirmation of Receipt of Earnest Money', 'earnest_money_confirmation', 'pdf_auto', 4, true, 'Confirmation of Receipt', null, 'May come from title company'),
  ('All Addenda', 'all_addenda', 'optional_any', 5, false, '(SITUATIONAL) — Any addenda used on this transaction', null, 'These are optional — added as needed per transaction'),
  ('Lead-Based Paint Disclosure and Acknowledgement Signed by Buyer', 'lead_based_paint_buyer', 'pdf_auto', 6, false, 'Lead-Based Paint Addendum (Buyer-signed copy)', null, 'Under-contract copy signed by buyer')
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'residential' and t.transaction_type = 'seller_purchase';

-- ── residential / buyer_purchase ──────────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values (null, 'residential', 'buyer_purchase', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('All buyer agency documents and', 'inherited_buyer_agency', 'inherited', 1, true, '(CUMULATIVE) — All Buyer Agency documents carry forward', null, 'Not a form — carry-forward reference'),
  ('Real Estate Purchase Contract (REPC)', 'repc', 'pdf_auto', 2, true, 'Real Estate Purchase Contract', 'Commission/AG Approved — Standard, Land, Commercial, or New Construction version', null),
  ('Seller''s Property Condition Disclosure Signed by Buyer', 'sellers_pcd_buyer_signed', 'pdf_auto', 3, true, 'Seller''s Property Condition Disclosure (Buyer-signed copy)', null, null),
  ('Confirmation of Receipt of Earnest Money', 'earnest_money_confirmation', 'pdf_auto', 4, true, 'Confirmation of Receipt', null, null),
  ('Copy of EM Check', 'em_check_copy', 'manual_upload', 5, true, 'Copy of Earnest Money Check', null, 'Physical check copy — scanned and uploaded, not a form'),
  ('Earnest Money Bank Deposit Receipt', 'em_bank_deposit', 'manual_upload', 6, true, 'Earnest Money Bank Deposit Receipt', null, 'Bank receipt — scanned and uploaded'),
  ('All Addenda', 'all_addenda', 'optional_any', 7, false, '(SITUATIONAL) — Any addenda used on this transaction', null, null),
  ('Lead-Based Paint Disclosure and Acknowledgement Signed by Buyer', 'lead_based_paint_buyer', 'pdf_auto', 8, false, 'Lead-Based Paint Addendum (Buyer-signed copy)', null, null)
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'residential' and t.transaction_type = 'buyer_purchase';

-- ── residential / unrepresented_buyer ─────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values (null, 'residential', 'unrepresented_buyer', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('All the seller purchase documents including seller agency and', 'inherited_seller_purchase', 'inherited', 1, true, '(CUMULATIVE) — All seller purchase + listing docs carry forward', null, null),
  ('Unrepresented Buyer Disclosure', 'unrepresented_buyer_disclosure', 'pdf_auto', 2, true, 'Unrepresented Buyer Disclosure', null, null),
  ('Buyer Due Diligence Checklist', 'buyer_due_diligence', 'pdf_auto', 3, true, 'Buyer Due Diligence Checklist', null, null),
  ('For Your Protection Get an Inspection', 'for_your_protection_inspection', 'manual_checkbox', 4, true, 'For Your Protection: Get a Home Inspection (HUD)', null, null),
  ('Wire Fraud Alert', 'wire_fraud_alert', 'pdf_auto', 5, true, 'Wire Fraud Alert Disclosure', 'UAR Form 76U (or similar)', null),
  ('Copy of EM Check', 'em_check_copy', 'manual_upload', 6, true, 'Copy of Earnest Money Check', null, null),
  ('Earnest Money Bank Deposit Receipt', 'em_bank_deposit', 'manual_upload', 7, true, 'Earnest Money Bank Deposit Receipt', null, null)
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'residential' and t.transaction_type = 'unrepresented_buyer';

-- ── residential / fsbo_purchase ────────────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values (null, 'residential', 'fsbo_purchase', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('All the buyer purchase documents including the buyer agency documents', 'inherited_buyer_purchase', 'inherited', 1, true, '(CUMULATIVE) — All buyer purchase + buyer agency docs carry forward', null, null),
  ('For Sale by Owner Commission Agreement & Agency Disclosure', 'fsbo_commission_agreement', 'pdf_auto', 2, true, 'For Sale by Owner Commission Agreement & Agency Disclosure', 'UAR Form (FSBO)', 'FSBO transactions only'),
  ('Wire Fraud Alert from the Seller', 'wire_fraud_alert_seller', 'pdf_auto', 3, true, 'Wire Fraud Alert Disclosure (Seller copy for FSBO)', 'UAR Form 76U (or similar)', 'FSBO — seller must also sign wire fraud alert')
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'residential' and t.transaction_type = 'fsbo_purchase';

-- ── vacant_land / listing ──────────────────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values (null, 'vacant_land', 'listing', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('Exclusive Right to Sell Listing Agreement - Designated Agency', 'exclusive_right_to_sell_listing', 'pdf_auto', 1, true, 'Exclusive Right to Sell Listing Agreement & Agency Disclosure', 'UAR Form 61U', 'Primary listing contract'),
  ('Land Listing Input Form', 'land_listing_input', 'pdf_auto', 2, true, 'MLS Data Input — Land', null, 'Agent fills MLS form -> DocuSign -> publishes listing'),
  ('Wire Fraud Alert Disclosure', 'wire_fraud_alert_disclosure', 'pdf_auto', 3, true, 'Wire Fraud Alert Disclosure', 'UAR Form 76U (or similar)', null),
  ('Seller''s Property Condition Disclosure -- Land', 'sellers_pcd_land', 'pdf_auto', 4, true, 'Seller''s Property Condition Disclosure — Land', 'UAR Form 8U (or similar)', 'Land-specific disclosure'),
  ('Exclusive Right To Sell Listing Agreement & Agency Disclosure (Blank), Addendum to', 'listing_agreement_addendum', 'pdf_auto', 5, false, 'Addendum to Listing Agreement', null, null),
  ('MLS Listing Exclusion Form', 'mls_listing_exclusion', 'manual_checkbox', 6, false, 'MLS Listing Exclusion Form', null, null)
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'vacant_land' and t.transaction_type = 'listing';

-- ── vacant_land / buyer_agency ────────────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values (null, 'vacant_land', 'buyer_agency', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('Exclusive Buyer-Broker Agreement - Designated Agency', 'exclusive_buyer_broker', 'pdf_auto', 1, true, 'Exclusive Buyer-Broker Agreement & Agency Disclosure', 'UAR Form 8B (or similar)', null),
  ('Buyer Due Diligence Checklist', 'buyer_due_diligence', 'pdf_auto', 2, true, 'Buyer Due Diligence Checklist', null, null),
  ('Wire Fraud Alert', 'wire_fraud_alert', 'pdf_auto', 3, true, 'Wire Fraud Alert Disclosure', 'UAR Form 76U (or similar)', null),
  ('Exclusive Buyer Broker Agreement & Agency Disclosure (Blank), Addendum to', 'buyer_broker_addendum', 'pdf_auto', 4, false, 'Addendum to Exclusive Buyer-Broker Agreement', null, null)
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'vacant_land' and t.transaction_type = 'buyer_agency';

-- ── vacant_land / seller_purchase & buyer_purchase ─────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values
  (null, 'vacant_land', 'seller_purchase', false),
  (null, 'vacant_land', 'buyer_purchase', false),
  (null, 'vacant_land', 'unrepresented_buyer', false),
  (null, 'vacant_land', 'fsbo_purchase', false)
on conflict do nothing;

-- vacant_land seller_purchase
insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('Real Estate Purchase Contract (REPC)', 'repc', 'pdf_auto', 1, true, 'Real Estate Purchase Contract', 'Commission/AG Approved — Land version', null),
  ('Seller''s Property Condition Disclosure -- Land Signed by Buyer', 'sellers_pcd_land_buyer_signed', 'pdf_auto', 2, true, 'Seller''s Property Condition Disclosure — Land (Buyer-signed copy)', null, null),
  ('Confirmation of Receipt of Earnest Money', 'earnest_money_confirmation', 'pdf_auto', 3, true, 'Confirmation of Receipt', null, null),
  ('All Addenda', 'all_addenda', 'optional_any', 4, false, '(SITUATIONAL)', null, null)
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'vacant_land' and t.transaction_type = 'seller_purchase';

-- vacant_land buyer_purchase
insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('Real Estate Purchase Contract (REPC)', 'repc', 'pdf_auto', 1, true, 'Real Estate Purchase Contract', null, null),
  ('Seller''s Property Condition Disclosure -- Land Signed by Buyer', 'sellers_pcd_land_buyer_signed', 'pdf_auto', 2, true, null, null, null),
  ('Confirmation of Receipt of Earnest Money', 'earnest_money_confirmation', 'pdf_auto', 3, true, null, null, null),
  ('Copy of EM Check', 'em_check_copy', 'manual_upload', 4, true, 'Copy of Earnest Money Check', null, null),
  ('Earnest Money Bank Deposit Receipt', 'em_bank_deposit', 'manual_upload', 5, true, null, null, null),
  ('All Addenda', 'all_addenda', 'optional_any', 6, false, null, null, null)
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'vacant_land' and t.transaction_type = 'buyer_purchase';

-- ── commercial / listing ───────────────────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values
  (null, 'commercial', 'listing', false),
  (null, 'commercial', 'buyer_agency', false),
  (null, 'commercial', 'seller_purchase', false),
  (null, 'commercial', 'buyer_purchase', false),
  (null, 'commercial', 'unrepresented_buyer', false),
  (null, 'commercial', 'fsbo_purchase', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('Exclusive Right to Sell Listing Agreement - Designated Agency', 'exclusive_right_to_sell_listing', 'pdf_auto', 1, true, null, 'UAR Form 61U', null),
  ('Commercial Listing Input Form', 'commercial_listing_input', 'pdf_auto', 2, true, 'MLS Data Input — Commercial', null, null),
  ('Wire Fraud Alert Disclosure', 'wire_fraud_alert_disclosure', 'pdf_auto', 3, true, null, null, null),
  ('Seller''s Property Condition Disclosure', 'sellers_pcd_commercial', 'pdf_auto', 4, true, 'Commercial Real Property Disclosure', null, 'Used for Commercial and Multi-Unit'),
  ('Exclusive Right To Sell Listing Agreement & Agency Disclosure (Blank), Addendum to', 'listing_agreement_addendum', 'pdf_auto', 5, false, null, null, null),
  ('MLS Listing Exclusion Form', 'mls_listing_exclusion', 'manual_checkbox', 6, false, null, null, null)
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'commercial' and t.transaction_type = 'listing';

-- ── multi_unit / listing ───────────────────────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values
  (null, 'multi_unit', 'listing', false),
  (null, 'multi_unit', 'buyer_agency', false),
  (null, 'multi_unit', 'seller_purchase', false),
  (null, 'multi_unit', 'buyer_purchase', false),
  (null, 'multi_unit', 'unrepresented_buyer', false),
  (null, 'multi_unit', 'fsbo_purchase', false)
on conflict do nothing;

insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('Exclusive Right to Sell Listing Agreement - Designated Agency', 'exclusive_right_to_sell_listing', 'pdf_auto', 1, true, null, 'UAR Form 61U', null),
  ('Duplex, Triplex, Fourplex / Apartment (more than 4 units )Listing Input Form', 'multi_unit_listing_input', 'pdf_auto', 2, true, 'MLS Data Input — Multi-Unit', null, null),
  ('Wire Fraud Alert Disclosure', 'wire_fraud_alert_disclosure', 'pdf_auto', 3, true, null, null, null),
  ('Commercial Seller''s Property Condition Disclosure', 'sellers_pcd_commercial', 'pdf_auto', 4, true, 'Commercial Real Property Disclosure', null, 'Used for Commercial and Multi-Unit'),
  ('Lead-Based Paint Disclosure and Acknowledgement', 'lead_based_paint', 'pdf_auto', 5, false, null, null, 'Pre-1978 properties only'),
  ('Exclusive Right To Sell Listing Agreement & Agency Disclosure (Blank), Addendum to', 'listing_agreement_addendum', 'pdf_auto', 6, false, null, null, null),
  ('MLS Listing Exclusion Form', 'mls_listing_exclusion', 'manual_checkbox', 7, false, null, null, null)
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'multi_unit' and t.transaction_type = 'listing';

-- ── mobile_home — same forms as residential ────────────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values
  (null, 'mobile_home', 'listing', false),
  (null, 'mobile_home', 'buyer_agency', false),
  (null, 'mobile_home', 'seller_purchase', false),
  (null, 'mobile_home', 'buyer_purchase', false),
  (null, 'mobile_home', 'unrepresented_buyer', false),
  (null, 'mobile_home', 'fsbo_purchase', false)
on conflict do nothing;

-- mobile_home uses same forms as residential (listed separately for flexibility)
insert into template_forms (template_id, form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
select t.id, f.form_name, f.form_identifier, f.tracking_type::tracking_type, f.sort_order, f.is_required, f.official_name, f.uar_form, f.notes
from compliance_templates t,
(values
  ('Exclusive Right to Sell Listing Agreement - Designated Agency', 'exclusive_right_to_sell_listing', 'pdf_auto', 1, true, null, 'UAR Form 61U', null),
  ('Residential Listing Input Form', 'residential_listing_input', 'pdf_auto', 2, true, null, null, null),
  ('Wire Fraud Alert Disclosure', 'wire_fraud_alert_disclosure', 'pdf_auto', 3, true, null, null, null),
  ('Seller''s Property Condition Disclosure', 'sellers_pcd_residential', 'pdf_auto', 4, true, null, null, null),
  ('Lead-Based Paint Disclosure and Acknowledgement', 'lead_based_paint', 'pdf_auto', 5, false, null, null, 'Pre-1978 properties only'),
  ('Exclusive Right To Sell Listing Agreement & Agency Disclosure (Blank), Addendum to', 'listing_agreement_addendum', 'pdf_auto', 6, false, null, null, null),
  ('MLS Listing Exclusion Form', 'mls_listing_exclusion', 'manual_checkbox', 7, false, null, null, null)
) as f(form_name, form_identifier, tracking_type, sort_order, is_required, official_name, uar_form, notes)
where t.broker_id is null and t.property_type = 'mobile_home' and t.transaction_type = 'listing';

-- ── farm & residential_lease — empty placeholders ──────────
insert into compliance_templates (broker_id, property_type, transaction_type, is_custom)
values
  (null, 'farm', 'listing', false),
  (null, 'farm', 'buyer_agency', false),
  (null, 'farm', 'seller_purchase', false),
  (null, 'farm', 'buyer_purchase', false),
  (null, 'farm', 'unrepresented_buyer', false),
  (null, 'farm', 'fsbo_purchase', false),
  (null, 'residential_lease', 'listing', false),
  (null, 'residential_lease', 'buyer_agency', false),
  (null, 'residential_lease', 'seller_purchase', false),
  (null, 'residential_lease', 'buyer_purchase', false),
  (null, 'residential_lease', 'unrepresented_buyer', false),
  (null, 'residential_lease', 'fsbo_purchase', false)
on conflict do nothing;
-- No forms for farm/lease yet — to be filled in later
