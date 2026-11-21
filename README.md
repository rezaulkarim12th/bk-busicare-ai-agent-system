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
- Store catalogue preview with sample-only cards and session-only demo cart (no live inventory, checkout or payments).
- Content planning for Facebook, Instagram, TikTok, LinkedIn and YouTube.
- Basic reports and CSV export.
- JSON backup and restore.
- Responsive desktop and mobile UI.

Demo records stay in the current browser's Local Storage. They do not sync across devices or accounts.

## Supabase authentication and cloud workspace

When both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, the local demo is suppressed and the authenticated portal opens. It supports email/password sign-in, registration, password recovery, workspace creation and workspace selection.

The authenticated portal supports workspace-scoped cloud Leads and Content create/read/update/delete. PostgreSQL RLS is the security boundary; the UI also presents viewer accounts as read-only. Team invitations and role changes use the `manage-workspace-member` Supabase Edge Function, which validates caller JWTs and checks workspace roles. Configure the Edge Function secret `APP_ALLOWED_ORIGINS` with a comma-separated exact allowlist of trusted app origins; wildcard origins are not supported. The function uses a database-locked invitation quota of five attempts per actor per workspace per ten minutes and records invitation attempts in the audit log.

The SQL migrations create workspace, membership, lead, content and audit tables with RLS. Authorization helpers live in a private schema; do not expose that schema through the Supabase API. Never put the secret/service-role key in browser code.

## Environment status (verified 2026-11-21)

The latest repository commit aligns the Supabase Edge Function gateway JWT settings for `manage-workspace-member`, `create-workspace` and `ai-content`. GitHub Actions run [44810200210](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44810200210) completed successfully: both build and GitHub Pages deploy jobs passed.

The isolated `BK-BusiCare-TEST` Supabase project (`rmnoiwzkhjwmgxwkfdzb`) has the verified multi-tenant database foundation and the deployed `create-workspace` and `manage-workspace-member` functions described in [Implementation & Release Status](docs/IMPLEMENTATION_STATUS.md). That status document is the current source of truth for migration counts, function versions, regression results and outstanding release gates.

Production project configuration and live user workflows are not certified by a successful GitHub Pages build. Older point-in-time Production observations are intentionally not presented here as current acceptance evidence. Do not change Production without explicit owner approval and a reviewed deployment plan.

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

- Live social publishing, Meta/Google ads, messaging, commerce database/orders, checkout and payment integrations.
- AI content generation/agent orchestration and scheduled automation.
- Full production operational monitoring, backup/restore drills, retention policies and end-to-end rate-limit verification.

## Security and release rules

The GitHub repository is public. Do not commit credentials, customer data or backups. Require live database security tests and explicit owner approval before merging or deploying. External publishing, customer messaging, CRM mutations and ad spend must remain behind human approval.


## Brand assets

- `public/bk-busicare-horizontal-logo.svg` — BK-BusiCare public website and workspace header.
- `public/busicare-app-icon.svg` — BusiCare in-app identity / square app mark.
- `public/brand-demo.html` — responsive brand experience preview.

The profile portrait in the demo remains an initials placeholder until the owner-provided photo is added to the repository. The vector marks are clean implementation assets and should be replaced with the approved original logo artwork if pixel-perfect brand matching is required.
