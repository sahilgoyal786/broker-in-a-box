# Inbound email setup (catch-all mailbox)

Every broker gets `<handle>@brokercommandcenter.com`. All of it lands in ONE Workspace mailbox
(`INBOUND_GMAIL_USER`), which the app reads through the Gmail API and attributes to a broker by
recipient address. Code: `lib/inbound/`, `app/api/inbound-email/gmail-push`, `app/api/cron/inbound-mailbox`.

## 1. Google Cloud (one project)
1. Enable the **Gmail API** and **Cloud Pub/Sub API**.
2. Create service account `inbound-reader`. Create a JSON key. Put it in Vercel as
   `INBOUND_GMAIL_SA_JSON` (raw JSON, or `base64 -i key.json`). Delete the local file afterwards.
3. Note the service account's **Unique ID (client ID)** for step 2.

## 2. Workspace domain-wide delegation
Admin console > Security > API controls > Domain-wide delegation > Add new:
- Client ID: the service account's unique ID
- Scope: `https://www.googleapis.com/auth/gmail.readonly`

(Keep this mailbox admin-restricted: it holds every tenant's mail.)

## 3. Pub/Sub
1. Create topic `gmail-inbound`. Grant **Pub/Sub Publisher** on it to
   `gmail-api-push@system.gserviceaccount.com`. Set `INBOUND_PUBSUB_TOPIC=projects/<id>/topics/gmail-inbound`.
2. Create service account `pubsub-push` (no roles needed). Set `INBOUND_PUSH_SERVICE_ACCOUNT` to its email.
3. Create a **push subscription** on the topic:
   - Endpoint: `https://<app domain>/api/inbound-email/gmail-push`
   - Enable authentication, service account `pubsub-push`, audience = the same endpoint URL
     (`INBOUND_PUSH_AUDIENCE`).

## 4. Vercel env + migration
- Run `supabase/20261006-inbound-mailbox.sql` in the Supabase SQL editor.
- Set the env vars in `.env.example` under "Inbound catch-all mailbox". `CRON_SECRET` is any long random string.
- Deploy. `vercel.json` registers a daily cron that renews the Gmail watch (it expires ~7 days) and sweeps
  for missed mail.

## 5. Start the watch and verify
Call the cron route once to start the watch and run the first sync:

    curl -H "Authorization: Bearer $CRON_SECRET" https://<app domain>/api/cron/inbound-mailbox

Then forward a test email (from Gmail and from Outlook) to `<handle>@brokercommandcenter.com` and check:
- `select subject, status, to_candidates from incoming_emails order by created_at desc;`
- Anything unattributed lands in `inbound_unmatched` with its `to_candidates` for debugging.

`to_candidates[].source` shows which header carried the alias. If forwarded mail from some provider ends up in
`inbound_unmatched` with no candidates, send the raw headers and extend `lib/inbound/resolve-recipient.ts`.
