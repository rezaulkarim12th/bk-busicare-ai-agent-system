# Free-first hosting and multi-tenant deployment

## Approved starting direction
- Frontend: Cloudflare Pages (free tier, static Vite build).
- Authentication and PostgreSQL: Supabase (free tier for development/pilot).
- Source control and CI: existing GitHub repository and Actions workflow.
- Domain: use the provided Pages subdomain initially; a custom domain is optional and may incur cost.

Free-tier quotas, sleeping/pausing rules, and commercial terms can change. Verify the current provider dashboard and terms before relying on the free tier for a live business. No service is provisioned by this document.

## Multi-tenant data model
Every business record carries a `workspace_id`. A user belongs to one or more workspaces through `workspace_members` and has one of four roles:
- owner: full workspace control;
- admin: manage workspace operations and members (member invitation endpoint is a later task);
- member: create and update operational records;
- viewer: read-only access.

The initial SQL migration creates workspaces, memberships, leads, content items, and audit events. PostgreSQL Row Level Security (RLS) policies scope reads and writes to the authenticated user's workspace membership. Membership writes are intentionally not exposed to browser clients; implement invitations and role changes through a trusted server/Edge Function after validating the inviter's role.

## Deployment sequence
1. Create a Supabase project and keep the database password in the provider's secret manager.
2. Review and apply `supabase/migrations/0001_multitenant_foundation.sql` in a disposable development project first.
3. Enable email authentication and configure allowed redirect URLs for the Cloudflare Pages domain.
4. Create a Cloudflare Pages project connected to this GitHub repository; build command `npm run build`, output directory `dist`.
5. Add only the Supabase project URL and publishable/anon key as frontend build variables. These are public identifiers; never place service-role keys, database passwords, or provider secrets in browser variables.
6. Add server-side authorization, invitation workflows, audit writes, backup/restore, and integration token encryption before onboarding real client workspaces.
7. Test cross-tenant isolation with at least two users and two workspaces. Confirm a user cannot read, modify, or infer another workspace's records through direct API requests.

## Current state and limits
- The current Vite application remains a localStorage-only MVP. It does not yet use this SQL schema.
- No Supabase or Cloudflare project has been created or connected.
- Authentication, invitations, tenant switching, server-side API, audit event generation, and production monitoring are not implemented.
- The migration is a foundation, not a complete production SaaS security certification.
- Do not upload real customer records until the application uses the backend and tenant-isolation tests pass.

## Approval gates
Before live integrations, require explicit review for OAuth scopes, data retention, and platform policy. Keep social publishing, customer messaging, external CRM writes, and ad spend behind a human approval step.
