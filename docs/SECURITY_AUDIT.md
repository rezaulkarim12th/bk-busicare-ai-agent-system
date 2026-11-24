# Internal security audit

Last reviewed: 2026-11-24
Environment reviewed: repository documentation/source snapshot and separate Supabase TEST project
Production changes: none

## Scope and evidence

- Read-only inspection of the GitHub main branch and current Supabase TEST project.
- TEST project state, applied migrations, public tables/RLS flags, deployed Edge Function status and gateway JWT settings.
- Supabase Security and Performance Advisor results.
- This is a focused internal review, not an independent penetration test or compliance certification.

## Current TEST deployment

Project: BK-BusiCare-TEST (`rmnoiwzkhjwmgxwkfdzb`), ACTIVE_HEALTHY.

- 10 migrations are applied.
- Eight public tables have RLS enabled: workspaces, workspace_members, leads, content_items, audit_events, product_catalog, orders and payment_transactions.
- Product catalogue, order and payment tables are protected from direct browser-role access by deny policies; intended operations are server-side.
- Six Edge Functions are ACTIVE:
  - `create-workspace` v11 — gateway JWT required.
  - `manage-workspace-member` v13 — gateway JWT required.
  - `ai-content` v9 — gateway JWT required.
  - `busicare-create-order` v1 — gateway JWT required.
  - `sslcommerz-create-session` v1 — gateway JWT required.
  - `sslcommerz-ipn` v3 — gateway JWT not required because it receives an external provider callback; callback authenticity and transaction details must be validated server-side.
- The existence of active functions is not evidence that secrets, provider accounts, callback URLs or end-to-end flows are configured and tested.

## Advisor results — 2026-11-24

### Security

One WARN:
- `auth_leaked_password_protection`: leaked-password protection is disabled.
- Supabase documents the HaveIBeenPwned check as a Pro-and-above feature. The organization was previously verified as Free tier.
- This is a provider-level Auth setting and cannot be substituted by SQL or frontend logic. An authorized adult account owner must decide on plan eligibility and enablement.
- Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Performance

Six INFO-level unused-index notices:
- orders_user_created_idx
- payment_transactions_order_idx
- product_catalog_active_idx
- audit_events_actor_idx
- leads_workspace_status_idx
- audit_workspace_created_idx

Do not remove these indexes solely because they are currently unused in a low-traffic TEST project. Review representative query plans and workload history before any index change.

## Security controls and boundaries observed

- RLS is enabled on all eight public tables returned by the TEST inspection.
- Commerce tables deny direct browser-role access; trusted server-side functions are the intended access path.
- The deployed AI function is JWT-protected at the gateway and is designed to check workspace membership/role and enforce quotas before generating draft-only content.
- The SSLCommerz IPN endpoint intentionally has gateway JWT verification disabled to accept provider callbacks. It must validate each callback against the provider's server-side transaction validation API and match order, amount and currency before any payment state transition.
- Production Supabase project was not modified.
- No secrets or credential values were read, changed or disclosed during this review.

## Tests not yet demonstrated

The following remain unverified and must not be described as passed:
- Live signup, login, logout, password reset and email confirmation delivery.
- Live invitation email delivery and role-boundary enforcement.
- Two-user/two-workspace API isolation using independent accounts and direct API requests.
- Invalid/expired JWT, disallowed origin, malformed/oversized body, quota exhaustion and provider failure responses.
- Successful authenticated OpenAI generation using TEST server-side secrets.
- Successful SSLCommerz sandbox payment and IPN callback, including replay/duplicate callback handling.
- Order ownership, price calculation, stock concurrency and state-transition tests.
- Controlled load test, backup/restore drill, monitoring and incident-response exercise.
- Independent penetration testing.

## Source-level review follow-ups

- The three payment/order Edge Function sources are absent from `main` and are tracked on `feature/sslcommerz-sandbox-readiness` (open Draft PR #14). The deployed TEST code exactly matched those branch files during the 2026-11-24 inspection.
- All three payment/order functions originally buffered the full body before checking the configured limit. A shared streaming byte-limited reader is now deployed to TEST: `busicare-create-order` v2, `sslcommerz-create-session` v2 and `sslcommerz-ipn` v4. Re-fetching the deployed source confirmed the bounded reader is imported and called in all three; no `await req.text()` path remains.
- Five Deno tests passed. Build workflow `45426715210` and clean local Supabase migration/pgTAP workflow `45426715257` both succeeded. A subsequent documentation-PR local migration run `45426762999` also succeeded.
- Android debug APK artifact `14936878142` was uploaded by workflow `45426715201` from commit `37ccdd6`. It is not signed and has not passed physical Android device QA.
- Verify SSLCommerz IPN provider validation, amount/currency/order matching, idempotency and replay handling before any payment status is treated as confirmed.
- Never place service-role keys, database passwords, OpenAI keys, payment credentials or OAuth tokens in frontend variables, source control or chat.

## Release decision

The TEST database has meaningful RLS and server-side integration foundations, but the above live tests and operational controls remain open. Do not load real customer data, accept real orders, enable live payments, publish content or spend advertising budget until the relevant acceptance tests pass and the owner approves. Production release requires separate review, explicit approval and a rollback plan.
