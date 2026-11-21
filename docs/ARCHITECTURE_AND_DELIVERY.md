# BK-BusiCare Centralized Business Management System

## Product objective

Evolve the published BK-BusiCare browser MVP into a secure, multi-user operations platform. The current implementation uses a Vite frontend, Supabase Auth, PostgreSQL row-level security and Supabase Edge Functions. The separate TEST project is the only backend environment used for current development. Production remains untouched.

## Implemented foundation

- Responsive browser application with dashboard, CRM Leads, sales pipeline, Content Planner, reports, CSV export and JSON backup/restore.
- Published GitHub Pages MVP: https://rezaulkarim12th.github.io/bk-busicare-ai-agent-system/
- Supabase email/password Auth portal source with registration, sign-in, password recovery and workspace selection; live email delivery and full user journey still require verification.
- Workspace-scoped Leads and Content operations protected by PostgreSQL RLS.
- Owner/admin/member/viewer role model and server-side membership checks for protected Edge Function operations.
- Team invitation and role-management path with JWT validation, exact-origin CORS allowlisting, input bounds, database-locked quotas and atomic membership/audit operations.
- AI Content Studio integrated with the authenticated portal. It submits the active workspace ID and can save generated text as a Draft. The server function checks membership/role and quota; output is draft-only.
- CI checks include dependency audit, Deno type-check, Node regression tests, JavaScript syntax, migration safety checks and production build.
- TEST project currently has eight migrations and three ACTIVE JWT-protected Edge Functions: create-workspace v7, manage-workspace-member v9, ai-content v2.
- Latest successful Build and Deploy workflow: [44862660139](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44862660139).

## Target modules

1. Executive dashboard: leads, sales, follow-ups, content queue, client delivery and campaign KPIs.
2. CRM: contacts, organizations, lead source, service interest, consent, owner, notes, next action and activity history.
3. Sales pipeline: qualification, proposal, negotiation, won/lost, revenue forecast and follow-up reminders.
4. Client operations: onboarding, scope, tasks, deliverables, deadlines, approvals and client communication log.
5. Content studio: multi-platform calendar, campaign briefs, copy variants, creative asset references, review/approval and publishing status.
6. Social and advertising integrations: Meta, Instagram, TikTok, LinkedIn, YouTube and Google, subject to official API eligibility and granted scopes.
7. Prospecting workspace: Upwork, Fiverr and other prospect sources. Use permitted APIs or user-assisted workflows; do not automate prohibited scraping or unsolicited messaging.
8. E-commerce and web operations: Shopify/WordPress connections where supported, store health, product/content tasks and reporting.
9. AI copilot: draft content, summarize leads, propose next actions and prepare reports. AI must not independently send messages, publish, edit external records or spend money.
10. Reporting: CSV/XLSX exports, sales funnel, source attribution, campaign metrics, task delivery and audit history.
11. Administration: secure sign-in, role-based access, tenant isolation, team invitations, settings, backup/restore and audit logs.

## Delivery phases and acceptance gates

### Phase 1 — Published MVP stabilization
- Reproducible production build and automated smoke/regression tests.
- Validate lead, pipeline, content, CSV export, JSON backup/restore and mobile workflows.
- Current state: Pages build and deploy workflow succeeded. Manual signed-in user acceptance across all workflows is still required.

### Phase 2 — Secure application foundation
- Configure TEST Auth Site URL, redirect URLs and SMTP.
- Test signup, login, password recovery, workspace bootstrap and invitations.
- Test two separate users and two workspaces, including direct API access and role boundaries.
- Acceptance: live security and tenant-isolation tests pass before customer data is loaded.

### Phase 3 — Core CRM and client operations
- Extend current Leads/Content modules with contacts, companies, activities, tasks, reminders, client onboarding, service delivery and ownership.
- Add import/export validation and duplicate detection.
- Acceptance: end-to-end lead-to-client workflow is tested.

### Phase 4 — AI copilot
- Configure provider credentials only as TEST server-side secrets.
- Verify authenticated draft generation, quotas, invalid JWT, origin checks, body limits and provider failures.
- Add approval workflow for any future consequential action; no automatic publishing or messaging.
- Acceptance: AI cannot trigger external actions without explicit user approval.

### Phase 5 — Official integrations and commerce
- Integrate one provider at a time after confirming API access, business verification, scopes, rate limits and platform policies.
- Use OAuth with least privilege, secure token storage, revocation handling and webhook signature verification.
- Build commerce schema, RLS, order workflow and stock controls before accepting real orders.
- Keep payment and external write actions disabled until reviewed and tested.
- Acceptance: provider sandbox/test flows, permission review, error handling and audit trail pass.

### Phase 6 — Controlled testing and production operations
- Run functional and modest concurrency tests against TEST only.
- Configure production domain, HTTPS, monitoring, error reporting, backups, restore drills and incident response after separate owner approval.
- Run accessibility, performance, privacy and security checks.
- Acceptance: user acceptance testing, rollback plan and owner release sign-off.

## Integration readiness checklist

For each provider record: account owner, app/client registration, business verification status, approved scopes, redirect URLs, webhook endpoints, rate limits, review status, token storage, data retention and revocation procedure. Do not collect passwords or paste access tokens into chat or source control.

## Current verified release snapshot — 2026-11-21

- GitHub Pages MVP is published.
- Supabase TEST project `BK-BusiCare-TEST` is ACTIVE_HEALTHY.
- Eight migrations are present in TEST.
- Edge Functions: `create-workspace` v7, `manage-workspace-member` v9 and `ai-content` v2; all ACTIVE with JWT verification.
- Security Advisor reports zero lints; Performance Advisor has three INFO unused-index notices. No indexes were removed.
- Latest workflow [44862660139](https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/44862660139) has successful build and deploy jobs.
- Live Auth/email delivery, two-user/two-workspace API isolation, successful AI provider request, controlled load test, complete CRM/client operations, commerce, external integrations and production operations are not yet verified or complete.
- Production Supabase project was not modified.

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the current release gate list and [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for the scope and limitations of the internal review.
