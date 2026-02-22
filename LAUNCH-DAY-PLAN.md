# Launch Day Plan - 2026-02-22
## Goal: Launch Broker in a Box with first paying customer by 9 PM

---

## ✅ COMPLETED (Night Before)

### Core Compliance Tracking
- [x] Database structure (agency_compliance_items table)
- [x] Interactive checklist UI component
- [x] Auto-creation for residential listings (4-5 items)
- [x] Auto-creation for buyer agencies (4 items)
- [x] Pre-1978 lead paint disclosure logic
- [x] Workflow-based sort order
- [x] Real-time checkbox toggling
- [x] Completion count tracking
- [x] Missing forms alerts (red flags)

### Testing Verified
- [x] Create listing → compliance checklist appears automatically
- [x] Add property details (pre-1978) → lead paint disclosure added automatically
- [x] Create buyer agency → compliance checklist appears automatically
- [x] Checkboxes toggle and update counts in real-time

---

## 🎯 MORNING SESSION (6:30 AM - 12 PM)

### 1. Test Remaining Property Types (30 min)
**What:** Verify compliance checklists work for all property types

**Test each:**
- [ ] Vacant Land listing
- [ ] Multi-Unit listing
- [ ] Commercial listing
- [ ] Farm listing
- [ ] Residential Lease listing (may be incomplete - note for later)

**Expected:** Each creates appropriate compliance items automatically

---

### 2. Google Drive Folder Auto-Creation (2 hours)

**What:** When agency agreement or transaction created → auto-create folder in broker's Google Drive

**Folder structure:**
```
[Agent Last]_[Agent First]_[Client Last]_listing/
  ├── agency/
  ├── contract/
  └── miscellaneous/

[Agent Last]_[Agent First]_[Client Last]_buyer/
  ├── agency/
  ├── contract/
  └── miscellaneous/
```

**Implementation:**
1. Google Drive API setup (OAuth scope: drive.file)
2. Create folder on agency agreement creation
3. Store `drive_folder_id` in database
4. Create subfolders (agency, contract, miscellaneous)
5. Test: Create listing → check Google Drive for new folder

**Files to create:**
- `lib/google/drive-client.ts` - Drive API wrapper
- `lib/google/create-agency-folder.ts` - Folder creation logic
- Update agency creation forms to trigger folder creation

---

### 3. Gmail API Integration (1 hour)

**What:** Watch broker's Gmail for incoming DocuSign emails

**Implementation:**
1. Gmail API setup (OAuth scope: gmail.readonly)
2. Set up Gmail watch (push notifications via webhook)
3. Create webhook endpoint to receive notifications
4. Parse email for attachments
5. Test: Send test email → webhook receives notification

**Files to create:**
- `lib/google/gmail-client.ts` - Gmail API wrapper
- `lib/google/setup-gmail-watch.ts` - Watch setup
- `app/api/webhooks/gmail/route.ts` - Webhook endpoint

---

## 🚀 AFTERNOON SESSION (12 PM - 6 PM)

### 4. AI Document Processor (3 hours)

**What:** Read PDF attachments, identify forms, extract data

**Implementation:**
1. Download PDF attachment from Gmail
2. Extract text using PDF parser
3. Use AI (OpenRouter) to identify document type
4. Extract key data (signatures, dates, etc.)
5. Match to compliance checklist form names
6. Test: Feed sample REPC PDF → AI identifies form type

**AI Matching Rules:**
- Case-insensitive fuzzy match (95%+ threshold)
- Match against exact form names in database
- Count signatures (1 = agency folder, 2+ = contract folder)
- Handle OCR errors gracefully

**Files to create:**
- `lib/ai/identify-document.ts` - AI document classifier
- `lib/ai/extract-signatures.ts` - Count signature blocks
- `lib/pdf/parse-pdf.ts` - PDF text extraction

---

### 5. Auto-File to Google Drive (1 hour)

**What:** Take identified PDF and file to correct subfolder

**Logic:**
```
IF form == "Seller Disclosure" OR "Lead-Based Paint":
  IF signatures.count == 1:
    folder = "agency/"
  ELSE IF signatures.count >= 2:
    folder = "contract/"
ELSE IF form.type == "Agency Agreement":
  folder = "agency/"
ELSE IF form.type == "REPC" OR "Addendum":
  folder = "contract/"
ELSE:
  folder = "miscellaneous/"
```

**Files to create:**
- `lib/google/file-to-drive.ts` - Upload PDF to Drive subfolder
- `lib/compliance/determine-folder.ts` - Folder logic

