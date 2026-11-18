# BK-BusiCare Centralized Business Management System

## Product objective
Evolve the existing browser-only MVP into a secure, multi-user operations platform for BK-BusiCare. The current MVP remains a prototype: it stores data in browser Local Storage and has no server authentication, cloud database, AI provider, or live platform integrations.

## Target modules
1. Executive dashboard: leads, sales, follow-ups, content queue, client delivery, and campaign KPIs.
2. CRM: contacts, organizations, lead source, service interest, consent, owner, notes, next action, and full activity history.
3. Sales pipeline: qualification, proposal, negotiation, won/lost, revenue forecast, and follow-up reminders.
4. Client operations: onboarding, scope, tasks, deliverables, deadlines, approvals, and client communication log.
5. Content studio: multi-platform calendar, campaign briefs, copy variants, creative asset references, review/approval, and publishing status.
6. Social and advertising integrations: Meta, Instagram, TikTok, LinkedIn, YouTube, and Google, subject to each provider's official API eligibility and granted scopes.
7. Marketplace and prospecting workspace: Upwork, Fiverr, and other prospect sources. Use permitted APIs or user-assisted workflows; do not automate prohibited scraping or unsolicited messaging.
8. E-commerce and web operations: Shopify/WooCommerce/WordPress connections where supported, store health, product/content tasks, and reporting.
9. AI copilot: draft content, summarize leads, propose next actions, and prepare reports. AI must not independently send messages, publish, edit external records, or spend money.
10. Reporting: CSV/XLSX exports, sales funnel, source attribution, campaign metrics, task delivery, and audit history.
11. Administration: secure sign-in, role-based access, tenant isolation, team invitations, settings, backup/restore, and audit logs.

## Delivery phases and acceptance gates

### Phase 1 — Stabilize the prototype
- Run a reproducible production build and automated smoke tests.
- Validate lead creation/edit/delete, pipeline stage updates, content planning, CSV export, JSON backup/restore, and mobile layout.
- Add validation, empty/error states, and safer Local Storage handling.
- Acceptance: all prototype workflows pass tests; limitations remain clearly labelled.

### Phase 2 — Secure application foundation
- Select hosting and backend stack.
- Add server API, relational database, migrations, authentication, password reset, role-based permissions, tenant isolation, rate limiting, audit logs, and backups.
- Move secrets to hosting environment variables or a managed secret store.
- Acceptance: security review and tenant-isolation tests pass before any real customer data is loaded.

### Phase 3 — Core CRM and client operations
- Implement contacts, companies, activities, tasks, reminders, client onboarding, service delivery, and ownership.
- Add import/export with validation and duplicate detection.
- Acceptance: end-to-end lead-to-client workflow is tested.

### Phase 4 — AI copilot
- Add provider-backed AI behind a server-side adapter; never expose provider keys in browser code.
- Support draft generation, summaries, lead prioritization suggestions, and report explanations.
- Add approval queue, usage limits, logging, and human review.
- Acceptance: AI cannot trigger consequential external actions without explicit user approval.

### Phase 5 — Official integrations
- Integrate one provider at a time after checking API access, business verification, app review, scopes, rate limits, and platform policies.
- Use OAuth with least privilege, encrypted token storage, revocation handling, and webhook signature verification.
- Begin with read-only data where possible. Publishing, messaging, CRM writes, and ad spend require a preview and explicit confirmation.
- Acceptance: provider sandbox/test flows, permission review, error handling, and audit trail pass.

### Phase 6 — Release and operations
- Configure production domain, HTTPS, monitoring, error reporting, backups, restore drills, and incident response.
- Run accessibility, performance, privacy, and security checks.
- Pilot with test data, then limited real users after approval.
- Acceptance: user acceptance testing and rollback plan are signed off.

## Integration readiness checklist
For each provider record: account owner, app/client registration, business verification status, approved scopes, redirect URLs, webhook endpoints, rate limits, review status, token storage, data retention, and revocation procedure. Do not collect passwords or paste access tokens into chat or source control.

## Decisions required before backend implementation
- Hosting provider and budget.
- Preferred database/backend or permission to select a low-maintenance stack.
- Number of team members and roles.
- Which integration should be first (recommended: CRM foundation, then Meta read-only insights).
- Whether this is internal-only initially or intended for multiple client workspaces.

## Current verified state from the supplied ZIP
- Vite-based frontend with Dashboard, Leads, Sales Pipeline, Content Planner, Reports, Settings, CSV export, and JSON backup/restore.
- Browser Local Storage is the current data store.
- No authentication, server database, AI API, social publishing, ad account, email, marketplace, or e-commerce API is connected.
- GitHub Pages workflow exists, but a successful deployment is not established by the ZIP itself.
