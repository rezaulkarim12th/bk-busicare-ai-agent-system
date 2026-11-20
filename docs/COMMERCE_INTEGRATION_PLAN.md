# BK-BusiCare Commerce Integration

## Decision

Build one shared BK-BusiCare commerce experience used by:
- the AI Agent System at https://rezaulkarim12th.github.io/bk-busicare-ai-agent-system/
- the existing WordPress.com Shop landing page at https://busicarecom.wordpress.com/marketplace/

The product/store name is **BK-BusiCare**. Do not use “Marketplace” as part of the brand name.

## Verified platform constraints

- The current WordPress.com site is a **Simple** site with limited site-tool support.
- Plugin installation is unavailable on this platform. WooCommerce cannot be installed here.
- Keep the current WordPress.com Free/low-cost setup; do not purchase or upgrade a plan as part of this work.
- The existing WordPress page titled “BK-BusiCare Shop” (slug: `marketplace`, page ID 824) is a published catalogue/landing page. It explicitly says checkout, payments and delivery are not yet enabled.
- The AI Agent System is a Vite application. Its local demo currently stores workspace data in browser Local Storage; the authenticated portal uses Supabase for Leads and Content. There is no commerce implementation yet.
- Supabase production and TEST projects must remain separate. Commerce development must start in TEST and must not change Production until a reviewed migration, security checks, and explicit release approval.
- Do not add payment credentials, service-role keys, customer secrets, or supplier credentials to browser code, Git, or chat.

## Target architecture

1. **Storefront UI in the AI Agent System**
   - Add a Store route/view with category navigation, search, product detail, cart and checkout-request flow.
   - Responsive premium corporate UI: navy, white and restrained gold accents.
   - Show prices in BDT, stock status, product condition/type and clear delivery/return information.
   - Support physical and digital catalogue items, but do not expose digital downloads until access control is implemented.
2. **Supabase data layer**
   - Start with TEST-only migrations for products, product categories, product images, carts/cart items, orders/order items and order status events.
   - Use workspace/tenant ownership for admin data.
   - Enable RLS on every exposed table. Public/anonymous users may read only active published product fields; authenticated customers may read and update only their own cart and orders; workspace admins manage only their own workspace's catalogue and orders.
   - Keep internal supplier cost, private notes, customer contact details and operational audit data out of public views.
   - Use server-side Edge Functions for order creation and status transitions. Recalculate totals and verify stock server-side; never trust client totals.
   - Reserve stock transactionally to prevent overselling. Record immutable order-item snapshots of title, SKU and price.
3. **WordPress connection**
   - Keep the existing “BK-BusiCare Shop” page as the public introduction and category/brand landing page.
   - Once the Store route is built and deployed, add a clearly labelled “Visit Online Store” link to the exact deployed Store URL. Do not invent a route or add a dead link before deployment.
   - On the current Simple plan, use a normal link between WordPress and the hosted Store. WooCommerce/plugin embedding is not available.
4. **AI Agent connection**
   - AI can assist with product descriptions, SEO metadata, category copy and customer-support draft replies.
   - AI must not set prices, promise stock, approve refunds, publish listings, contact customers, or execute orders without human approval.
5. **Payments and fulfilment**
   - Phase 1 is catalogue + cart + order request/manual confirmation only. Payment method names may be displayed as informational text, not represented as connected payment gateways.
   - No card data is stored. Real payment gateway activation, cash collection, refunds, shipping labels and supplier payouts are out of scope until an eligible account owner/admin configures and tests the provider integrations.
   - No real customer orders should be accepted until privacy, terms, delivery, returns, support, tax/consumer obligations and operational ownership are reviewed.

## Delivery phases and acceptance gates

### Phase A — Storefront foundation
- Add Store navigation and a responsive catalogue view.
- Add seeded non-commercial demo products clearly marked as sample data, or an empty state; never imply real stock or real prices.
- Add cart interactions in demo mode only.
- Keep the current local demo isolated from authenticated cloud data.
- Unit-test product filtering, cart quantity bounds and totals.

### Phase B — TEST backend
- Create and review commerce schema in TEST only.
- Add RLS tests for anonymous, customer, workspace member and admin roles.
- Add transactional order creation and stock checks.
- Run local Supabase migrations and pgTAP tests, then apply to TEST and run advisor checks.
- Do not deploy to Production in this phase.

### Phase C — WordPress hand-off
- Update the existing Shop landing page only after the final Store URL is known and verified.
- Add a clear Store CTA and keep supplier/contact information.
- Verify the published page on mobile and desktop.

### Phase D — Release readiness
- Test authenticated customer and admin sessions with separate test accounts.
- Test order lifecycle, stock concurrency, RLS isolation, error handling, backups and restore.
- Complete provider and policy review with the account owner.
- Require explicit approval before Production migration, deployment, accepting live orders or enabling payments.

## Current status

This document records the approved architecture and safe release sequence. It does **not** mean the Store UI, commerce database, WooCommerce, payment gateway, checkout or live ordering has already been implemented or connected.
