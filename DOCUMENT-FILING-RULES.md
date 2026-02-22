# Document Filing Rules - Broker in a Box
## Critical workflow knowledge for Google Drive auto-filing (future feature)

---

## Folder Structure

### Listing Transaction
**Main Folder Format:** `[Agent Last Name]_[Agent First Name]_[Client Last Name]_listing`

**Subfolders:**
- `agency/` - Agency agreements and initial disclosures
- `contract/` - REPC and fully executed documents
- `miscellaneous/` - Everything else

### Buyer Transaction
**Main Folder Format:** `[Agent Last Name]_[Agent First Name]_[Client Last Name]_buyer`

**Subfolders:**
- `agency/` - Buyer agency agreement
- `contract/` - REPC and fully executed documents
- `miscellaneous/` - Everything else

---

## Seller Disclosure Workflow (CRITICAL)

### Stage 1: At Listing Appointment
**Document:** Seller's Property Disclosure Statement
**Signatures:** SELLER ONLY (not yet signed by buyer)
**File Location:** `agency/` folder
**Timing:** Same day as listing agreement or very shortly after

### Stage 2: After REPC Executed
**Document:** Same Seller's Property Disclosure Statement
**Signatures:** BOTH seller AND buyer (fully executed)
**File Location:** `contract/` folder
**Timing:** After buyer signs during REPC process

### The Rule
**One signature (seller) = agency folder**
**Both signatures (buyer + seller) = contract folder**

---

## Why This Matters

### For AI Document Processing (Future)
When Gmail integration reads a DocuSign email with seller disclosures:

1. **Check signature count:**
   - 1 signature → File to `agency/`
   - 2 signatures → File to `contract/`

2. **Update compliance tracking:**
   - Seller-only version: Satisfies "Seller Disclosure received" in agency checklist
   - Fully executed version: Satisfies "Seller Disclosure" in transaction checklist

3. **Don't duplicate:**
   - Same document, different execution status
   - Two different compliance items
   - Two different folders

### For Compliance Tracking
**Agency Agreement Checklist:**
- ☐ Listing Agreement (signed by seller + agent)
- ☐ Seller's Property Disclosure (signed by seller only)
- ☐ Lead-Based Paint Disclosure (if pre-1978, seller only)

**Transaction Checklist:**
- ☐ REPC (fully executed)
- ☐ Seller's Property Disclosure (signed by buyer + seller)
- ☐ Lead-Based Paint Disclosure (if pre-1978, signed by buyer + seller)
- ☐ Buyer's Inspection Notice
- ☐ ...etc

---

## Other Filing Rules

### REPC and Addenda
**Always go in:** `contract/` folder
**Must be:** Fully executed (all parties signed)

### Agency Agreements
**Always go in:** `agency/` folder
**Types:** Listing Agreement, Buyer Agency Agreement, Limited Agency Disclosure

### Earnest Money Receipt
**Goes in:** `contract/` folder
**From:** Title company or broker holding earnest money

### Inspection Reports
**Goes in:** `miscellaneous/` folder
**Exception:** Buyer's Inspection Notice (signed) goes in `contract/`

### MLS Data Input Form
**Goes in:** `agency/` folder (for listing) or `miscellaneous/` (for buyer)
**Note:** This is just data entry, not a contract document

---

## AI Rules for Gmail Integration (Phase 2)

### Step 1: Identify Document Type
Use AI to read PDF and identify:
- Document name (e.g., "Seller's Property Disclosure")
- Document type (agency agreement, disclosure, REPC, addendum, etc.)
- Number of signature blocks filled

### Step 2: Determine Folder
```
IF document == "Seller Disclosure" OR "Lead-Based Paint Disclosure":
  IF signatures.count == 1:
    folder = "agency/"
  ELSE IF signatures.count >= 2:
    folder = "contract/"
    
ELSE IF document.type == "Agency Agreement":
  folder = "agency/"
  
ELSE IF document.type == "REPC" OR "Addendum":
  folder = "contract/"
  
ELSE:
  folder = "miscellaneous/"
```

### Step 3: Update Compliance
- Mark corresponding checklist item as received
- Log file path and receipt date
- If duplicate (e.g., seller disclosure upgraded from 1 to 2 signatures), update existing record

---

## Compliance Template Implications

**Agency Agreement Templates:**
- Include "Seller Disclosure (seller signature)" as manual_checkbox
- Include "Lead-Based Paint (seller signature)" as manual_checkbox for pre-1978

**Transaction Templates:**
- Include "Seller Disclosure (fully executed)" as pdf_auto
- Include "Lead-Based Paint (fully executed)" as pdf_auto for pre-1978

**Both are tracked separately** because they serve different compliance purposes:
- Agency stage: "Did agent get disclosures from seller?"
- Transaction stage: "Did buyer receive and acknowledge disclosures?"

---

## Real-World Example

**Timeline:**
1. **Day 1:** Agent takes listing, gets seller disclosures signed → File to `agency/`
2. **Day 14:** Property goes active on MLS
3. **Day 30:** Buyer makes offer, REPC signed
4. **Day 31:** Agent sends seller disclosures to buyer's agent
5. **Day 32:** Buyer signs seller disclosures, returns to listing agent → File to `contract/`

**Result:**
- Same PDF, two locations
- Two compliance checkboxes (one in agency checklist, one in transaction checklist)
- Both required for full compliance audit trail

---

## Notes for Rob

This workflow is **Utah-specific** and follows REPC requirements. Other states may differ.

When we build Gmail integration (Phase 2), this logic will be built into the AI document classifier.

For now (Phase 1 / Launch), brokers will manually check boxes as they receive documents. The folder structure is documented here for future automation.
