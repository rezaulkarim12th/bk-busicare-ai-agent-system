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

## Verification performed on latest feature commit
Commit: `6b6203660db0b6b472ae35e645f28e0e9ca8409c`
- Build run [44445257715](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44445257715) passed: dependency installation, high-severity production dependency audit, Deno Edge Function type-check, migration safety checks, JavaScript syntax checks and Vite production bundle build.
- Local Supabase run [44445258020](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44445258020) passed: application/migration tests, Deno type-check, disposable local Supabase startup, all migrations applied, pgTAP RLS isolation suite (7/7 assertions), local service status and stack cleanup.
- The pgTAP suite covers viewer workspace-scoped reads, denial of cross-workspace reads, denial of viewer create/update/delete, member workspace-scoped reads and member lead creation attributed to the authenticated identity.
- The feature-branch deploy job was skipped as intended. No production deployment occurred.
- The workflow audits production dependencies; it does not establish that the complete development dependency tree is vulnerability-free.
- The repository currently has no package lockfile and CI uses npm install, so dependency resolution is not fully reproducible. Add and review a lockfile, then switch CI to npm ci before production release.
- GitHub Actions dependencies and Supabase CLI are referenced by mutable major/latest tags. Pin action commits and a reviewed CLI version as a supply-chain hardening step.

## Not verified — release blockers
- No separate Supabase TEST project has been provisioned/configured.
- No migration has been applied to a real/remote Supabase database.
- No two-user/two-workspace cross-tenant RLS/API authorization test has run against live Supabase.
- Edge Function JWT, CORS, invitation email, quota, rollback and role-boundary behavior have not been exercised against a live Supabase project.
- Auth SMTP, redirect allowlists, server-side password policy, backups, monitoring and recovery have not been configured/verified.
- Production Pages deployment has not occurred.
- Meta, Instagram, TikTok, LinkedIn, Google, YouTube, e-commerce, payment, live AI provider and scheduler integrations are not implemented/connected.

## Release decision
**Do not merge or deploy to production yet.** Keep the PR Draft until a disposable TEST project has been used for migration preview/apply, live RLS and Edge Function security tests pass, hosting secrets are verified, and the owner explicitly approves release. Never place service-role keys, DB passwords or access tokens in chat, browser code, repository files or `VITE_` variables.
