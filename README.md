# Broker in a Box

A real-estate brokerage compliance and transaction management tool, built with [Next.js](https://nextjs.org) (App Router) and [Supabase](https://supabase.com) (Postgres + Auth).

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Google Cloud](https://console.cloud.google.com) project, if you want broker sign-in (brokers authenticate via Google OAuth)

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard).
2. Open the SQL Editor and run **`supabase/schema-current.sql`** — this is the maintained baseline schema for a fresh project. It creates all 10 tables, enables row-level security with policies scoped per broker, and creates the `certificates` storage bucket with its policies — this one file is the complete setup. (Ignore `supabase/schema.sql`, `supabase/seed.sql`, `SUPABASE-STORAGE-SETUP.md`, and the ~60 `add-*.sql` / `migration-*.sql` files elsewhere in `supabase/` — those all belong to the *original* project's older schema and are incompatible with this baseline. In particular, `seed.sql` inserts into `compliance_templates`/`template_forms` tables that don't exist in `schema-current.sql` — the app builds compliance checklists from a hardcoded list in `lib/compliance/initialize-agency-compliance.ts` instead, so no seeding step is needed.)
3. Enable Google as an Auth provider (**Authentication → Providers → Google**) — brokers sign in with Google (see step 3 below for the OAuth client). Email/password sign-in (used for agents, who join via an emailed invite link) is enabled by default.

## 3. Set up Google OAuth (for broker sign-in)

Brokers sign in with Google, and the app requests Gmail/Drive/Calendar scopes so it can send mail and sync deadlines on the broker's behalf.

1. In [Google Cloud Console](https://console.cloud.google.com), create an OAuth 2.0 Client ID (Web application).
2. Add this Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback` (find `<your-project-ref>` in your Supabase project URL).
3. Enable the Gmail API, Google Drive API, and Google Calendar API for the project.
4. Add the scopes `gmail.readonly`, `drive`, and `calendar` to the OAuth consent screen. Note that these are sensitive/restricted scopes — for local development, add your own Google account as a test user; going to production requires Google's OAuth verification review.
5. Paste the Client ID and Client Secret into Supabase (**Authentication → Providers → Google**) and into your `.env.local` (see below).

## 4. Configure environment variables

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key. **Never expose this to the browser or commit it** — it bypasses row-level security. | Yes |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | The OAuth client from step 3 | Yes, for broker Google sign-in |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys (see `EMAIL-SETUP.md`) | No — without it, invite/notification emails log to the console instead of sending |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM_EMAIL` | Your SMTP provider | No — fallback if not using Resend |
| `MATON_API_KEY` / `GOOGLE_CALENDAR_CONNECTION_ID` | [Maton](https://maton.ai) — used to sync transaction deadlines to a Google Calendar (see `MLS-ALERT-INTEGRATION.md` / `setup-rebrokerinabox-calendar.md`) | No — only needed for the calendar-sync scripts in the repo root |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL (e.g. `http://localhost:3000` locally) | Yes |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string. Only used by `run-sql-migration.js` for direct `pg` access. | No |

`.env.local` is gitignored and never committed. The standalone maintenance scripts in the repo root (`check-migration.js`, `backfill-*.js`, `sync-to-rebrokerinabox-calendar.js`, etc.) load the same file via `env-config.js`.

## 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in as a broker with Google — this auto-creates your `brokers` row and sends you to onboarding. Agents don't sign up directly; a broker adds them under **Dashboard → Agents** and sends an invite, which emails them a one-time link to set a password.

## Deploying

Deployed on [Vercel](https://vercel.com). Add the same environment variables from `.env.local` to your Vercel project (**Project Settings → Environment Variables**) for Production, Preview, and Development.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
