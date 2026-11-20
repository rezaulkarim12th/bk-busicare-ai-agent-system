# BK-BusiCare AI Agent System — Final MVP Delivery

Delivery date: 2026-11-20
Release channel: feature branch / TEST environment
Application version: 0.2.0

## What is delivered

A responsive, free-first Vite web application MVP with:
- Dashboard with lead totals, open pipeline value, won revenue, win rate and due/overdue follow-ups.
- CRM / Leads: create, edit, delete, search, status, service, value and follow-up date.
- Sales Pipeline with New, Contacted, Proposal, Won and Lost stages.
- Content Planner for Facebook, Instagram, TikTok, LinkedIn and YouTube.
- AI Copilot prompt builder with input validation. It creates a prompt for use with an external AI tool; no live AI provider is connected.
- CSV export with spreadsheet formula-injection mitigation.
- JSON backup and restore with input validation, 2 MB limit and persistence-failure recovery.
- Settings and local browser demo mode.
- Supabase Auth portal source for email/password sign-in, registration, password recovery, workspace creation/switching, cloud Leads/Content CRUD and team administration.
- Multi-tenant Postgres schema, RLS, role policies and audit events.
- Team-management Edge Function source and TEST deployment.

## Verified build and tests

On feature head `46b97a7e2b9613dce5a5d033742ce7e42d29b7d8`:
- [Build workflow passed](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44678286959): dependency audit, Deno type-check, Node regression tests, JavaScript syntax and Vite production build.
- [Local Supabase workflow passed](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44678286878): disposable stack, migrations, pgTAP RLS suite, local service checks and cleanup.

The latest documentation and version-number changes are subsequent commits and trigger a fresh CI run. Confirm that run before merging.

## TEST backend

Project: `BK-BusiCare-TEST`
Project ref: `rmnoiwzkhjwmgxwkfdzb`
Status: ACTIVE_HEALTHY

Applied migrations:
- `20261120044848_multitenant_foundation`
- `20261120044911_performance_hardening`

RLS-enabled tables:
- `workspaces`
- `workspace_members`
- `leads`
- `content_items`
- `audit_events`

Edge Function: `manage-workspace-member`, ACTIVE version 1.

A temporary SQL tenant-isolation check returned zero cross-workspace rows and rolled back its transaction. Full live browser Auth/API and team-function tests are not complete. Configure `APP_ALLOWED_ORIGINS` to the exact deployed HTTPS app origin before browser calls.

## How to run the local demo

1. Install Node.js 20 or later.
2. Run `npm ci`.
3. Run `npm run dev`.
4. Open the Vite local URL.
5. Without both Supabase frontend variables, the app opens in browser-local demo mode. Data is stored only in that browser's Local Storage and does not sync to other devices.

To enable the Supabase Auth portal, configure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as frontend-safe values. Never use a service-role key, database password or access token in browser variables.

## Not included in this MVP

Live AI text generation/orchestration, social auto-publishing, Meta/Google Ads management, customer messaging, Shopify/WooCommerce, payments/subscriptions, marketplace integrations, scheduled jobs and production monitoring/backups are not connected. Each requires provider accounts, approved API scopes, server-side secrets and further implementation. Keep publishing, messaging, CRM mutations and ad spend behind explicit human approval.

## Release status

This is a delivered and CI-tested MVP plus a separate TEST-stage Supabase foundation. It is not a production deployment or complete integrated AI automation SaaS. PR #1 remains Draft and unmerged. Production project `ekznyijmghrjtovbbgun` has not been modified. Do not load real customer data until live Auth, CORS, two-user/two-workspace API tests and operational release gates pass.

## Key links

- Repository: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system
- PR #1: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/pull/1
- TEST Supabase: https://supabase.com/dashboard/project/rmnoiwzkhjwmgxwkfdzb
- GitHub TEST environment settings: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/settings/environments
- Edge Function secrets: https://supabase.com/dashboard/project/rmnoiwzkhjwmgxwkfdzb/functions/secrets
