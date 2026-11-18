# Implementation status

Last reviewed: 2026-11-18

## User decisions
- Hosting strategy: free-first.
- Product scope: multiple client workspaces and team roles.
- Initial budget: ৳0.
- Security rule: keep changes on a feature branch; do not merge or deploy without explicit approval.

## Work completed in this development branch
- Supabase/PostgreSQL tenant schema with workspace roles and row-level security.
- Atomic workspace creation RPC; browser-side membership writes intentionally blocked.
- Supabase Auth portal with email/password sign-in, registration, password-reset email and sign-out.
- Authenticated workspace onboarding, workspace switching and read-only membership list.
- When Supabase is configured, the portal blocks the local demo app to prevent accidental exposure of browser-local records between signed-in users.
- When Supabase is not configured, the existing local demo remains available.
- Frontend uses only public Supabase URL and anon key; no service-role key or database password is used in browser code.
- Team invitations and role changes remain disabled until a trusted server/Edge Function exists.

## Validation and limitations
- Earlier CI run passed 5/5 migration static checks, JavaScript syntax validation and Vite production build for code commit 162b40ed962d1e07f9dbbddbd6abb8013eec95c6.
- The new authentication portal still requires a fresh CI run.
- Auth, workspace creation and membership queries have not been exercised against a live Supabase project.
- Lead and content cloud CRUD is not implemented; the authenticated portal explicitly blocks the local demo until cloud synchronization is ready.
- RLS integration tests with two users and two workspaces remain required.
- No Supabase or Cloudflare project has been provisioned; no production deployment or social/ads API connection has occurred.

## Next steps
1. Run CI and resolve any build or test failures.
2. Validate auth and workspace flows against a disposable Supabase project.
3. Add workspace-scoped cloud CRUD for leads and content.
4. Implement secure server-side team invitations and role changes.
5. Add two-user cross-tenant RLS integration tests.
6. Connect hosting only after validation and user review.
