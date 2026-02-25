# Add Environment Variables to Vercel

## Quick Steps:

1. Go to: https://vercel.com/aubrobs-projects/broker-in-a-box/settings/environment-variables

2. Add these two variables:

### Variable 1:
- **Name:** `MATON_API_KEY`
- **Value:** `***REMOVED-MATON-API-KEY***`
- **Environment:** Production, Preview, Development (check all three)

### Variable 2:
- **Name:** `GOOGLE_CALENDAR_CONNECTION_ID`
- **Value:** `90a653bd-3851-4860-aa62-e9d905df9c05`
- **Environment:** Production, Preview, Development (check all three)

3. Click "Save"

4. Redeploy: Click "Deployments" → Click the "..." menu on latest deployment → "Redeploy"

---

**Or run this command (I'll do it for you):**
I can add them via the Vercel API automatically.
