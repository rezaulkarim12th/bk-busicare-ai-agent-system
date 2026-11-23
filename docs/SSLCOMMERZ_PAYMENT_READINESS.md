# BK-BusiCare — SSLCOMMERZ Payment Readiness

## Verified implementation state (2026-11-23)

- Store UI remains a sample catalogue and browser-session demo cart; checkout is disabled.
- SSLCOMMERZ payment methods are displayed as planned: bKash, Rocket, cards, and bank payment. Actual channel availability depends on merchant approval and configuration.
- Added server-side Edge Function source on branch `feature/sslcommerz-sandbox-readiness`:
  - `sslcommerz-create-session`: JWT-authenticated; reads a server-owned pending order, verifies ownership and BDT amount, then requests a hosted sandbox session.
  - `sslcommerz-ipn`: public webhook endpoint; validates the val_id against the official sandbox Order Validation API, checks transaction ID, store ID, amount and currency, and holds risk_level=1 for manual review.
- Added `supabase/sql/sslcommerz_payment_schema.sql` as a reviewed-schema proposal. It creates server-owned orders and payment transaction records, enables RLS, and revokes browser-role table privileges.
- Added function JWT configuration: checkout requires JWT; IPN disables gateway JWT because the provider cannot supply a Supabase token, and the handler validates the notification with SSLCOMMERZ.
- The SQL proposal has NOT been applied to Supabase TEST. The functions have NOT been deployed. No credentials were configured. No sandbox payment session or transaction has been tested.

## Remaining implementation blockers

1. The existing store catalogue and cart are demo-only. There is no server-owned product catalogue or order-creation endpoint yet. Therefore no legitimate pending order can currently be created for the session function.
2. A trusted order-creation flow must derive prices and totals from a server-controlled catalogue and store a customer contact/address snapshot. Never accept a browser-supplied amount or product price.
3. Customer return/result UI must display payment status from the server, not from URL query parameters.
4. Add provider-approved IPN settings, refund/reconciliation workflow, operational rate limiting, and full audit trail before any production release.
5. Complete the sandbox test matrix below before merging or enabling checkout.

## Required server-side secrets and settings

Set these directly in Supabase Edge Function Secrets under the supervision of the responsible adult business owner. Never paste them into chat, source files, browser variables, GitHub, or logs.

- `SSLCOMMERZ_MODE=sandbox`
- `SSLCOMMERZ_STORE_ID`
- `SSLCOMMERZ_STORE_PASSWORD`
- `APP_PUBLIC_URL` — exact HTTPS origin approved in `APP_ALLOWED_ORIGINS`
- `APP_ALLOWED_ORIGINS` — comma-separated exact HTTPS app origins
- Supabase runtime values used by the functions: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

Provider IPN URL after TEST deployment:
`https://<TEST_PROJECT_REF>.supabase.co/functions/v1/sslcommerz-ipn`

The session function is hard-locked to sandbox endpoints and returns 503 unless sandbox mode and server secrets are configured. Do not set a live mode or live credentials in this branch.

## Security controls in the source

- Checkout function requires a valid Supabase JWT and checks order ownership.
- Order total is read from a server-owned order row; it is never taken from the browser request.
- Customer details must be present in the order snapshot; no placeholder phone or address is sent to the provider.
- Only provider-hosted checkout is used; do not collect card numbers, CVV, PINs, or OTPs.
- Browser roles have no direct access to order/payment tables; RLS is enabled.
- IPN is not trusted until provider-side validation succeeds.
- Transaction IDs are unique; repeated IPNs reconcile the order status; risky transactions are held.
- No payment secrets are stored in the client bundle.

## Required sandbox test matrix

- Valid payment and validated order status
- Failed and cancelled payments
- Pending/timeout and gateway unavailable
- Duplicate IPN and retry after partial database update
- Invalid val_id / transaction ID / store ID
- Amount mismatch and currency mismatch
- Risk level 1 → manual_review, never automatic fulfilment
- Unauthorized user, wrong order owner, invalid order status
- Missing customer data, invalid origin, oversized request
- RLS/privilege isolation and duplicate transaction ID
- Refund and reconciliation (not implemented yet)

## Release and account requirements

A responsible adult business owner must handle merchant onboarding, required business/identity checks, provider agreement, and any account credentials. Do not bypass age, identity, or legal requirements. Production credentials, live payment activation, app publication, and customer fulfilment require separate adult-owner approval and reviewed release.

## Official references

- SSLCOMMERZ v4 integration guide: https://developer.sslcommerz.com/doc/v4/
- SSLCOMMERZ Order Validation API: https://sandbox-gw.sslcommerz.com/doc/v4/order-validation.html
- SSLCOMMERZ amount limits and session API: https://developer.sslcommerz.com/doc/v4/

This branch contains a sandbox-oriented backend scaffold, not a completed or tested payment integration. Do not claim that live payments or sandbox transactions are operational.
