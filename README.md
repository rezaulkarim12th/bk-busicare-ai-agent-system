# BK-BusiCare AI Agent System

Responsive Vite web-app MVP for BK-BusiCare. The repository contains a local operations demo, a Supabase authentication portal, a multi-tenant workspace foundation and a growing TEST-only commerce/payment backend. It is **not yet a complete production SaaS, fully integrated AI-agent platform or certified Android release**.

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

The authenticated portal supports workspace-scoped cloud Leads and Content create/read/update/delete. PostgreSQL RLS is the security boundary; the UI also presents viewer accounts as read-only. Team invitations and role changes use the `manage-workspace-member` Supabase Edge Function, which validates caller JWTs and checks workspace roles. Configure the Edge Function secret `APP_ALLOWED_ORIGINS` with a comma-separated exact allowlist of trusted app origins; wildcard origins are not supported.

The SQL migrations create workspace, membership, lead, content and audit tables with RLS. Authorization helpers live in a private schema; do not expose that schema through the Supabase API. Never put the secret/service-role key in browser code.

## TEST backend snapshot — verified 2026-11-24

The separate `BK-BusiCare-TEST` Supabase project (`rmnoiwzkhjwmgxwkfdzb`) is ACTIVE_HEALTHY. It has 10 migrations and eight public tables with RLS enabled: workspaces, workspace_members, leads, content_items, audit_events, product_catalog, orders and payment_transactions.

Six TEST Edge Functions are ACTIVE:
- `create-workspace` v11
- `manage-workspace-member` v13
- `ai-content` v9
- `busicare-create-order` v1
- `sslcommerz-create-session` v1
- `sslcommerz-ipn` v3

The three commerce/payment tables are protected from direct browser-role access and are intended to be managed server-side. Deployed/ACTIVE does not mean an end-to-end order or payment has passed testing. Do not accept real orders or enable live payment until the TEST lifecycle and provider sandbox have passed.

The separate Production project is ACTIVE_HEALTHY and was not modified during the 2026-11-24 review. Do not change Production without explicit owner approval and a reviewed deployment/rollback plan.

## Local Supabase CI

The workflow `.github/workflows/supabase-local-ci.yml` is designed to start a disposable local Supabase stack, apply repository migrations and run the pgTAP RLS regression suite. It does not connect to or modify the user's Supabase projects. A passing local workflow does not prove remote Auth delivery, live API authorization, provider integration or Production security.

## Current release gates

See [Implementation & Release Status](docs/IMPLEMENTATION_STATUS.md) for the verified TEST inventory and outstanding acceptance tests, and [Security Audit](docs/SECURITY_AUDIT.md) for current security observations.

Not yet certified:
- Live signup/login/password recovery and invitation email delivery.
- Live two-user/two-workspace API isolation and role-boundary tests.
- Successful authenticated OpenAI draft generation with TEST server-side secrets.
- End-to-end order/stock workflow and SSLCommerz sandbox payment/IPN validation.
- Social publishing, messaging, Meta/Google advertising and other external write integrations.
- Complete CRM/client operations, production monitoring, backup/restore and incident response.
- Android APK packaging, installation and device QA. A workflow/branch alone is not a tested APK.

The Supabase Security Advisor currently reports a WARN for disabled leaked-password protection. Performance Advisor reports six INFO-level unused-index notices; these should be assessed against workload evidence, not removed blindly.

The TEST payment functions currently live on the separate `feature/sslcommerz-sandbox-readiness` branch / Draft PR #14, not on `main`. A bounded streaming request-body fix and five Deno tests have been added there; the first Deno tests passed, but the overall CI failed because Node auto-discovered the Deno test file. The test file has been renamed and CI updated; a new CI result and TEST deployment are pending. The two timestamped payment migrations are now committed on that feature branch. A debug APK artifact exists, but it is unsigned and not device-tested.

## Security and release rules

The GitHub repository is public. Do not commit credentials, customer data or backups. Never put service-role keys, database passwords, OpenAI keys, payment credentials or OAuth tokens in `VITE_` variables, browser code, Git or chat.

Require live database security tests and explicit owner approval before merging or deploying. External publishing, customer messaging, CRM mutations, checkout/payment activation and ad spend must remain behind human approval.

## Brand assets

- `public/bk-busicare-horizontal-logo.svg` — BK-BusiCare public website and workspace header.
- `public/busicare-app-icon.svg` — BusiCare in-app identity / square app mark.
- `public/brand-demo.html` — responsive brand experience preview.
