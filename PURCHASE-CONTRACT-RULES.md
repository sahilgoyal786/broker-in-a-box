# Purchase Contract Creation Rules

## Current Implementation (Feb 22, 2026)

Purchase contracts can ONLY be created from existing active agency agreements:
- User navigates to an active listing or buyer agreement detail page
- Clicks "Create Purchase Contract" button
- Form pre-fills with seller/property data from the agency
- Purchase contract links back to the agency via `agency_agreement_id`

**No standalone creation:** The "New Purchase Contract" button has been removed from the transactions table page.

## Future Exception: Document Upload Workflow (Primarily Buyer Agency)

When AI document processing is implemented, allow purchase contracts to be created from uploaded document packets.

**Why this is needed:**
- **Listings:** Agency agreement is typically already in the system (required before MLS submission), so purchase contract creation from listing works fine
- **Buyer Agency:** Buyer's agency agreement is often signed AT THE SAME TIME as the purchase contract (during offer presentation), so broker receives BOTH documents together via email

**Scenario:** Broker receives a complete buyer agency purchase contract packet via email that includes:
- Purchase contract (REPC)
- Buyer agency agreement (signed at same time as offer)
- Required disclosures (wire fraud, etc.)
- Other compliance documents

**Note:** This workflow is RARE for listings (listing agreement already exists before MLS submission) but COMMON for buyer agency deals.

**System should:**
1. Detect that packet contains both agency agreement AND purchase contract
2. Auto-create the agency agreement record from uploaded docs
3. Auto-create the purchase contract record
4. Link purchase contract to the newly-created agency (`agency_agreement_id`)
5. Auto-file all documents to appropriate compliance checklists
6. Mark compliance items as complete based on detected documents

**Why this matters:**
Many brokers receive complete deal packets via email from agents. They shouldn't have to manually create the agency record first if all the documents are already present. The AI should handle the entire workflow.

**Implementation note:**
Check for agency documents first. If found, create agency → then create transaction → then file all docs. If agency docs missing, reject the upload and ask for them.
