# BK-BusiCare AI Agent System

Responsive web-app MVP for BK-BusiCare, designed to evolve into a multi-tenant SaaS product.

## Run locally
1. Install Node.js 20 or later.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL printed by Vite.

## Included in MVP
- Dashboard with lead and pipeline summaries.
- Lead creation and service categorization.
- Sales pipeline with New, Contacted, Proposal, Won and Lost stages.
- Content planner for Facebook, Instagram, TikTok, LinkedIn and YouTube.
- Basic lead report and CSV export.
- Workspace name settings.
- Responsive desktop and mobile layout.

## Current limitations
- Data is stored in this browser's Local Storage. It is not cloud-synced.
- No authentication, team roles, server database or tenant isolation is implemented yet.
- Zoho CRM, social publishing, ad accounts, messaging, payment and AI provider APIs are not connected.
- Content planner records plans only; it does not publish content.
- This is an MVP prototype, not production-ready SaaS.

## SaaS architecture roadmap
1. Replace browser storage with a secure server API and relational database.
2. Implement tenant-scoped data access, authentication, role-based permissions and audit logs.
3. Add subscription plans, billing, usage limits and tenant onboarding.
4. Add integrations only with verified API scopes and explicit approval for external actions.

## Security
Never commit credentials, API keys, tokens or private customer records. Use environment variables and a managed secrets store for future integrations. Require human approval before publishing, messaging customers, modifying external CRM records or spending advertising budget.
