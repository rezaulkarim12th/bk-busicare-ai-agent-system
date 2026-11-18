# Free-first setup and deployment guide

## Current state

- Source control: existing GitHub repository and pull request.
- CI: GitHub Actions builds pull requests.
- Deployment workflow: GitHub Pages, only from `main` after Pages is configured to use GitHub Actions.
- Proposed backend: Supabase Auth + PostgreSQL.
- Alternative static hosting: Cloudflare Pages; not connected.
- No Supabase or hosting project has been provisioned by this work.

The repository is public. Never commit API keys, service-role secrets, database passwords, OAuth secrets, customer records or exported backups.

## Supabase architecture

The migration creates:
- `workspaces` and `workspace_members`;
- workspace-scoped `leads` and `content_items`;
- `audit_events`, readable by workspace owners/admins;
- RLS policies for workspace membership and role-based record access.

Roles:
- owner: workspace owner;
- admin: workspace administration;
- member: create/update operational records;
- viewer: read-only access.

Authorization helper functions are placed in the `private` schema, with a locked function search path. Keep `private` out of the Supabase API-exposed schemas. Membership writes and audit-event writes have no browser policy; they must be performed by trusted server/Edge Functions.

Lead/content records cannot change their workspace ID, creator ID or creation timestamp after insert. Their `updated_at` timestamp is refreshed on updates.

## Authentication portal behavior

Set both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as public frontend build variables. If neither is set, the local demo is shown. If both are set, the secure authentication portal is shown and the local demo is suppressed. If only one is set, the app fails closed and displays a configuration warning.

The portal supports email/password sign-in, registration, password recovery, workspace creation and read-only membership listing. It does not yet synchronize Leads or Content to PostgreSQL.

## Safe test sequence

1. Create a disposable Supabase project. Do not use a live customer database.
2. Review and apply `supabase/migrations/0001_multitenant_foundation.sql`.
3. Enable email authentication and configure site URL plus allowed redirect URLs.
4. Keep the database password and service-role key in the provider's secret manager. They must never be exposed to Vite/browser code.
5. Configure only the project URL and publishable/anon key in local `.env.local` or hosting build variables.
6. Register two test users and create separate workspaces.
7. Verify direct REST requests cannot read or mutate another workspace's records. Verify viewers cannot write, members cannot delete, and non-admins cannot read audit events.
8. Verify password recovery, logout, expired sessions and missing/partial environment configuration.
9. Do not onboard real customer data until cloud CRUD, invitation authorization and cross-tenant integration tests are complete.

## Release gates

- All CI tests and production build pass.
- Real Supabase tests using at least two users and two workspaces pass.
- Security review confirms private helper schema is not API-exposed.
- Team invitation and role-change operations use trusted server-side authorization.
- Backups, retention, logging, rate limits and monitoring are defined.
- Explicit owner approval is received before merge or deployment.

## External actions

Social publishing, customer messaging, external CRM changes and advertising spend must require explicit human approval and verified API scopes. No such platform integrations are connected in the current release.
