# BK-BusiCare AI Agent System

Responsive Vite web-app MVP for BK-BusiCare. The current repository contains a local operations demo and an early Supabase authentication / multi-tenant database foundation. It is **not yet a production SaaS or an integrated AI agent**.

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

## Supabase authentication foundation

When both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, the local demo is suppressed and the authentication portal is shown. It supports email/password sign-in, registration, password reset, workspace creation, workspace selection and read-only membership listing.

If only one Supabase variable is configured, the app fails closed and shows a configuration warning instead of opening the local demo.

The SQL migration creates workspace, membership, lead, content and audit tables with RLS. Authorization helper functions live in a private schema; do not add that schema to the Supabase API-exposed schema list. Audit-event writes and membership mutations are reserved for trusted server-side functions.

**Important:** the authenticated portal is not yet connected to cloud Leads or Content CRUD. When Supabase is configured, users can authenticate and view workspace membership, but operational data management is not yet available in the portal. The SQL migration has not been applied or tested against a live Supabase project.

## Configure Supabase for a disposable test project

1. Copy `.env.example` to `.env.local`.
2. Set the public project URL and publishable/anon key only.
3. Apply `supabase/migrations/0001_multitenant_foundation.sql` to a new disposable project after reviewing it.
4. Enable email authentication and set the correct site URL and allowed redirect URLs.
5. Run `npm test` and `npm run build`.
6. Test with two separate users and two workspaces before considering real customer data.

Never expose a service-role key, database password, OAuth secret, access token or customer data in browser variables or Git.

## Hosting status

The GitHub Actions workflow builds pull requests and deploys to GitHub Pages only from `main`, when Pages is configured for GitHub Actions. The current feature branch is not deployed. Cloudflare Pages is a possible alternative but is not connected.

## Not implemented yet

- Cloud-synced Leads and Content CRUD.
- Server-side team invitations, role changes and audit-event writes.
- Live cross-tenant RLS integration tests and production monitoring.
- Social publishing, Meta/Google ads, messaging, marketplace, e-commerce and payment integrations.
- AI content generation/agent orchestration and scheduled automation.

## Security and release rules

The GitHub repository is currently public. Do not commit secrets, private customer data, exported backups or production records. Keep all new work on the feature branch. Require live database security tests and explicit owner approval before merging or deploying. External publishing, customer messaging, CRM writes and ad spend must remain behind human approval.
