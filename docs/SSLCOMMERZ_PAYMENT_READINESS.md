# BK-BusiCare — SSLCOMMERZ Payment Readiness

## TEST deployment state (2026-11-23)

- Supabase TEST migrations `sslcommerz_payment_foundation` and `deny_browser_access_payment_tables` are applied.
- Tables `product_catalog`, `orders`, and `payment_transactions` exist. RLS is enabled on all three; explicit deny-all policies and revoked browser-role grants prevent direct client access.
- Verified table counts are currently zero. No real product or price has been entered.
- Three Edge Functions are deployed and ACTIVE:
  - `busicare-create-order` — JWT required; derives totals from active server-side catalogue rows.
  - `sslcommerz-create-session` — JWT required; verifies order ownership and creates a hosted sandbox session.
  - `sslcommerz-ipn` — provider webhook, JWT disabled at gateway; validates the transaction against SSLCOMMERZ before updating order state. TEST deployment version 3 adds terminal-state protection, same-validation-ID idempotency, conditional transaction updates, race-aware reconciliation, and prevents invalid callbacks from changing transaction state.
- Database permission check confirms RLS enabled, `anon` and `authenticated` cannot SELECT the three payment tables, and `service_role` has server-side SELECT permission.
- Build CI now type-checks all five Edge Functions, runs the 64 existing application/migration tests, checks JavaScript syntax, audits dependencies, and builds the production bundle. Latest confirmed build CI succeeded before the IPN v3 commit; CI for the latest commit is running.
- Local Supabase CI now generates a temporary migration using the Supabase CLI from `supabase/sql/sslcommerz_payment_schema.sql`, then applies it to a disposable local database and runs pgTAP. A dedicated 18-assertion pgTAP file checks payment-table existence, RLS, browser-role denial, service-role access, and deny policies. The latest local run is still in progress; its result is not yet confirmed.
- No merchant credentials have been configured and no sandbox payment has been initiated or validated.
- Store UI remains a demo catalogue; checkout remains disabled.

## Data API configuration

Supabase's 2026-10-30 Data API change means new public tables may not be exposed to the Data API automatically. Table grants for `service_role` are present, but the project's exposed-schema configuration could not be read from SQL. The project owner must verify that `public` is listed in Settings → API → Exposed schemas. Do not expose any additional schema unnecessarily. Documentation: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

## Server-side order flow

1. An authenticated customer submits product IDs, quantities, and delivery/contact details to `busicare-create-order`.
2. The function reads only active products from `product_catalog`; it ignores client prices and computes the BDT total on the server.
3. It stores an item snapshot and creates a pending order.
4. The authenticated customer can then request `sslcommerz-create-session` for that order.
5. SSLCOMMERZ IPN is validated server-to-server. Browser redirects are never proof of payment.
6. A `risk_level=1` transaction is held for manual review.
7. Duplicate callbacks for the same validation ID can safely reconcile a previously partial order update. Failed, cancelled, and refunded transaction states cannot be promoted to paid by a late callback.
8. Invalid or mismatched callbacks are rejected without mutating a pending transaction, preventing transaction-state poisoning.

## Required owner configuration

A responsible adult business owner must complete any merchant onboarding, business/identity checks, and provider authorization. Do not bypass age, identity, or legal requirements.

The owner must configure the following only in Supabase Edge Function Secrets, never in chat, GitHub, frontend variables, or logs:
- `SSLCOMMERZ_MODE=sandbox`
- `SSLCOMMERZ_STORE_ID`
- `SSLCOMMERZ_STORE_PASSWORD`
- `APP_PUBLIC_URL` (exact approved HTTPS origin)
- `APP_ALLOWED_ORIGINS` (comma-separated exact HTTPS origins)

Supabase runtime secret keys must remain server-side. Never expose the service-role/secret key to a browser or mobile package.

## Remaining release gates

- Project owner verifies Data API schema exposure.
- Authorized business owner approves and enters real catalogue names, prices, and service terms. Catalogue is currently empty by design.
- Store UI is connected to order creation and payment session functions only after the authenticated UI has been independently reviewed.
- Adult owner configures sandbox secrets and provider IPN URL.
- Run provider-backed success, failure, cancellation, pending, timeout, duplicate IPN, invalid validation ID, wrong transaction/store, amount/currency mismatch, and risk-hold tests.
- Run authenticated ownership, RLS, rate-limit, and abuse tests against deployed TEST.
- Implement and review refund, reconciliation, receipts, fulfilment, and audit workflow.
- Project owner enables Supabase Leaked Password Protection in Auth settings; Security Advisor still reports it disabled.
- Run full end-to-end regression and independent security review before merging PR #14.

## Official references

- SSLCOMMERZ v4 guide: https://developer.sslcommerz.com/doc/v4/
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase Data API security: https://supabase.com/docs/guides/api/securing-your-api
- Supabase leaked password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

This is a deployed TEST backend foundation, not a completed payment integration. No sandbox transaction or live payment has been tested.
