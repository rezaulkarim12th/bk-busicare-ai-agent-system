# Internal Security Audit — BK-BusiCare AI Agent System

Last reviewed: 2026-11-27
Review type: source-level review and available GitHub Actions evidence
Environment changes: none
Supabase Restore/deploy: not performed
Production changes: none

## Executive decision

**Production release: HOLD.** The repository contains useful security controls, but this review does not establish that the live TEST API, authentication flows, tenant isolation, or production configuration are secure. This is not an independent penetration test or a security certification.

## Scope reviewed on 2026-11-27

- `README.md`, `package.json`, `.gitignore` and `supabase/config.toml`.
- `supabase/functions/ai-content/index.ts`.
- `supabase/functions/create-workspace/index.ts`.
- `supabase/functions/manage-workspace-member/index.ts` (source reviewed).
- `supabase/tests/rls_isolation.test.sql`.
- `.github/workflows/supabase-local-ci.yml`.
- `docs/IMPLEMENTATION_STATUS.md` and prior audit evidence.
- GitHub Actions job summaries for runs 44886113136, 44810200210 and 44886059909.

This review was read-only. No Supabase project was restored, no migration was applied remotely, and no production deployment was made.

## Controls observed in source

1. The three Edge Functions have `verify_jwt = true` in `supabase/config.toml`.
2. The AI Content function validates the caller token with Supabase Auth and checks workspace membership server-side.
3. The AI Content role allowlist includes owner, admin, member and editor; viewer and non-member roles are denied by that path.
4. AI Content request bodies are read with a 12,000-byte limit; the handler validates JSON object shape, workspace UUID, topic length and supported platform.
5. Workspace creation and member-management functions use server-side secrets and validate caller identity; do not expose service-role/secret keys in browser code.
6. The Edge Functions use explicit CORS origin allowlists. The configured origins and Capacitor `https://localhost` allowance should be reviewed whenever app origins change.
7. AI usage quota reservation is performed through a database RPC. AI output is draft-only and the function does not publish or send messages.
8. `.gitignore` excludes common local environment files and private key files.
9. The local RLS pgTAP suite defines 32 assertions covering workspace separation, viewer restrictions, member boundaries, immutable ownership fields and audit-event access.
10. The local Supabase CI workflow is designed to run migrations and pgTAP against a disposable local Supabase stack, without connecting to the owner's Supabase project.

## GitHub Actions evidence

The inspected completed runs 44886113136, 44810200210 and 44886059909 each reported successful build and deploy jobs. Their build job summaries show successful locked dependency installation, dependency vulnerability audit, Deno type-check, migration safety checks, JavaScript syntax validation, production bundle build and artifact upload; deploy jobs also completed successfully.

Important limitation: these are historical workflow runs referenced by the repository's status documentation. The latest repository commit observed during this review was `c9c30640c98c8d8aebcc81fb8fba8acd7551c239` (2026-11-27 10:13 UTC); its combined commit status query returned no status entries. Therefore the historical green runs must not be represented as proof that the latest commit has passed CI.

The local Supabase/pgTAP workflow is present in the repository, but this review did not obtain a completed run result for that workflow. The current 32-assertion test file is test coverage, not proof that those assertions passed in this review.

## Findings and remaining risks

### High-priority release blockers

- **Live tenant isolation is unverified.** No current two-user/two-workspace direct API test was available in this review. Run owner/admin/member/editor/viewer and non-member cases against an isolated TEST environment before using real customer data.
- **Live Auth flows are unverified.** Signup, login, logout, password recovery, redirect allowlists and invitation email delivery need end-to-end testing.
- **AI provider operation is unverified.** A successful authenticated AI generation and safe handling of provider errors, quota exhaustion and invalid requests have not been demonstrated in this review.
- **Production configuration is not certified.** No production changes or production API tests were performed.

### Configuration and operational findings

- The latest implementation-status document (last verified 2026-11-21) reports one Supabase Security Advisor warning: leaked-password protection disabled, and three INFO-level unused-index notices. An older audit document recorded zero advisor lints. This audit adopts the newer implementation-status report as the more recent recorded observation; the live advisor was not queried on 2026-11-27. The leaked-password control is provider-plan dependent according to that report and is not fixed by client code or SQL migration.
- The AI Content handler reserves quota before calling the external AI provider. The reviewed path does not visibly compensate/refund that reservation on provider failure or timeout. Confirm the intended quota policy and add a safe, atomic refund/reconciliation mechanism if failed provider calls should not consume quota.
- The AI Content function has a fixed origin list plus the server-side `APP_ALLOWED_ORIGINS` value. Confirm the deployed secret contains only the exact intended origins. The secret value itself was not read.
- The repository's public visibility means credentials, personal data, customer exports and backups must never be committed.
- A successful build/dependency audit does not prove application-level authorization, secure business logic, or absence of vulnerabilities.

## Work completed in this review

- Re-read the current Edge Function and RLS test sources.
- Confirmed the current test file plans 32 pgTAP assertions; did not claim they passed.
- Inspected three available GitHub Actions run job summaries and recorded their historical successful steps.
- Compared the two conflicting historical Security Advisor statements and documented the chronology and uncertainty.
- Confirmed the latest commit has no combined status entries in the available status query.
- Made no code, database, secret, billing, restore or production changes.

## Required next tests (free/safe order)

1. Run the repository's local Supabase CI workflow on a disposable GitHub-hosted runner and capture the complete migration + pgTAP result.
2. Run deterministic unit/regression tests for AI endpoint invalid JWT, viewer/non-member denial, editor acceptance, malformed JSON, oversized body, unsupported platform, disallowed origin, quota denial and provider timeout.
3. Use dedicated synthetic accounts and synthetic data in an already-active isolated TEST environment to test cross-tenant API isolation; do not restore or modify a sleeping project.
4. Verify TEST Auth redirect/email settings and AI provider configuration without exposing secret values.
5. Reconcile quota reservation behavior on provider failures.
6. Recheck the live Security Advisor only if the existing TEST project is already accessible and active at no additional cost.
7. Keep payment, live publishing, customer messaging, ad spend and production deployment disabled until the relevant acceptance tests pass and the owner approves.

## Release rules

- No Supabase restore or paid upgrade under the current Free & Safe instruction.
- No production changes, payment activation, live social publishing, customer messaging or ad spend.
- Do not load real customer data until live tenant-isolation and authentication tests pass.
- Never request or place API keys, passwords, database credentials or service-role keys in chat or source control.
- Production release requires a separate review, rollback plan and explicit owner approval.
