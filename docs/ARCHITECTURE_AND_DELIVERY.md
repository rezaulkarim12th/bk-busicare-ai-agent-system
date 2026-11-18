# BK-BusiCare Centralized Business Management System

## Product objective
Evolve the existing browser-based MVP into a secure, multi-user operations platform for BK-BusiCare. The feature branch now includes a Supabase Auth portal, tenant-scoped cloud Leads/Content CRUD, PostgreSQL RLS and a team-management Edge Function source. These components have not yet been validated against a live Supabase project.

## Implemented foundation
- Responsive Vite application with local demo dashboard, CRM leads, sales pipeline, content planner, reports, CSV export and JSON backup/restore.
- Supabase email/password authentication portal, password recovery and workspace selection.
- Workspace-scoped Leads and Content CRUD with PostgreSQL RLS.
- Owner/admin/member/viewer roles; trusted Edge Function path for invitations and role changes.
- Migration safety tests, Deno type-check, JavaScript syntax checks and production build in GitHub Actions.
- Manually gated Supabase TEST deployment workflow.

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
- Reproducible production build and automated smoke tests.
- Validate lead creation/edit/delete, pipeline stage updates, content planning, CSV export, JSON backup/restore and mobile layout.
- Acceptance: prototype workflows pass tests; limitations remain clearly labelled.

### Phase 2 — Secure application foundation
- Apply the reviewed migration to a disposable Supabase TEST project.
- Configure Auth email delivery and redirect URLs.
- Test two separate users and two workspaces, including direct API access and role boundaries.
- Acceptance: live security and tenant-isolation tests pass before customer data is loaded.

### Phase 3 — Core CRM and client operations
- Extend current Leads/Content modules with contacts, companies, activities, tasks, reminders, client onboarding, service delivery and ownership.
- Add import/export validation and duplicate detection.
- Acceptance: end-to-end lead-to-client workflow is tested.

### Phase 4 — AI copilot
- Add provider-backed AI behind a server-side adapter; never expose provider keys in browser code.
- Support draft generation, summaries, lead prioritization suggestions and report explanations.
- Add approval queue, usage limits, logging and human review.
- Acceptance: AI cannot trigger consequential external actions without explicit user approval.

### Phase 5 — Official integrations
- Integrate one provider at a time after checking API access, business verification, scopes, rate limits and platform policies.
- Use OAuth with least privilege, encrypted token storage, revocation handling and webhook signature verification.
- Begin with read-only data where possible. Publishing, messaging, CRM writes and ad spend require preview and explicit confirmation.
- Acceptance: provider sandbox/test flows, permission review, error handling and audit trail pass.

### Phase 6 — Release and operations
- Configure production domain, HTTPS, monitoring, error reporting, backups, restore drills and incident response.
- Run accessibility, performance, privacy and security checks.
- Pilot with test data, then limited real users after approval.
- Acceptance: user acceptance testing and rollback plan are signed off.

## Integration readiness checklist
For each provider record: account owner, app/client registration, business verification status, approved scopes, redirect URLs, webhook endpoints, rate limits, review status, token storage, data retention and revocation procedure. Do not collect passwords or paste access tokens into chat or source control.

## Release blockers
The live Supabase project, migration application, Auth SMTP setup, two-user RLS tests, production hosting secrets, external provider integrations and production operations controls remain outstanding. The feature branch is not production-ready.
