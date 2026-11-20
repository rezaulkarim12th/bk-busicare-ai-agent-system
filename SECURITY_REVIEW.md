# BK-BusiCare security review

Review scope: feature-branch source, SQL migrations, Supabase Edge Function, browser auth portal, GitHub Actions workflows and automated tests. This is a static code/configuration review plus disposable local database regression testing, not a penetration test or live Supabase verification.

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
- Build run [44678286959](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44678286959) passed full configured dependency audit, Deno Edge Function type-check, Node regression suite, JavaScript syntax checks and Vite production build.
- Local Supabase run [44678286878](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44678286878) passed disposable stack startup, all repository migrations, pgTAP RLS isolation suite, local service checks and cleanup.
- Remote TEST project `rmnoiwzkhjwmgxwkfdzb` is ACTIVE_HEALTHY; both versioned migrations are applied, five application tables have RLS enabled, and `manage-workspace-member` Edge Function is ACTIVE version 1.
- A temporary SQL two-tenant check returned zero cross-workspace rows; its transaction was rolled back. This is a narrow check, not a complete live API test.
- Security Advisor reports one WARN: authenticated users can execute `public.create_workspace(text)` as SECURITY DEFINER. The function is intended for authenticated workspace creation and has an empty locked search_path; live authorization tests remain required.
- The Build deploy job was skipped as intended on the feature branch. No production deployment occurred.

## Not verified — release blockers
- Full two-user/two-workspace Auth and direct REST API role tests have not been completed against the remote TEST project.
- No two-user/two-workspace cross-tenant RLS/API authorization test has run against live Supabase.
- Edge Function JWT, configured-origin CORS, invitation email, quota, rollback and role-boundary behavior have not been exercised end-to-end against the live TEST project.
- Auth SMTP, redirect allowlists, server-side password policy, backups, monitoring and recovery have not been configured/verified.
- Production Pages deployment has not occurred.
- Meta, Instagram, TikTok, LinkedIn, Google, YouTube, e-commerce, payment, live AI provider and scheduler integrations are not implemented/connected.

- Edge Function `APP_ALLOWED_ORIGINS`, Auth SMTP, Site URL, redirect allowlist and server-side password policy are not yet verified.

## Release decision
**Do not merge or deploy to production yet.** Keep the PR Draft until a disposable TEST project has been used for migration preview/apply, live RLS and Edge Function security tests pass, hosting secrets are verified, and the owner explicitly approves release. Never place service-role keys, DB passwords or access tokens in chat, browser code, repository files or `VITE_` variables.
