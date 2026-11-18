# Free-first setup and deployment guide

## Current state
- Source control: GitHub repository and draft pull request #1.
- CI: GitHub Actions builds pull requests; the latest recorded run passed the automated checks and production build.
- Hosting workflow: GitHub Pages deployment is restricted to `main), after Pages is configured for GitHub Actions.
- Backend: Supabase Auth + PostgreSQL foundation is implemented in code but not yet deployed to a live project.
- No live Supabase or production hosting project has been verified by this work.

The repository is public. Never commit API keys, service-role secrets, database passwords, OAuth secrets, customer records or exported backups.

## Supabase architecture
The migration creates:
- `workspaces` and `workspace_members`;
- workspace-scoped `leads` and `content_items`;
- `audit_events`, readable by workspace owners/admins;
- RLS policies for membership and role-based record access.

Roles:
- owner: workspace owner;
- admin: workspace administration;
- member: create/update operational records;
- viewer: read-only access.

Authorization helper functions are in the `private` schema, with a locked function search path. Keep `private` out of the Supabase API-exposed schemas. Membership writes and audit-event writes have no browser policy; they must be performed by trusted server/Edge Functions.

Lead/content records cannot change their workspace ID, creator ID or creation timestamp after insert. Their `updated_at` timestamp is refreshed on updates.

## Authentication portal
Set both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as public frontend build variables. If neither is set, the local demo is shown. If both are set, the authentication portal is shown and the local demo is suppressed. If only one is set, the app fails closed and displays a configuration warning.

The portal supports email/password sign-in, registration, password recovery, workspace creation, workspace selection, workspace-scoped Leads and Content CRUD, and Team invitation/role controls. PostgreSQL RLS remains authoritative. Team actions call the `manage-workspace-member` Edge Function and work only after it is deployed. Inviting an email already registered with Supabase is not supported by this initial endpoint.

## Disposable TEST deployment workflow
The repository includes `.github/workflows/supabase-test-deploy.yml`. It is manually triggered, requires the `confirm_deploy` checkbox, uses the GitHub Actions environment `supabase-test`, previews pending migrations, applies them to the configured project and deploys the `manage-workspace-member` function.

Before using it:
1. Create a separate disposable Supabase TEST project. Do not use production or a project containing customer data.
2. In GitHub Settings → Environments, create `supabase-test`. Configure required reviewers/protection rules where available.
3. Add environment secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` and `SUPABASE_PROJECT_REF`. Confirm the project ref belongs to the disposable TEST project.
4. Run `preview` first and inspect the migration plan in the Actions log. If it is correct, run `apply` separately and enable the confirmation checkbox. The apply run repeats the dry-run before applying.
5. Configure Supabase Auth email provider/SMTP, site URL and allowed redirect URLs after deployment.
6. Register two test users, create separate workspaces and verify direct API requests cannot read or mutate another workspace's records. Verify viewers cannot write, members cannot delete and non-admins cannot read audit events.
7. Verify password recovery, logout, expired sessions, invitation authorization and email delivery.
8. Do not onboard real customer data until the live migration, invitation authorization, two-user/two-workspace RLS tests and security review are complete.

The workflow has not been executed. Its required GitHub environment and secrets must be configured by the repository owner. Never send secrets in chat.

## GitHub Pages production build configuration
Before enabling a `main` deployment, add these repository Actions secrets under Settings → Secrets and variables → Actions:
- `VITE_SUPABASE_URL` — Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` — browser-safe publishable/anon key; database RLS must be enabled.

The workflow fails closed on a `main` deployment if either value is missing. Never add a service-role/secret key as a `VITE_` variable. Keep pull-request builds separate from production deployment.

## Release gates
- Automated CI tests and production build pass.
- Real Supabase tests using at least two users and two workspaces pass.
- Security review confirms the private helper schema is not API-exposed.
- Team invitation and role-change operations use trusted server-side authorization.
- Backups, retention, logging, rate limits and monitoring are defined.
- Explicit owner approval is received before merge or production deployment.

## External actions
Social publishing, customer messaging, external CRM changes and advertising spend must require explicit human approval and verified API scopes. No such platform integrations are connected in the current release.
