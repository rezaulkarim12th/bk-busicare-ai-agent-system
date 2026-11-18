# BK-BusiCare release checklist

This checklist records the remaining owner-controlled setup required before a safe live release. The application is not production-ready until every required test below passes.

## Verified in GitHub
- [x] Earlier feature-branch CI build and static checks passed.
- [x] Supabase Edge Function Deno type-check passed.
- [x] Migration safety/regression tests passed.
- [x] Application JavaScript syntax checks passed.
- [x] Vite production bundle build passed.
- [x] SQL invitation quota function dollar quoting repaired.
- [x] Team invitation email validation repaired.
- [x] Regression coverage added for invitation SQL and email validation fixes.
- [x] Client-side 12-character minimum added for signup and password recovery.
- [x] Static regression checks added for SECURITY DEFINER search_path and membership/audit table grants.
- [x] Static security review documented in SECURITY_REVIEW.md.
- [x] Credential-free local Supabase CI workflow starts an isolated database and applies all migrations.
- [x] Local Supabase CI run 44365673707 completed successfully: app tests, Edge Function type-check, local Supabase startup, migration reset, service status and cleanup all passed.
- [x] pgTAP RLS isolation regression suite added for viewer read-only behavior and tenant-scoped member access; execution is pending the next CI run.
- [ ] pgTAP RLS regression suite must pass in GitHub Actions before treating local role-isolation coverage as verified.
- [ ] Live TEST-project Auth, API-level cross-tenant RLS and Edge Function tests.
- [ ] Merge feature PR only after external release gates pass and owner explicitly approves.

Latest successful local migration CI: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44365673707
Local CI workflow: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/blob/feature/multitenant-foundation/.github/workflows/supabase-local-ci.yml
RLS regression test: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/blob/feature/multitenant-foundation/supabase/tests/rls_isolation.test.sql
Draft PR: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/pull/1

The earlier feature-branch build passed. Its deployment job was skipped, as expected for this feature-branch PR; this is not a production deployment and does not validate live Supabase behavior.

## Required TEST environment setup (owner action)
1. Create a separate disposable Supabase TEST project. Do not use the production project.
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
Current state: latest feature-branch build passed; local Supabase migrations passed in disposable CI run 44365673707; pgTAP tests have been added but their new CI run is pending; live Supabase TEST deployment and live RLS/API tests are not verified; Pages production deployment has not occurred; external platform integrations are not connected. This is a code-tested MVP foundation, not a completed live automation service.
