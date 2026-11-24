# BK-BusiCare One — Security Audit

Last reviewed: 2026-11-24
Environment: repository source and isolated Supabase TEST project
Production changes: none

## Scope and limitations

This is an internal, evidence-based configuration and source review. It is not an independent penetration test, compliance certification, or proof of live end-to-end behavior.

## TEST environment

Project: BK-BusiCare-TEST (`rmnoiwzkhjwmgxwkfdzb`), ACTIVE_HEALTHY.

- 10 migrations applied.
- Eight public tables have RLS enabled: workspaces, workspace_members, leads, content_items, audit_events, product_catalog, orders and payment_transactions.
- Commerce/payment tables deny direct browser-role access; trusted server-side functions are the intended access path.
- Six Edge Functions are ACTIVE:
  - `create-workspace` v11 — gateway JWT required.
  - `manage-workspace-member` v13 — gateway JWT required.
  - `ai-content` v10 — gateway JWT disabled at gateway for preflight compatibility; handler validates the bearer token with Supabase Auth and checks workspace membership/role.
  - `busicare-create-order` v2 — gateway JWT required.
  - `sslcommerz-create-session` v2 — gateway JWT required.
  - `sslcommerz-ipn` v4 — gateway JWT disabled for provider callbacks; handler validates the callback server-side.
- The AI function is designed to return draft-only content; no social post is published by it.
- Payment functions are deployed to TEST only. No successful merchant sandbox transaction is evidenced.

## Advisor results — 2026-11-24

### Security

One WARN remains:
- `auth_leaked_password_protection`: leaked-password protection is disabled.
- Supabase documents HaveIBeenPwned leaked-password checks as available on Pro and above.
- This is an Auth provider setting, not something a SQL migration or frontend change can enable. The authorized adult account owner must decide whether the plan supports it and configure it in the dashboard.
- Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Performance

Six INFO-level unused-index notices:
- `orders_user_created_idx`
- `payment_transactions_order_idx`
- `product_catalog_active_idx`
- `audit_events_actor_idx`
- `leads_workspace_status_idx`
- `audit_workspace_created_idx`

These are informational. Do not drop indexes based only on a low-traffic TEST snapshot; collect representative query plans and workload evidence first.

### Health

No Health Advisor findings were returned.

## Source-level controls reviewed

- AI content handler checks exact allowed origins, bearer-token validity, workspace membership/role, request fields and quota before calling the OpenAI API. The server-side `OPENAI_API_KEY` and origin allowlist values are not readable through the connected inspection tools.
- Payment handlers use server-side merchant credentials, bounded request-body parsing, order/amount/currency checks and provider-side IPN validation. Merchant sandbox credentials and a successful transaction are not evidenced.
- Payment tables deny direct browser-role grants and policies.
- No secret values were read, changed, committed or disclosed.
- Production Supabase project (`ekznyijmghrjtovbbgun`) was not modified.

## Acceptance tests still required

The following are NOT certified as passed:
- Signup, email confirmation, login, logout, password recovery and actual email delivery.
- Two independent users in separate workspaces, tested against live APIs for read/write isolation.
- AI function browser preflight and authenticated generation after owner-managed TEST configuration.
- Invalid/expired JWT, disallowed origin, malformed/oversized body and quota-exhaustion cases against the deployed functions.
- SSLCommerz sandbox order/session, success/failure/cancel, duplicate/replay callback, timeout and reconciliation flows.
- Order ownership, price integrity, stock concurrency and complete order-state lifecycle.
- Physical Android device QA, accessibility/navigation checks and offline/network recovery.
- Backup/restore drill, monitoring/alerting, load test and independent security review.

## Release decision

TEST has a meaningful database/RLS and server-side integration foundation, but live provider and device acceptance evidence remains incomplete. Keep Production, real payments, external publishing, customer messaging and ad spend disabled until the relevant tests pass and the authorized owner approves a reviewed release plan. Play Store publication is explicitly out of scope until separately approved.

Never place service-role keys, database passwords, OpenAI keys, payment credentials or OAuth tokens in frontend variables, source control or chat.
