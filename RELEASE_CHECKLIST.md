# BK-BusiCare release checklist

This checklist records the remaining owner-controlled setup required before a safe live release. The application is not production-ready until every required test below passes.

## Verified in GitHub
- [x] Feature-branch production dependency audit, Deno Edge Function type-check, migration safety checks, JavaScript syntax checks and Vite production build passed in Build #113.
- [x] Disposable local Supabase stack started successfully in Local Test #14.
- [x] All repository migrations applied successfully to the disposable local database.
- [x] pgTAP RLS isolation suite passed: 7 of 7 assertions.
- [x] Local Supabase service status verified and stack cleaned up.
- [x] Deployment job correctly skipped for the feature-branch PR; no production deployment occurred.
- [ ] Add and review a package lockfile, then switch CI from npm install to npm ci.
- [ ] Pin GitHub Actions dependencies and Supabase CLI to reviewed immutable versions.
- [ ] Live TEST-project Auth, API-level cross-tenant RLS and Edge Function tests.
- [ ] Merge feature PR only after external release gates pass and owner explicitly approves.

Latest successful build: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44371593211
Latest successful local Supabase test: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44371593078
Local CI workflow: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/blob/feature/multitenant-foundation/.github/workflows/supabase-local-ci.yml
RLS regression test: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/blob/feature/multitenant-foundation/supabase/tests/rls_isolation.test.sql
Draft PR: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/pull/1

A successful local test confirms migrations and the covered RLS cases work in a fresh disposable database. It does not validate a real Supabase project, live Auth, SMTP, Edge Function deployment or production hosting.

## Required TEST environment setup (owner action)
1. Create a separate disposable Supabase TEST project. Do not use the existing project unless its non-production status is independently confirmed.
2. In GitHub repository Settings -> Environments, create `supabase-test`. Add required reviewers/protection if available.
3. Add these environment secrets without placing them in source control or chat:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_PROJECT_REF` (20-character project reference for the TEST project)
4. Run Actions -> Supabase TEST deployment with operation `preview`. Inspect the migration plan/log.
5. Only after reviewing the preview, run operation `apply` and tick `confirm_apply`. This applies migrations and deploys the Edge Function to the TEST project only.
6. In Supabase Edge Function secrets, set `APP_ALLOWED_ORIGINS` to the exact HTTPS origin(s) of the approved app. Do not use wildcard origins.
7. Configure Supabase Auth Site URL, allowed redirect URLs and SMTP. Test registration, sign-in, password reset and team invitations.

## Mandatory live security tests
- Create two separate test users and two separate workspaces.
- Verify each user can read/write only records in their authorized workspace.
- Verify cross-workspace reads, writes, updates and deletes are denied by PostgreSQL RLS, including direct API requests.
- Verify viewer role is read-only and contributor/admin/owner boundaries are enforced.
- Verify invitation quota, duplicate/invalid email handling, audit logging and rollback behavior.
- Verify CORS rejects unlisted origins and the Edge Function rejects missing/invalid caller JWTs.
- Record evidence and fix all failures before release. Do not enter real customer data during testing.

## Hosting / app release
1. Decide and verify the canonical production HTTPS domain.
2. Configure GitHub Pages for GitHub Actions if Pages is the chosen host.
3. Add repository Actions secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the intended production Supabase project. These are frontend values; never add service-role keys, database passwords or access tokens to `VITE_` variables.
4. Review the feature PR diff and all live test evidence. Keep the PR Draft until tests pass.
5. After explicit owner release approval, mark the PR ready, merge to `main`, and verify the Pages deployment and live auth flow.
6. Confirm HTTPS, redirects, browser console, API permissions, backup/restore and monitoring before adding customer data.

## External integrations — not yet connected
Each provider requires the account owner to create/authorize the app, approve scopes, configure callback URLs and provide credentials through an approved secret store:
- Meta Facebook Pages / Instagram Graph API and Meta Ads.
- TikTok publishing / business APIs.
- LinkedIn organization and marketing APIs.
- Google OAuth, Ads, Analytics and Search Console.
- YouTube Data API.
- Shopify / WooCommerce, payment provider and order webhooks.
- AI provider for content/agent orchestration.
- Scheduler/queue, publishing approvals, retries, logs, rate limits and monitoring.

Do not promise automatic publishing or ad management until each provider integration has been implemented, permission-reviewed and tested. Keep customer messaging, publishing, CRM mutations and ad spend behind explicit human approval.

## Release decision
Current state: Build #113 passed; Local Test #14 passed with all 7 pgTAP RLS assertions; live Supabase TEST deployment and live RLS/API tests are not verified; Pages production deployment has not occurred; external platform integrations are not connected. This is a code-tested MVP foundation, not a completed live automation service.
