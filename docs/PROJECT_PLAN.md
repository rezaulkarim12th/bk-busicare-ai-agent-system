# Project Plan

## 1. Purpose

Build a maintainable AI-assisted operations system for BK-BusiCare, a digital marketing, branding, web development, and AI automation business serving Bangladesh and international clients.

## 2. Initial modules

1. **Lead management** — capture source, service interest, status, owner, and next follow-up date.
2. **Sales pipeline** — track qualification, proposal, negotiation, won/lost status, and expected value.
3. **Content planner** — organize platform, campaign, format, draft, scheduled date, and approval status.
4. **Client services** — track onboarding, deliverables, deadlines, and progress.
5. **Reporting** — summarize leads, follow-ups, meetings, deals, and campaign performance.
6. **AI assistant** — draft suggestions and summaries; never take consequential external action without approval.

## 3. Proposed delivery phases

- **Phase 0 — Foundation:** repository documentation, security rules, and requirements.
- **Phase 1 — Prototype:** define data models and build a local, non-production demonstration.
- **Phase 2 — Core workflow:** implement lead and sales tracking with authentication and audit history.
- **Phase 3 — Content workflow:** add multi-platform content planning and approval queues.
- **Phase 4 — Integrations:** evaluate official APIs and connect only services with valid permissions.
- **Phase 5 — Deployment:** security review, backups, monitoring, user acceptance testing, and controlled release.

## 4. Requirements to confirm

- Preferred stack and hosting.
- User roles and access permissions.
- CRM source of truth and required fields.
- Which social platforms and official API permissions are available.
- Data retention and privacy requirements.
- Approval rules for messages, publishing, and ad spend.

## 5. Security and operating constraints

- Do not store credentials or customer personal data in Git.
- Use environment variables or a secrets manager.
- Use least-privilege OAuth scopes and rotate credentials when needed.
- Keep development and production environments separate.
- Require human approval before sending messages, publishing content, changing client records, or spending money.
- Record audit events while excluding secrets.
- Follow platform terms, applicable privacy law, and consent requirements.

## 6. Definition of done

Each phase must include documented requirements, tested behavior, a security review, and an explicit acceptance decision before production use.
