# BK-BusiCare release checklist

This checklist records verified feature-branch work and the remaining release gates. The application is not production-ready until every required live test and deployment check passes.

## Verified in GitHub on latest feature commit
Commit: `6b6203660db0b6b472ae35e645f28e0e9ca8409c`
- [x] Production dependency audit, Deno Edge Function type-check, migration safety tests, JavaScript syntax checks and Vite production build passed: [Build run 44445257715](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44445257715).
- [x] Disposable local Supabase stack started successfully: [Local Test run 44445258020](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44445258020).
- [x] All repository migrations applied to the disposable local database.
- [x] pgTAP RLS isolation suite passed: 7 of 7 assertions.
- [x] Local Supabase service status verified and stack cleaned up.
- [x] Dashboard Operations Core integrated: pipeline metrics, won revenue, win rate and follow-up queue.
- [x] AI Copilot prompt builder integrated into Content Planner with input validation and explicit disclosure that live provider is not connected.
- [x] TEST deployment workflow has manual trigger, preview-first default, TEST-only environment, secret-only credentials, explicit apply confirmation, feature-branch checkout and a hard block for the known existing BK-BusiCare project ref.
- [x] Deploy job correctly skipped for the feature-branch PR; no production deployment occurred.
- [ ] Add and review a package lockfile, then switch CI from npm install to npm ci.
- [x] Pin GitHub Actions dependencies to reviewed immutable commit SHAs; set Node.js 24, Deno 2.9.8 and Supabase CLI 3.2.0 explicitly, with regression tests against floating versions.
- [ ] Complete remaining internal code review and regression coverage before beginning external integrations.

## Required TEST environment setup (external release gate)
1. Create a separate disposable Supabase TEST project. Do not use the existing BK-BusiCare project unless its non-production status is independently confirmed.
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
- Live AI provider for content/agent orchestration.
- Scheduler/queue, publishing approvals, retries, logs, rate limits and monitoring.

Do not promise automatic publishing or ad management until each provider integration has been implemented, permission-reviewed and tested. Keep customer messaging, publishing, CRM mutations and ad spend behind explicit human approval.

## Release decision
Current state: feature-branch Build and disposable Local Supabase Test both pass on commit `6b6203660db0b6b472ae35e645f28e0e9ca8409c`. This confirms the tested local code and migration path only. Live Supabase TEST deployment, live RLS/API tests, production hosting and external provider integrations remain unverified/unconnected. This is a code-tested MVP foundation, not a completed live automation service.
