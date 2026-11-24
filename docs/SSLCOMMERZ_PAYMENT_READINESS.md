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
- Latest commit `2fa4a70aa5e5e962db092f7e4bb190af2cd12da0` has three successful GitHub Actions workflows: Build (dependency audit, all five Edge Function type checks, migration safety checks, JavaScript syntax and production bundle), Android APK (debug APK artifact uploaded), and local Supabase migration test (fresh disposable database plus the 18-assertion payment RLS pgTAP suite). The Pages deploy job was skipped because this is a pull-request branch; no site deployment occurred.
- The Android artifact is a DEBUG APK, not a signed release APK and not Play Store-ready. It has not yet passed physical Android device QA.
- No merchant credentials have been configured and no sandbox payment has been initiated or validated.
- Store UI remains a demo catalogue; checkout remains disabled.
- Supabase Security Advisor currently reports one warning: Leaked Password Protection is disabled. Performance Advisor reports six unused-index informational findings; these are expected to be inconclusive while the relevant tables are empty/new, and indexes should not be dropped without workload evidence.

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
- Complete physical Android device QA and produce a signed release build only after the owner gates and review pass.

## Official references

- SSLCOMMERZ v4 guide: https://developer.sslcommerz.com/doc/v4/
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase Data API security: https://supabase.com/docs/guides/api/securing-your-api
- Supabase leaked password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

This is a deployed TEST backend foundation, not a completed payment integration. No sandbox transaction or live payment has been tested.


## 2026-11-24 security and reproducibility follow-up

- A source-to-deployment comparison confirmed that all three active TEST payment/order functions exactly matched the source files on this feature branch.
- The three functions originally buffered request bodies with `req.text()` before checking their size limits. A shared streaming byte-limited reader has now been added and wired into all three functions.
- Five Deno tests cover normal bodies, UTF-8 byte counting, oversized chunked bodies, early rejection from an oversized Content-Length, and empty bodies.
- The Deno test file was renamed to `read-limited-body.deno.ts` after the first CI run showed that Node's automatic `node --test` discovery also picked up the Deno-specific test file. The five Deno tests passed in that run; the Node test step failed because of the runner mismatch. The rename and CI path updates are committed, but a subsequent CI run has not yet been confirmed.
- The two TEST payment migrations are now committed on this branch as `supabase/migrations/20261123094545_sslcommerz_payment_foundation.sql` and `supabase/migrations/20261123094616_deny_browser_access_payment_tables.sql`. The local Supabase workflow was changed to apply these committed migrations directly instead of generating an ephemeral migration. A fresh-database CI run remains pending.
- No request-body fix has been deployed to Supabase TEST. No merchant credentials were configured and no sandbox transaction was initiated.
- Android workflow run [45426215584](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/45426215584) successfully uploaded artifact `BK-BusiCare-Android-debug` (artifact ID 14936204125). This is a debug APK from commit `7e2bb03779f32f1ba3374143ba0e21e537758358`, before the latest streaming-reader and migration commits. It is not a signed release APK and has not passed physical-device QA.

Keep PR #14 unmerged and checkout/payment disabled until the updated CI passes, the bounded-reader fix is deployed and verified in TEST, all provider-backed sandbox scenarios pass, and the authorized owner gates are complete.
