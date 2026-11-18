# Implementation status

Last reviewed: 2026-11-18

## User decisions
- Hosting strategy: recommend a free-first setup.
- Product scope: multi-tenant, multiple client workspaces and team roles.
- Initial budget: ৳0.

## Work completed in this development branch
- Added a Supabase/PostgreSQL multi-tenant foundation migration.
- Added workspace membership roles: owner, admin, member, viewer.
- Added workspace-scoped RLS policies for leads, content items, and audit events.
- Added an atomic create-workspace RPC that assigns the creator as owner.
- Intentionally withheld browser-side membership writes; invitations and role changes need a trusted server/Edge Function.
- Added a free-tier deployment guide and frontend-only environment variable example.
- Added Node's built-in test suite with static checks for tenant tables, RLS enablement, workspace-owner creation, role-scoped policies, and blocked browser-side membership mutations.
- Updated GitHub Actions so pull requests run migration checks, JavaScript syntax validation, and a Vite production build; deployment remains restricted to `main`.
- Preserved the existing MVP and main branch; changes are isolated in `feature/multitenant-foundation`.

## Validation performed
- `node --check src/main.js`: PASS.
- `node --check vite.config.js`: PASS.
- Secret-pattern scan of the supplied source: no matching committed credentials found.
- Production Vite build: NOT RUN. Dependency installation did not complete in the available environment.
- PostgreSQL migration execution: NOT RUN. No PostgreSQL/Supabase database is connected.
- Automated migration checks: added to CI; execution result pending the GitHub Actions run.
- Cross-tenant RLS integration tests: NOT RUN. A live Supabase project and test users are required.

## Not yet implemented
- Frontend Supabase client and authentication screens.
- Workspace creation/switching UI.
- Server-side invitation and role-management workflow.
- Migration execution and automated database tests.
- Cloudflare Pages project connection and production deployment.
- AI provider and external platform integrations.

## Next implementation order
1. Add Supabase client configuration and authentication UI without breaking demo mode.
2. Add authenticated workspace onboarding and workspace switcher.
3. Replace local-only leads/content persistence with workspace-scoped database access.
4. Add invitation workflow through a trusted server function.
5. Add RLS integration tests for two users across two workspaces.
6. Connect Cloudflare Pages only after build and security checks pass.
