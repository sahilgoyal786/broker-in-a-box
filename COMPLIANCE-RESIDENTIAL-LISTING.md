# Residential Listing Compliance - Implementation Plan

## Required Forms (Always)
1. **EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT & AGENCY DISCLOSURE**
   - Tracking: manual_checkbox (broker checks when signed)
   - Goes in: agency/ folder
   
2. **Data Form - Residential** (MLS Data Form)
   - Tracking: manual_checkbox (broker checks when submitted to MLS)
   - Goes in: agency/ folder
   
3. **WIRE FRAUD ALERT DISCLOSURE**
   - Tracking: manual_checkbox (broker checks when signed)
   - Goes in: agency/ folder
   
4. **SELLER'S PROPERTY CONDITION DISCLOSURE**
   - Tracking: manual_checkbox (broker checks when received from seller)
   - Goes in: agency/ folder
   - Note: Seller signature only at this stage

## Conditional Forms (Based on Property)
5. **DISCLOSURE & ACKNOWLEDGEMENT REGARDING LEAD-BASED PAINT AND/OR LEAD-BASED PAINT HAZARDS**
   - **ONLY REQUIRED if property built before 1978**
   - Tracking: manual_checkbox
   - Goes in: agency/ folder
   - **Logic:** Check `listings.year_built < 1978`
   - **If missing and required:** Show RED FLAG alert

## Optional Forms (Not Required)
6. Addendum to Exclusive Right To Sell Listing Agreement
7. MLS Listing Exclusion Form

---

## Database Structure

### Tables We'll Use
- `agency_agreements` - The listing contract record
- `listings` - Property details (includes year_built)
- `agency_compliance_items` - NEW table to track checkboxes

### New Table: agency_compliance_items
```sql
CREATE TABLE agency_compliance_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_agreement_id UUID REFERENCES agency_agreements(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL,
  tracking_type TEXT NOT NULL, -- 'manual_checkbox', 'pdf_auto', 'manual_upload'
  is_required BOOLEAN DEFAULT true,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  file_url TEXT, -- For pdf uploads
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## UI Implementation

### Agency Agreement Detail Page

Add new section after property details:

```
┌─────────────────────────────────────────────────┐
│ Compliance Checklist                            │
│ 4 of 5 forms complete (1 missing)              │
├─────────────────────────────────────────────────┤
│ ☑ EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT &  │
│   AGENCY DISCLOSURE                             │
│ ☑ Data Form - Residential                      │
│ ☑ WIRE FRAUD ALERT DISCLOSURE                  │
│ ☑ SELLER'S PROPERTY CONDITION DISCLOSURE       │
│ ☐ DISCLOSURE & ACKNOWLEDGEMENT REGARDING       │
│   LEAD-BASED PAINT AND/OR LEAD-BASED PAINT     │
│   HAZARDS 🚨 REQUIRED                           │
│   (Property built in 1975 - pre-1978)          │
└─────────────────────────────────────────────────┘
```

**Visual Rules:**
- ☑ Green checkmark = complete
- ☐ Gray checkbox = incomplete (not urgent)
- ☐ 🚨 Red flag = incomplete AND required (urgent)

---

## Logic Flow

### When Agency Agreement Created
1. Create the agency agreement record
2. Auto-create compliance checklist items:
   - Always create items 1-4 (required forms)
   - Check if property exists (linked listing)
   - If `listings.year_built < 1978` → Create lead-based paint item with `is_required=true`
   - If `listings.year_built >= 1978` → Don't create lead-based paint item (not needed)

### When Listing Property Details Added Later
1. Check if year_built < 1978
2. If yes AND lead-based paint item doesn't exist → Create it with `is_required=true`
3. Show red flag alert: "Lead-Based Paint Disclosure required (property built 1975)"

### When Broker Checks a Box
1. Update `is_complete = true`
2. Set `completed_at = NOW()`
3. Recalculate completion percentage
4. Update dashboard compliance count

---

## API Endpoints Needed

### GET /api/agencies/[id]/compliance
Returns checklist items for an agency agreement

### POST /api/agencies/[id]/compliance/[itemId]/toggle
Toggles checkbox on/off

### POST /api/agencies/[id]/compliance/refresh
Recalculates required items based on property year built

---

## Dashboard Integration

**Compliance Alerts Card:**
```
┌─────────────────────────────┐
│ Compliance Alerts           │
├─────────────────────────────┤
│ 3 listings missing forms    │
│ 2 transactions incomplete   │
│ 1 CE license expiring       │
└─────────────────────────────┘
```

Click to see detail list of what's missing where.

---

## Implementation Steps (Tonight/Tomorrow)

1. **Create migration** - Add agency_compliance_items table
2. **Seed residential listing** - Load the 4 required forms
3. **Build checklist component** - React component to show/toggle items
4. **Add to agency detail page** - Show checklist below property details
5. **Conditional logic** - Add lead-based paint if year_built < 1978
6. **Dashboard alert** - Count incomplete items
7. **Test** - Create listing for 1975 house, verify red flag shows

---

## Notes for Memory

**Pre-1978 Rule:** Federal law requires lead-based paint disclosure for properties built before 1978.

**Workflow:**
1. Agent takes listing
2. Agent adds property details (including year built)
3. System auto-checks year
4. If pre-1978 → Lead-based paint disclosure becomes REQUIRED
5. If missing → Show red flag alert on agency detail page AND dashboard

**This same logic will apply to transactions** - when REPC is created, if property is pre-1978, lead-based paint disclosure (fully executed with buyer signature) is required.

