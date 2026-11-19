# Internal security audit

Last reviewed: 2026-11-19
Reviewed branch: `feature/multitenant-foundation`
Reviewed commit at the time of this report: `c2f6d4b91ba644a1986febd9f4d8f907127f384b`

## Scope reviewed

- Browser rendering and input handling in `src/main.js` and `src/auth-portal.js`.
- Local Storage loading, saving, JSON backup/restore and CSV export.
- PostgreSQL schema, grants, RLS policies and authorization functions in `supabase/migrations/0001_multitenant_foundation.sql`.
- Team-management Edge Function in `supabase/functions/manage-workspace-member/index.ts`.
- RLS regression tests and migration/deployment safety tests.

## Changes made during this review

1. Added database-enforced maximum lengths for lead company, service, phone, email and notes fields, and content platform/body fields. Browser validation is not treated as an authorization boundary.
2. Changed role updates to a service-role-only SQL function that rechecks actor/target roles under a workspace advisory lock and updates membership plus its audit event in one transaction.
3. Changed invitation membership creation to a service-role-only SQL function that rechecks actor authority under the same workspace lock and inserts membership plus its audit event atomically. If the database step fails after Auth creates the invite, the Edge Function attempts to remove the unused Auth account and reports if cleanup may require administrator attention.
4. Changed invitation rate reservation to recheck the actor's owner/admin membership inside the database transaction, under the workspace lock.
5. Expanded local pgTAP coverage from 7 to 16 assertions, including cross-workspace content isolation, viewer write restrictions and member delete restrictions.
6. Hardened local demo record validation and restored the last persisted state when Local Storage writes fail, preventing unsaved in-memory changes from appearing committed.
7. Extended CSV formula-injection mitigation to account for BOM and common zero-width prefixes in addition to leading control/whitespace characters.

## Security controls verified by source review

- Dynamic user-controlled text is escaped before HTML template insertion in the reviewed browser views; status/error messages use text content.
- Browser code uses the public Supabase publishable/anon key only; no service-role key or database password is embedded in frontend source.
- Workspace records are protected by PostgreSQL RLS; browser roles cannot directly mutate workspace membership or audit events.
- SECURITY DEFINER authorization functions pin an empty search_path and are granted only to the roles that require execution.
- Team-management requests validate the caller JWT, workspace/user UUIDs, action, role and invitation email; CORS is restricted to configured exact origins.
- Invitation attempts are serialized and rate-limited in the database.
- CSV cells beginning with spreadsheet formula markers are prefixed before export.
- JSON backup imports have a 2 MB cap, schema checks and rollback on failed persistence.

## Automated validation

The CI workflows run dependency audit, Edge Function type-check, Node regression tests, JavaScript syntax checks, production build, migration safety checks, a disposable local Supabase migration, pgTAP RLS tests and local service verification.

The 16-test pgTAP suite and the expanded static security tests must pass on the latest reviewed commit before this audit can be marked internally complete. CI status is tracked in the pull request and Actions runs.

## Limitations and release blockers

- Local Supabase tests are not a substitute for live Supabase testing. No remote TEST project was provisioned or accessed during this review.
- No live two-user/two-workspace test, deployed Edge Function authorization test, invitation email delivery test, SMTP/recovery test or direct remote API penetration test has been completed.
- Production Auth settings, allowed redirect URLs, backups/restore drills, monitoring, alerting, retention and incident response remain unverified.
- No production deployment or external social, advertising, payment, CRM or AI-provider connection has been performed.
- A dependency audit is not a complete source-code security audit. This review is a focused internal code review and regression-test pass, not an independent penetration test or compliance certification.

## Release decision

Do not merge, deploy, or load real customer data until the latest CI gates pass, a disposable remote Supabase TEST project is configured, live RLS/Edge Function/Auth tests pass, and the repository owner approves the release.
