# BK-BusiCare AI Agent System

Responsive Vite web-app MVP for BK-BusiCare. The feature branch contains a local operations demo and an early Supabase authentication / multi-tenant foundation. It is **not yet a production SaaS or a fully integrated AI agent**.

## Run locally

1. Install Node.js 20 or later.
2. Run `npm install`.
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

The authenticated portal supports workspace-scoped cloud Leads and Content create/read/update/delete. PostgreSQL RLS is the security boundary; the UI also presents viewer accounts as read-only. Team invitations and role changes use the `manage-workspace-member` Supabase Edge Function, which validates caller JWTs and checks workspace roles. Deploy the function before using Team actions.

The SQL migration creates workspace, membership, lead, content and audit tables with RLS. Authorization helpers live in a private schema; do not expose that schema through the Supabase API. Never put the secret/service-role key in browser code.

**Not live-verified:** the migration and Edge Function have not yet been deployed to a real Supabase project. No real authentication, invitation email or two-user/two-workspace RLS test has been run. Do not enter customer data until these release gates pass.

## Test deployment

A manually triggered GitHub Actions workflow is provided at `.github/workflows/supabase-test-deploy.yml`. It is intended only for a disposable TEST Supabase project. It has separate `preview` and `apply` operations. Run `preview` first and inspect its logs; only then run `apply` with the confirmation checkbox enabled. The apply operation re-runs the preview, applies migrations with the database password, and deploys the team Edge Function.

Configure the GitHub Actions environment `supabase-test` and its secrets:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF` — must identify the disposable TEST project, never production.

The workflow has not been run. Configure required environment protection/reviewers before using it. Never send secrets in chat or commit them to Git.

## Hosting status

The GitHub Actions workflow builds pull requests and deploys to GitHub Pages only from `main`, when Pages is configured for GitHub Actions. Before a production deployment, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository Actions secrets; the workflow fails closed if either is missing. The current feature branch is not deployed.

## Not implemented / not connected

- Live Supabase provisioning, migration application and Edge Function deployment.
- Live cross-tenant RLS integration tests and production security review.
- Social publishing, Meta/Google ads, messaging, marketplace, e-commerce and payment integrations.
- AI content generation/agent orchestration and scheduled automation.
- Production monitoring, backups, retention and rate limiting.

## Security and release rules

The GitHub repository is public. Do not commit credentials, customer data or backups. Keep development on the feature branch. Require live database security tests and explicit owner approval before merging or deploying. External publishing, customer messaging, CRM writes and ad spend must remain behind human approval.
