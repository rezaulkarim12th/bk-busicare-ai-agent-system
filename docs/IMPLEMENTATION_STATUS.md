# Implementation status

Last reviewed: 2026-11-20

## User decisions
- Hosting strategy: free-first.
- Product scope: multiple client workspaces and team roles.
- Initial budget: ৳0.
- Keep development on a feature branch; do not merge or deploy without explicit approval.

## Implemented in the feature branch
- Supabase/PostgreSQL schema for workspaces, memberships, leads, content and audit events.
- Row Level Security policies for workspace isolation and owner/admin/member/viewer roles.
- Atomic authenticated workspace creation.
- Authorization helpers moved to a non-API-exposed `private` schema with locked search path.
- Browser clients cannot mutate memberships or write/modify audit events.
- Lead/content workspace identity, creator identity and creation timestamps are immutable on update; updated_at is refreshed.
- Supabase Auth portal: sign-in, registration, password reset/recovery, sign-out, workspace creation and workspace selection.
- Authenticated cloud CRUD for Leads and Content, scoped by active workspace and protected by PostgreSQL RLS; delete controls are limited to owner/admin roles.
- Supabase Edge Function for team invitations and role changes, with caller JWT validation, exact-origin CORS allowlist, UUID/email/role validation and owner/admin checks. Database RPCs re-check authority under a workspace lock and atomically commit membership/role changes with audit events; failed invitation setup triggers best-effort cleanup of the unused Auth account.
- Team UI supports inviting new email addresses and changing existing member roles. Invitations to already-registered addresses require a separate reviewed flow.
- Viewer UI is read-only; database RLS remains authoritative.
- Partial Supabase environment configuration fails closed; authenticated mode suppresses the browser-local demo.
- Local demo supports Leads, pipeline, content planning, reports, CSV export and JSON backup/restore.
- JSON import validates record structure, enforces a 2 MB limit and restores prior data on persistence failure; CSV export mitigates formula injection, including BOM/zero-width prefixes.
- Local demo validates bounded record fields and restores the last persisted state when Local Storage writes fail.
- Database constraints independently enforce lead/content field lengths and supported content platforms.
- No service-role key or database password is used in browser code.
- Vite dev/preview servers bind to 127.0.0.1.
- Follow-up queue uses the browser's local calendar date (not UTC) to avoid off-by-one-day reminders.
- JSON backup import is capped at 2 MB and restores the previous in-memory data if Local Storage cannot save the imported backup.
- Local Supabase CI captures startup/status output and suppresses ephemeral generated API credentials from public logs; an explicit empty seed file is present.
- GitHub Actions pins third-party actions to immutable commit SHAs, selects explicit Node/Deno/Supabase CLI versions, installs from a committed lockfile with npm ci, audits the full dependency tree, checks Deno types, migration safety tests, JavaScript syntax and production build.
- Manual Supabase TEST deployment workflow is present. It separates a read-only `preview` run from a separately dispatched `apply` run; apply requires a confirmation checkbox, re-runs the preview, supplies the database password to the CLI, applies migrations and deploys the Edge Function. It targets the configured project ref and GitHub environment `supabase-test`.

## Latest validation
- Current feature head before this documentation/version reconciliation: `46b97a7e2b9613dce5a5d033742ce7e42d29b7d8`.
- Build workflow [44678286959](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44678286959) passed on that head: full dependency audit, Deno Edge Function type-check, Node regression tests, JavaScript syntax checks and Vite production bundle. Pages deploy was skipped on the feature branch.
- Local Supabase workflow [44678286878](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44678286878) passed on that head: disposable stack startup, migrations, pgTAP RLS suite, service checks and cleanup.
- Separate remote TEST project `BK-BusiCare-TEST` (`rmnoiwzkhjwmgxwkfdzb`) is ACTIVE_HEALTHY. Migrations `20261120044848` and `20261120044911` are applied; all five application tables have RLS enabled and currently contain zero rows.
- Edge Function `manage-workspace-member` is ACTIVE version 1. Browser CORS, Auth invitation delivery and full live API role tests remain unverified.
- A temporary two-tenant SQL isolation check returned zero cross-workspace rows; its transaction was rolled back. This does not replace live Auth/API tests.
- Security Advisor reports one WARN for authenticated execution of `public.create_workspace(text)` as SECURITY DEFINER. This is intended for signed-in workspace creation and has an empty search_path; live authorization tests remain required.
- GitHub Actions run [44312129663](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44312129663) completed successfully on commit `e68a083c7179b19f74289b5aa8f3af50a43ba8f0`: production dependency audit, Deno Edge Function type-check, 15/15 Node regression tests, JavaScript syntax checks and Vite production build passed. Pages deployment was correctly skipped on the PR branch.
- Latest security validation: [Build run 44451816131](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44451816131) passed dependency audit, Deno type-check, migration/static security tests, JavaScript syntax and production build. [Local Supabase run 44451815663](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44451815663) successfully started an isolated stack, applied the migration, passed all 16 pgTAP RLS assertions, verified local services and stopped the stack.
- Pages deployment was skipped because this was a pull-request run on the feature branch.
- The Supabase TEST deployment workflow has not been run; its secrets and GitHub environment still need configuration. The feature branch contains the security-review changes; PR #1 remains Draft and unmerged.
- Disposable local Supabase migration and pgTAP RLS tests have been run; latest expanded suite contains 16 assertions. CI must pass on the current commit before release.

## Outstanding release gates
- Configure GitHub environment `supabase-test` and secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, and `SUPABASE_PROJECT_REF=rmnoiwzkhjwmgxwkfdzb` only if the manual remote TEST workflow is needed.
- The current TEST project migrations and function were applied directly; the GitHub remote deployment workflow itself has not been run.
- Configure Supabase Auth email/SMTP, site URL and redirect URLs; test sign-in, recovery and invitation delivery.
- Run two-user/two-workspace RLS tests, including viewer/member/admin boundaries and direct API requests.
- Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions secrets before a Pages build from `main`.
- Complete security, privacy, backup/restore, monitoring, rate-limit and operational reviews before production use.
- Social publishing, Meta/Google ads, messaging, marketplaces, e-commerce, payments and AI-provider integrations remain unconnected and require provider accounts, approved scopes, secrets and owner authorization.

## Security review
A focused internal code review and findings log are maintained in [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md). This review covers HTML output encoding, local input validation and persistence rollback, CSV formula injection, database field constraints, RLS grants/policies, and atomic team authorization/audit RPCs. It is not an independent penetration test.

## Release status
This is a code-tested MVP and TEST-deployed backend foundation, not a production-ready AI Agent SaaS. PR #1 remains draft and open. TEST migrations and the team Edge Function have been deployed to the separate TEST project. No production deployment has occurred. Do not enter real customer data until all release gates pass.
