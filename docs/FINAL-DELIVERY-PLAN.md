# BK-BusiCare AI Agent System — Delivery Plan

**Status:** Engineering handoff; not a production release  
**Branch:** `feature/content-planner-module-foundation`  
**Related PR:** #9 — Add Content Planner module foundation

## Delivery team — 10 coordinated roles

| Role | Responsibility | Primary workstreams |
|---|---|---|
| AI Project Director | Scope, priorities, acceptance criteria and release coordination | All |
| Backend Developer | Application logic, API contracts and data services | 1, 3, 4, 5 |
| UI/UX & Frontend Developer | Navigation, responsive screens and accessible workflows | 1, 2, 4, 5 |
| Cybersecurity Engineer | Threat review, secure defaults and release security checklist | 7, 8 |
| AI & Automation Engineer | AI provider abstraction, agent workflows and safe automation | 3, 6 |
| QA Automation Engineer | Regression tests, integration tests and acceptance evidence | 1–8 |
| Supabase/RLS Security Specialist | Auth, tenant isolation, policies and Edge Function validation | 7 |
| Shopify & E-commerce Integration Specialist | Storefront, catalogue/order contracts and checkout readiness | 4 |
| Microsoft Office Integration Specialist | Word, Excel and PowerPoint workflow/API feasibility | 5 |
| DevOps & Release Engineer | CI, environment separation, monitoring, backups and release gates | 8 |

These are coordinated project roles, not a claim that ten independent human collaborators have been added to GitHub.

## Eight delivery workstreams

| # | Workstream | Current evidence | Acceptance gate |
|---|---|---|---|
| 1 | Six-section application shell and navigation | Existing MVP navigation has Dashboard, Leads, Sales Pipeline, Content Planner, Reports and Settings | Responsive navigation, route/state regression tests and accessibility review |
| 2 | Content Planner modules | Five-module planning registry and five unit tests are added in PR #9; UI is not yet wired to the registry | Five usable submodule screens; Meta and Google campaign forms; validation and tests |
| 3 | AI Agent and provider integration | Current Copilot builds prompts only; no live provider connection | Server-side provider adapter, secret management, usage limits, error handling and human approval |
| 4 | Shopify / E-commerce | Architecture is documented; no live store, checkout or order sync | Adult account-owner approval, verified store, sandbox order flow, webhook verification and security review |
| 5 | Microsoft Office AI Suite | Product scope is planned; no Microsoft integration | Confirm API/licensing, consent and permissions; implement and test Word/Excel/PowerPoint workflows |
| 6 | Scheduling and automation | Planning concepts only; no publishing jobs or background scheduler | Time-zone-safe queue, retries, idempotency, audit trail, cancellation and opt-in controls |
| 7 | Supabase security and live QA | TEST foundation exists; production auth/API and two-tenant isolation remain unverified | Two-account/two-workspace live tests, RLS negative tests, invitation/role tests, secret and redirect review |
| 8 | Final QA, deployment and documentation | PR #9 is a draft proposal; no production release evidence | CI green on release commit, security sign-off, backup/restore drill, monitoring, rollback plan and authorized release approval |

## Current verified delivery

- The Content Planner registry defines five planning-only modules: Social Media Content, Meta Ads Management, Google Ads Management, Publishing & Scheduling and Campaign Reports.
- Meta Ads planning includes Facebook and Instagram.
- Google Ads planning includes Search, Display and YouTube.
- Five unit tests cover module order, Meta scope, Google scope, unknown module handling and the planning-only execution guard.
- These modules do **not** publish content, create or launch ad campaigns, spend budget, connect provider accounts or run scheduled jobs.
- The registry is not yet integrated into the Content Planner user interface.
- The existing application remains an MVP. Local browser storage is not cross-device synchronization.

## Release controls

1. Keep feature work on a feature branch and review through pull requests.
2. Do not merge or deploy while required tests are missing or failing.
3. Do not enable live ad spend, public publishing, checkout, external messaging or automated customer actions without explicit account-owner authorization and provider-side permissions.
4. Keep TEST and production credentials separate; never commit secrets.
5. Verify tenant isolation with two authenticated test accounts. A rolled-back SQL probe is not a substitute for live API tests.
6. Require a backup/restore drill, monitoring, rollback plan and final security review before production release.

## Delivery statement

This document and the Content Planner registry/tests are engineering deliverables for review. They are **not** evidence that all eight workstreams are complete. Production delivery remains blocked on UI integration, provider implementations, external account approvals, live security testing and release gates.
