# Implementation status

Last reviewed: 2026-11-18

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
- Supabase Edge Function source for team invitations and role changes, with caller JWT validation, owner/admin checks, admin-role escalation protection, invitation rate limiting and audit-event writes.
- Team UI supports inviting new email addresses and changing existing member roles. Invitations to already-registered addresses require a separate reviewed flow.
- Viewer UI is read-only; database RLS remains authoritative.
- Partial Supabase environment configuration fails closed; authenticated mode suppresses the browser-local demo.
- Local demo supports Leads, pipeline, content planning, reports, CSV export and JSON backup/restore.
- JSON import validates record structure; CSV export mitigates formula injection.
- No service-role key or database password is used in browser code.
- Vite dev/preview servers bind to 127.0.0.1.
- GitHub Actions checks production dependencies, Deno types, migration safety tests, JavaScript syntax and production build.
- Manual Supabase TEST deployment workflow is present. It separates a read-only `preview` run from a separately dispatched `apply` run; apply requires a confirmation checkbox, re-runs the preview, supplies the database password to the CLI, applies migrations and deploys the Edge Function. It targets the configured project ref and GitHub environment `supabase-test`.

## Latest validation
- GitHub Actions run [44309412376](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44309412376) completed successfully on commit `5142183110cc2e0ee004bfa10579af25756d4054`: production dependency audit, Deno Edge Function type-check, 13/13 Node tests, JavaScript syntax checks and Vite production build passed. The subsequent workflow-only safety change at commit `69e6df1fc55559fd10a786a970449c922e1dc30b` is awaiting its own CI result.
- Pages deployment was skipped because this was a pull-request run on the feature branch.
- The Supabase TEST deployment workflow has not been run; its secrets and GitHub environment still need configuration.
- Static tests do not substitute for PostgreSQL/RLS integration tests. No live tenant-isolation or invitation tests have been run.

## Outstanding release gates
- Create and verify a disposable Supabase TEST project; configure GitHub environment `supabase-test` and secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, and `SUPABASE_PROJECT_REF`.
- Run the workflow in `preview` mode and inspect its migration dry-run output; only afterward run it in `apply` mode with explicit confirmation.
- Configure Supabase Auth email/SMTP, site URL and redirect URLs; test sign-in, recovery and invitation delivery.
- Run two-user/two-workspace RLS tests, including viewer/member/admin boundaries and direct API requests.
- Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions secrets before a Pages build from `main`.
- Complete security, privacy, backup/restore, monitoring, rate-limit and operational reviews before production use.
- Social publishing, Meta/Google ads, messaging, marketplaces, e-commerce, payments and AI-provider integrations remain unconnected and require provider accounts, approved scopes, secrets and owner authorization.

## Known residual risk
The full development dependency tree has a documented high-severity `picomatch` ReDoS advisory in the Vite development-tool dependency chain. The production dependency audit passes; the development-only advisory is not claimed as fixed.

## Release status
This is a development foundation and local demo, not a production-ready AI Agent SaaS. PR #1 remains draft and open. No live Supabase migration or production deployment has occurred. Do not enter real customer data until all release gates pass.
