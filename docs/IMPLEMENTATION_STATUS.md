# Implementation status

Last reviewed: 2026-11-18

## User decisions
- Hosting strategy: free-first.
- Product scope: multiple client workspaces and team roles.
- Initial budget: ৳0.
- Keep development on a feature branch; do not merge or deploy without explicit approval.

## Current feature-branch delivery
- Supabase/PostgreSQL schema for workspaces, memberships, leads, content and audit events.
- Row Level Security policies for workspace isolation and owner/admin/member/viewer roles.
- Atomic authenticated workspace creation.
- Authorization helpers moved to a non-API-exposed `private` schema with locked search path.
- Browser clients cannot mutate memberships or write/modify audit events.
- Lead/content workspace identity, creator identity and creation timestamps are immutable on update; updated_at is refreshed.
- Supabase Auth portal: sign-in, registration, password reset, password recovery, sign-out, workspace creation and workspace selection.
- Authenticated portal cloud CRUD for Leads and Content, scoped by active workspace and protected by PostgreSQL RLS; delete controls are limited to owner/admin roles.
- Partial Supabase environment configuration fails closed; authenticated mode suppresses the browser-local demo.
- Local demo supports Leads, pipeline, content planning, reports, CSV export and JSON backup/restore.
- JSON import validates record structure before replacing data; CSV export prefixes formula-like cells to reduce spreadsheet formula injection risk.
- No service-role key or database password is used in browser code.
- Vite upgraded to 8.3.8; Vite dev and preview servers bind to `127.0.0.1` only.
- CI audits production dependencies for high-severity vulnerabilities before tests/build.
- Dependency audit found a high-severity `picomatch` ReDoS advisory in the Vite development-tool dependency chain. The GitHub advisory currently lists no patched version; the dev server is therefore restricted to loopback, and this residual development-only finding remains documented rather than being falsely marked fixed.

## Audit fixes applied in this review
- Fixed password-recovery event handling so the password update form is displayed even when the recovery event arrives before initial session loading finishes.
- Prevented local demo fallback when only one Supabase environment variable is set.
- Moved SECURITY DEFINER membership helper functions out of public API schema.
- Locked SECURITY DEFINER function search paths.
- Removed browser-side audit event insert policy; trusted server-side writes are required.
- Added immutable tenant/creator identity trigger and updated_at maintenance.
- Validated imported backup record fields and escaped imported IDs in HTML attributes.
- Applied CSV formula-injection mitigation in the actual CSV export path, with a regression assertion.
- Restricted authenticated workspace updates to the `name` column; primary key and timestamps are no longer writable through the table grant.
- Replaced stale README and deployment guide statements with current feature status.

## Validation
- Latest validation after cloud CRUD changes is pending in GitHub Actions; earlier baseline CI passed 11/11 Node tests, both JavaScript syntax checks and Vite production build.
- Deployment was skipped as intended because this is a feature-branch pull request.
- Static tests do not substitute for PostgreSQL/RLS integration tests.
- Live Supabase authentication, migration application and two-user cross-tenant tests have not been performed.

## Not implemented / not connected
- Cloud Leads and Content CRUD.
- Trusted server/Edge Functions for team invitations, role changes and audit-event writes.
- Two-user/two-workspace integration tests and production security review.
- Cloudflare Pages or live Supabase provisioning.
- Social publishing, ads, messaging, marketplace, e-commerce, payment or AI provider integrations.
- Production monitoring, backups, retention and rate limiting.

## Release status
This is a development foundation and local demo, not a production-ready AI Agent SaaS. The PR remains draft and open. The SQL migration has not been applied to a live project. No production deployment has occurred.
