
# Migrate to your own Supabase project

Goal: move backend from the Lovable-managed Supabase project (`tmfnqnmyxxydrxwjkaiq`) to a new project in `starimpactcontacts-netizen's Org` under `starimpactcontacts@gmail.com`, with full dashboard access, preserving auth users with password hashes intact. A short maintenance window is acceptable.

## What you do (manual, in browser)

1. In `starimpactcontacts-netizen's Org` → **New project**. Region = same as current (likely `us-east-1`). Save the DB password.
2. In the OLD project dashboard (`tmfnqnmyxxydrxwjkaiq`) → Settings → API → copy the **service_role** key. This is the key we've been blocked on — it's required for auth user export.
3. Save both connection strings (Settings → Database → URI). Note: use the **Session pooler** URI for migrations, not the direct one.

## What I do (in repo)

### Phase 1 — Schema + data (no downtime)
1. Run `scripts/migrate-schema.mjs` against the new project with `DB_URL=<new>` — applies every file in `supabase/migrations/` in order.
2. Extend `scripts/migrate-data.mjs`:
   - Add missing tables to the `TABLES` array (audit current schema first — there are likely tables beyond the 26 listed).
   - Add a second pass for `auth.users` using the **OLD service_role key** against `/auth/v1/admin/users` to export with `encrypted_password`, then bulk-insert directly into `auth.users` on the new project via psql (bypasses the REST API which strips password hashes).
   - Add `auth.identities` migration so OAuth/Google links survive.
3. Run data migration. Verify row counts match per table.

### Phase 2 — Storage buckets
4. New script `scripts/migrate-storage.mjs`: list every bucket on old project, recreate on new (with same public/private + policies), then stream every object across using signed URLs + upload.

### Phase 3 — Edge functions + secrets
5. Edge function code is already in `supabase/functions/` — will auto-deploy to new project once it's connected.
6. Re-add all runtime secrets on the new project (Lovable Cloud secrets don't carry across): I'll list every secret name currently used (LOVABLE_API_KEY, RESEND_API_KEY, STRIPE_*, BUNNY_*, PAYPAL_*, etc.) and you re-enter values in the new dashboard.

### Phase 4 — Cutover (the maintenance window)
7. Put up a maintenance banner in the app.
8. Run a final incremental sync of any rows changed since Phase 1 (using `updated_at > <phase1-timestamp>` per table).
9. Disconnect Lovable Cloud from this project and connect the native Supabase integration pointing at the new project. This auto-updates:
   - `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`)
   - `src/integrations/supabase/client.ts` + `types.ts`
10. Reconfigure custom domain `loopgate.gg` / `www.loopgate.gg` redirect URLs in new project's Auth settings.
11. Re-enable Google OAuth in new project (Authentication → Providers → Google). Lovable's managed Google OAuth goes away — you'll need to create your own Google Cloud OAuth client OR Supabase's built-in. Same for Discord if you still want it.
12. Re-enable realtime publications on tables that need it (already in migrations, but verify).
13. Publish the app. Remove maintenance banner.

### Phase 5 — Verification
14. Smoke test: sign in with existing account (password must work), check feed loads, submit an edit, verify storage URLs resolve, trigger one edge function, check realtime channels.

## Important warnings

- **Auth migration is the riskiest step.** Inserting into `auth.users` directly is supported but undocumented — Supabase recommends it for self-host migrations. If a row fails, that user can't log in until reset. Backup plan: keep old project read-only for 30 days so we can re-run anything.
- **OAuth redirect URLs change.** Any user mid-flow during cutover gets bounced. Schedule for low-traffic window.
- **Edge function secrets must be re-entered manually** — Lovable Cloud doesn't export secret values.
- **Stripe/PayPal webhooks** point at the old project's edge function URLs. You'll need to update webhook endpoints in Stripe/PayPal dashboards to the new project's URL.
- **Billing resets.** New project starts on Supabase Free tier. If usage exceeds free limits, upgrade to Pro ($25/mo).
- **Lovable Cloud features go away.** `lovable.auth.signInWithOAuth` (managed Google) won't work anymore — code will fall back to raw `supabase.auth.signInWithOAuth`, which already exists in `useAuth.tsx`. Also: managed email (`send-notification-email` via Lovable's Resend wrapper) — you'll need your own Resend key.

## What I need from you to start

1. The **OLD service_role key** (from old project dashboard → Settings → API).
2. The **NEW project's** DB connection string + service_role key + URL + anon key (after you create the project).
3. Confirmation of your preferred maintenance window (I'd suggest 30–60 min, ideally late night your timezone).
4. Whether you want to **keep the old project running read-only for 30 days as a safety net** (recommended) or shut it down immediately after cutover.

Once you confirm and approve this plan, I'll switch to build mode and start with Phase 1.
