# BK-BusiCare security review

Review scope: feature-branch source, SQL migrations, Supabase Edge Function, browser auth portal, GitHub Actions workflows and automated tests. This is a static code/configuration review plus disposable local database regression testing and transaction-scoped live TEST database checks. It is not a penetration test or a complete live Auth/REST/Edge Function end-to-end test.

## Controls observed in source
- RLS is enabled on workspaces, workspace_members, leads, content_items and audit_events.
- Browser table grants are explicitly revoked from PUBLIC, anon and authenticated, then narrowly re-granted. Membership and audit tables are read-only to authenticated browser clients.
- Workspace membership checks and role checks are in a private schema. SECURITY DEFINER routines pin an empty search_path.
- Workspace creation binds the authenticated caller as owner; tenant and creator identity fields on lead/content updates are protected by triggers.
- Team membership changes are routed through an Edge Function that validates the caller token with Supabase Auth and checks owner/admin role before using the service key.
- Invitation attempts are rate-limited using a transaction advisory lock; invalid email input is rejected before consuming a reservation.
- CORS uses an exact configured origin allowlist; no wildcard origin is emitted.
- Browser source does not contain a service-role key; local demo data remains browser-local.
- Signup and password recovery UI reject passwords shorter than 12 characters. This is a client-side guard only; configure the Supabase Auth password policy server-side as well.
- Operations Core calculates open pipeline value, won revenue, win rate and due/overdue follow-ups from the available lead records.
- AI Copilot currently builds and validates content prompts locally. It does not connect to a live AI provider and does not publish content.

## Verification performed on current feature head (2026-11-20)
- Current-head Build workflow [44678696642](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44678696642): PASS — locked dependency install, dependency vulnerability audit, Edge Function Deno type-check, migration safety checks, JavaScript syntax checks and production bundle build. The Pages deploy job was skipped on this feature branch as intended.
- Current-head Local Supabase workflow [44678696630](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44678696630): PASS — disposable Supabase stack, all migrations, pgTAP RLS regression tests, service verification and cleanup.
- Remote TEST project `rmnoiwzkhjwmgxwkfdzb` is ACTIVE_HEALTHY; migrations `20261120044848` and `20261120044911` are applied. All five application tables have RLS enabled, 12 policies are present, and anon has zero table grants for those application tables.
- Remote TEST inventory: four expected public RPCs and three private authorization/trigger helpers are present. `manage-workspace-member` is ACTIVE version 1.
- A transaction-scoped live TEST database check created two synthetic users and two workspaces, set authenticated role/JWT subject claims, verified each tenant could read only its own lead/workspace, and verified authenticated workspace creation assigns the caller the owner role. The transaction was rolled back; no test rows were retained. This validates PostgreSQL RLS/function behavior in the remote database under simulated claims, not signed-in browser sessions or the REST API.
- Supabase Health Advisor returned no findings. Performance Advisor returned seven unused-index INFO findings while the TEST tables are empty; indexes were retained pending real workload evidence.
- Security Advisor reports one WARN: authenticated users can execute `public.create_workspace(text)` as SECURITY DEFINER. This is an intentional authenticated workspace-creation RPC; it checks `auth.uid()`, validates the workspace name and pins an empty search_path. Do not revoke it without replacing the client workspace-creation flow.
- No production database or hosting deployment was changed.

## Remaining live release verification
- Signed-in two-user/two-workspace browser Auth and direct REST API tests are not yet run.
- Edge Function JWT, exact-origin CORS, invitation email delivery, quota exhaustion, rollback and role-boundary behavior are not yet exercised end-to-end. Configure the exact deployed app origin in server-side `APP_ALLOWED_ORIGINS` before browser invocation.
- Auth Site URL, redirect allowlist, SMTP and server-side password policy require configuration and verification.
- Backups, monitoring, recovery and production operational controls require setup.
- Production Pages deployment has not occurred.
- Meta, Instagram, TikTok, LinkedIn, Google, YouTube, e-commerce, payment, live AI provider and scheduler integrations are not implemented/connected.

## Release decision
**Keep the PR Draft; do not merge or deploy to production until the remaining live Auth/API/Edge Function checks pass and the owner explicitly approves release.** Never place service-role keys, DB passwords or access tokens in chat, browser code, repository files or `VITE_` variables.
