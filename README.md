# BK-BusiCare AI Agent System

Responsive Vite web-app MVP for BK-BusiCare. The repository contains a local operations demo, a Supabase authentication portal, and a multi-tenant workspace foundation. It is **not yet a complete production SaaS or a fully integrated AI agent**.

## Run locally

1. Install Node.js 20 or later.
2. Run `npm ci`.
3. Run `npm run dev`.
4. Open the local URL printed by Vite.

## Local demo features

When both Supabase variables are absent, the app opens its browser-local demo:
- Dashboard, leads and sales pipeline.
- Content planning for Facebook, Instagram, TikTok, LinkedIn and YouTube.
- Basic reports and CSV export.
- JSON backup and restore.
- Responsive desktop and mobile UI.

Demo records stay in the current browser's Local Storage. They do not sync across devices or accounts.

## Supabase authentication and cloud workspace

When both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, the local demo is suppressed and the authenticated portal opens. It supports email/password sign-in, registration, password recovery, workspace creation and workspace selection.

The authenticated portal supports workspace-scoped cloud Leads and Content create/read/update/delete. PostgreSQL RLS is the security boundary; the UI also presents viewer accounts as read-only. Team invitations and role changes use the `manage-workspace-member` Supabase Edge Function, which validates caller JWTs and checks workspace roles. Configure the Edge Function secret `APP_ALLOWED_ORIGINS` with a comma-separated exact allowlist of trusted app origins; wildcard origins are not supported. The function uses a database-locked invitation quota of five attempts per actor per workspace per ten minutes and records invitation attempts in the audit log.

The SQL migrations create workspace, membership, lead, content and audit tables with RLS. Authorization helpers live in a private schema; do not expose that schema through the Supabase API. Never put the secret/service-role key in browser code.

## Environment status (checked 2026-11-20)

The GitHub Pages deployment workflow run #203 completed successfully from the `main` branch (build and deploy jobs both succeeded). This confirms that the checked commit built and was deployed to GitHub Pages; it does not by itself prove every live application workflow or security control.

The separate `BK-BusiCare-TEST` Supabase project (`rmnoiwzkhjwmgxwkfdzb`) remains available for isolated testing. The repository's two initial versioned migrations were previously applied to that TEST project and the `manage-workspace-member` Edge Function was deployed there.

The Production Supabase project (`ekznyijmghrjtovbbgun`) is active and has also been modified. A read-only database inspection on 2026-11-20 found the five application tables with RLS policies present and the following record counts: one workspace, one workspace member, one lead, zero content items and zero audit events. These counts are a point-in-time snapshot, not a complete acceptance test. Do not infer successful live CRUD, invitations, role changes or cross-workspace isolation from table presence or row counts.

The Production `manage-workspace-member` Edge Function is active (version 1). Its source validates the bearer token, checks owner/admin permissions, restricts allowed origins, rate-limits invitations and uses transactional database RPCs for membership/role changes. Live browser invocation, invitation delivery, role-change behavior and the configured `APP_ALLOWED_ORIGINS` secret still require verification. The function's default origin fallback is not a substitute for verifying the deployed secret configuration.

## Security review and remaining release gates

A Production advisor check on 2026-11-20 reported:
- Leaked Password Protection is disabled and must be enabled in Supabase Auth Password Security settings.
- A SECURITY DEFINER warning is reported for `public.create_workspace(workspace_name text)`. The function checks `auth.uid()`, validates the workspace name, uses an empty search path, creates the workspace and its owner membership together, and is executable by authenticated users. This privilege is part of the current workspace-creation design; do not revoke it or change it to SECURITY INVOKER without redesigning and testing workspace creation.
- Five unused-index informational notices were reported. Do not drop indexes without query-plan and workload review.
- The Health Advisor returned no notices at the time of inspection.

The following live checks remain outstanding: production Lead and Content CRUD/persistence; two-user/two-workspace RLS isolation; a real invitation and role-change test using a second test account; SMTP, Site URL and redirect allowlist verification; Edge Function origin-secret verification; and backup, monitoring, retention and rate-limit operational checks. These checks require authenticated test sessions or dashboard configuration and are not proven by the successful GitHub Pages deployment.

## Local Supabase CI (no credentials required)

The GitHub Actions workflow `.github/workflows/supabase-local-ci.yml` starts a disposable Supabase stack on the GitHub-hosted runner, applies all repository migrations to that local database, runs the pgTAP RLS regression suite in `supabase/tests/rls_isolation.test.sql`, and reports service status. It runs for pull requests targeting `main` and manual dispatch. It does not connect to or modify your Supabase account and requires no Supabase secrets. A successful run confirms migrations and the covered role-isolation cases work in a fresh local database; it does not prove live Supabase configuration, auth delivery, or production security.

## Test deployment to a separate Supabase project

A manually triggered GitHub Actions workflow is provided at `.github/workflows/supabase-test-deploy.yml`. It is intended only for a disposable TEST Supabase project. It has separate `preview` and `apply` operations. Run `preview` first and inspect its logs; only then run `apply` with the confirmation checkbox enabled. The apply operation re-runs the preview, applies migrations with the database password, and deploys the team Edge Function.

Configure the GitHub Actions environment `supabase-test` and its secrets:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF` — must identify the disposable TEST project, never production.

After the TEST Edge Function is deployed, set its server-side secret `APP_ALLOWED_ORIGINS` to the exact HTTPS origin(s) of the app. Do not place service-role or database credentials in `VITE_` variables or browser code.

## Hosting status

The GitHub Actions workflow builds pull requests and deploys to GitHub Pages only from `main`, when Pages is configured for GitHub Actions. The repository workflow expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Actions secrets for a cloud-connected deployment. Secret values are not readable from the repository documentation and must never be shared in chat or committed to Git.

## Not implemented / not connected

- Social publishing, Meta/Google ads, messaging, marketplace, e-commerce and payment integrations.
- AI content generation/agent orchestration and scheduled automation.
- Full production operational monitoring, backup/restore drills, retention policies and end-to-end rate-limit verification.

## Security and release rules

The GitHub repository is public. Do not commit credentials, customer data or backups. Require live database security tests and explicit owner approval before merging or deploying. External publishing, customer messaging, CRM mutations and ad spend must remain behind human approval.