---

### 6. Auto-Check Compliance Boxes (30 min)

**What:** When form identified → check corresponding compliance box

**Implementation:**
1. AI identifies form → returns form_name
2. Look up compliance item by form_name + agency_agreement_id
3. Update is_complete = true, completed_at = now()
4. Test: Process REPC PDF → see checkbox auto-check

**Files to modify:**
- Add function to mark compliance item complete
- Link document processor to compliance checker

---

### 7. Live End-to-End Test (1 hour)

**What:** Rob emails real documents, system processes them

**Test flow:**
1. Rob creates listing agreement in system (gets folder + compliance checklist)
2. Rob emails listing contract PDF to broker's Gmail
3. System receives Gmail notification
4. Downloads PDF attachment
5. AI identifies: "EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT & AGENCY DISCLOSURE"
6. Files to `agency/` subfolder in Drive
7. Checks compliance box automatically
8. Rob refreshes page → sees checkbox checked, file link in Drive

**Test documents:**
- Listing contract (should → agency/ folder, check box #1)
- Seller disclosure with 1 signature (should → agency/ folder, check box #3)
- REPC with 2 signatures (should → contract/ folder)
- Seller disclosure with 2 signatures (should → contract/ folder)

---

## 🎉 EVENING SESSION (6 PM - 9 PM)

### 8. Final Polish & Testing (1-2 hours)
- [ ] End-to-end workflow test (create listing → email docs → verify auto-processing)
- [ ] Error handling (what if AI can't identify form? → miscellaneous/ folder + flag for review)
- [ ] Mobile responsiveness check
- [ ] Spell check all UI text
- [ ] Create simple "Getting Started" guide PDF

### 9. Launch Preparation (30 min)
- [ ] Create demo broker account with sample data
- [ ] Write launch email to first customer
- [ ] Prepare support plan (your cell for first 10 customers)

### 10. LAUNCH 🚀 (30 min)
- [ ] Send invite email to broker currently paying $500/mo for Dotloop
- [ ] Offer: Free first month + $100/mo if commits to 1 year
- [ ] Schedule onboarding call
- [ ] Monitor for issues

---

## 📋 KEY DECISIONS TO MAKE

1. **Gmail watch vs polling?**
   - Watch = real-time (recommended)
   - Polling = simpler but delayed

2. **AI model for document classification?**
   - OpenRouter GPT-4o-mini (cheap, fast, good enough)
   - Can upgrade to GPT-4o for better accuracy later

3. **Error handling strategy?**
   - Can't identify form → file to miscellaneous/, flag for manual review
   - Can't determine folder → default to miscellaneous/
   - Send broker notification when manual review needed?

4. **What if broker forwards email instead of receives directly?**
   - Parse forwarded emails (extract original sender, date)
   - Or require dedicated Gmail account (simpler, more reliable)

---

## 🚨 RISK MITIGATION

**If AI document processing takes too long:**
- Launch without it (manual compliance checkboxes still work)
- Add Gmail/Drive integration in v1.1
- Still 70% cheaper than Dotloop with better data ownership

**If Google API setup is complex:**
- Use broker's existing Google account (they connect via OAuth)
- No backend service account needed
- Data stays in their control (selling point!)

**If first customer has issues:**
- Personal onboarding call (30 min)
- Direct text/call support
- Fix issues in real-time
- Turn feedback into features

---

## ✅ SUCCESS CRITERIA

**Minimum viable launch:**
- [ ] Compliance tracking works for all property types
- [ ] Manual checkboxes functional
- [ ] Dashboard shows compliance alerts
- [ ] First customer can use it for real transactions

**Ideal launch:**
- [ ] Gmail integration receiving emails
- [ ] Google Drive folders auto-created
- [ ] AI document processing working
- [ ] End-to-end automation functional
- [ ] First customer blown away by auto-filing

---

## 💪 YOU'VE GOT THIS

You've built:
- ✅ Authentication & authorization
- ✅ Agent management with bulk upload
- ✅ Agency agreements (listings & buyer)
- ✅ Transaction tracking
- ✅ Compliance checklists (auto-created, real-time)
- ✅ Dashboard with metrics
- ✅ CE & NAR compliance tracking

**That's a working SaaS product!**

The Gmail/Drive/AI integration is the **cherry on top**. Even if you launch without it, you have a product worth $150/month.

Tomorrow night, you'll have your first paying customer. 🚀

**Get some rest. Tomorrow you launch.** 💪
