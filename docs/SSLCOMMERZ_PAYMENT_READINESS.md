# BK-BusiCare — SSLCOMMERZ Payment Readiness

## TEST deployment state (2026-11-23)

- Supabase TEST migration `sslcommerz_payment_foundation` applied successfully.
- Supabase TEST migration `deny_browser_access_payment_tables` applied successfully.
- Tables `product_catalog`, `orders`, and `payment_transactions` exist. RLS is enabled on all three; explicit deny-all policies and revoked browser-role grants prevent direct client access.
- Verified table counts are currently zero. No real product or price has been entered.
- Three Edge Functions are deployed and ACTIVE:
  - `busicare-create-order` — JWT required; derives totals from active server-side catalogue rows.
  - `sslcommerz-create-session` — JWT required; verifies order ownership and creates a hosted sandbox session.
  - `sslcommerz-ipn` — provider webhook, JWT disabled at gateway; validates the transaction against SSLCOMMERZ before updating order state.
- No merchant credentials have been configured and no sandbox payment has been initiated or validated.
- Store UI remains a demo catalogue; checkout remains disabled.

## Important integration blocker

Supabase's 2026-10-30 Data API change means new public tables may not be exposed to the Data API automatically. The project owner must verify that `public` is listed in Settings → API → Exposed schemas, or the Edge Functions' server-side PostgREST calls will not reach these tables. Do not expose any additional schema unnecessarily. Documentation: https://supabase.com/changelog?types=breaking-change

## Server-side order flow

1. An authenticated customer submits product IDs, quantities, and their delivery/contact details to `busicare-create-order`.
2. The function reads only active products from `product_catalog`; it ignores client prices and computes the BDT total on the server.
3. It stores an immutable item snapshot and creates a pending order.
4. The authenticated customer can then request `sslcommerz-create-session` for that order.
5. SSLCOMMERZ IPN is validated server-to-server. Browser redirects are never proof of payment.
6. A risk_level=1 transaction is held for manual review.

## Required owner configuration

The responsible adult business owner must complete merchant onboarding, business/identity checks, and provider authorization. Do not bypass age, identity, or legal requirements.

Set the following only in Supabase Edge Function Secrets, never in chat, GitHub, frontend variables, or logs:
- `SSLCOMMERZ_MODE=sandbox`
- `SSLCOMMERZ_STORE_ID`
- `SSLCOMMERZ_STORE_PASSWORD`
- `APP_PUBLIC_URL` (exact approved HTTPS origin)
- `APP_ALLOWED_ORIGINS` (comma-separated exact HTTPS origins)

Supabase runtime values must remain server-side. Never expose the service-role/secret key to a browser or mobile package.

## Remaining release gates

- Confirm Data API exposure for the required schema.
- Have the responsible adult owner add approved catalogue entries with real product names, prices, and service terms. Current catalogue is empty by design.
- Wire the authenticated Store UI to order creation and payment session functions; keep checkout disabled until the UI is reviewed.
- Configure sandbox secrets and provider IPN URL under adult-owner supervision.
- Run success, failure, cancellation, pending, timeout, duplicate IPN, invalid val_id, wrong transaction/store, amount/currency mismatch, risk hold, ownership, RLS, and abuse/rate-limit tests.
- Add refund, reconciliation, receipts, fulfilment, and audit workflow.
- Enable Supabase Leaked Password Protection in Auth settings; current Security Advisor still reports it disabled.
- Run full end-to-end regression and security review before merging PR #14.

## Official references

- SSLCOMMERZ v4 guide: https://developer.sslcommerz.com/doc/v4/
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase breaking changes: https://supabase.com/changelog?types=breaking-change
- Leaked password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

This is a deployed TEST backend foundation, not a completed payment integration. No sandbox transaction or live payment has been tested.