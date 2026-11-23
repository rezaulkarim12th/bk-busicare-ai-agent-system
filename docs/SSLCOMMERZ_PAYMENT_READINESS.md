# BK-BusiCare — SSLCOMMERZ Payment Readiness

## Current implementation state
- The Store is a sample-only catalogue and session-only demo cart.
- SSLCOMMERZ is shown as the planned gateway with selected display methods: bKash, Rocket, Visa/Mastercard, and bank payment.
- Checkout remains disabled. No payment session is created and no funds can be collected.
- This change is a UI/readiness update only; it is not a live or sandbox integration.

## Required architecture before sandbox integration
1. Order authority: create a server-owned order with unique internal ID, immutable item/price snapshot, BDT currency, and pending status. Never trust a browser-supplied payable amount.
2. Authenticated initiation: an authenticated customer requests checkout. A server-side Supabase Edge Function checks order ownership, state, item prices, and total, then creates a unique transaction ID.
3. Server-side gateway call: call the SSLCOMMERZ Session API from the Edge Function only. Use sandbox endpoints and server-side secrets. Return only the hosted GatewayPageURL to the client.
4. Payment notification: configure the merchant-panel IPN URL to a server endpoint. Browser redirects are display-only signals, never proof of payment.
5. Authoritative validation: for an IPN or callback, call the SSLCOMMERZ Order Validation API from the server. Verify transaction ID, amount, currency, store identity, and order association. Make updates idempotent.
6. Risk handling: if risk_level is 1, hold the order for manual review; do not fulfil it automatically.
7. Fulfilment and receipts: mark an order paid only after successful server validation. Issue a receipt only after validation.
8. Refunds and reconciliation: add audited, role-restricted refund handling and transaction reconciliation before production use.

## Security requirements
- Never put store passwords, service-role keys, database credentials, or other secrets in browser code, VITE_ variables, Git, logs, or chat.
- Store credentials only as Supabase Edge Function secrets; use separate sandbox and production credentials.
- Enforce authentication, order ownership, least privilege, request-size limits, rate limits, strict origin allowlists, and database Row Level Security.
- Use TLS 1.2 or higher.
- Do not store card numbers, CVV, PINs, or OTPs. Use the provider-hosted payment page.
- Verify IPN data with the provider validation API; do not trust client-submitted status or amount.
- Prevent duplicate processing with unique transaction IDs and idempotent database updates.

## Release gates
- A responsible adult business owner must complete provider merchant onboarding and required business/identity verification. Do not bypass age, identity, or legal requirements.
- Confirm merchant approval and that selected payment channels are enabled for the merchant.
- Complete sandbox success, failure, cancellation, pending, duplicate-IPN, amount-mismatch, currency-mismatch, invalid-transaction, risky-payment, and refund tests.
- Run database/RLS, authorization, abuse/rate-limit, and end-to-end regression tests.
- Production credentials and live activation require explicit approval from the responsible adult account owner and a separate reviewed release.

## Official provider references
- SSLCOMMERZ developer portal: https://developer.sslcommerz.com/
- SSLCOMMERZ v4 integration guide: https://developer.sslcommerz.com/doc/v4/
- SSLCOMMERZ sandbox documentation: https://sandbox-gw.sslcommerz.com/docs

This document describes the target architecture. It does not claim that sandbox or live transactions have been tested.