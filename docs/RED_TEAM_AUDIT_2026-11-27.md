# Red Team Security Audit — 2026-11-27

## Executive decision

**Release status: HOLD.** This is a repository/source-level review and evidence reconciliation, not an independent penetration test or a certification that the live service is secure.

**Cost and environment constraints:** No Supabase restore, no paid service, no production configuration change, no secret retrieval, and no live customer data were used for this review.

## Evidence checked

- Repository default branch at review time: `main`; latest observed commit: `c9c30640c98c8d8aebcc81fb8fba8acd7551c239` (27 Nov 2026).
- GitHub Actions run `44886113136`: build and deploy jobs completed successfully. The build job included dependency audit, Deno type-check, migration safety checks, JavaScript syntax validation, production bundle build, and artifact upload.
- `supabase/config.toml`: gateway JWT verification is enabled for `manage-workspace-member`, `create-workspace`, and `ai-content`.
- `supabase/functions/ai-content/index.ts`: source includes caller-token validation, exact-origin allowlisting, streamed 12 KB request-body cap, workspace UUID validation, server-side workspace membership/role check, usage-quota reservation, provider timeout, and draft-only response.
- `supabase/tests/rls_isolation.test.sql`: local pgTAP suite declares 32 assertions covering tenant separation, viewer restrictions, member permissions, immutable ownership fields, and audit-event access. This file review does not establish that the suite was run in the latest workflow.
- `docs/IMPLEMENTATION_STATUS.md` and `docs/SECURITY_AUDIT.md` contain different Security Advisor observations and different verification dates.

## Controls present in source

1. Edge Function gateway JWT verification is configured for all three named functions.
2. The AI endpoint validates the user token with Supabase Auth and checks membership and allowed roles server-side.
3. AI endpoint request bodies are bounded while streaming, rather than relying only on Content-Length.
4. CORS uses exact origin matching; this is a browser-origin control, not a substitute for authentication or authorization.
5. AI output is returned as draft text and does not publish, send messages, or spend ad budget.
6. Service-role credentials are read server-side; repository documentation prohibits placing them in browser variables or source control.
7. The local RLS test file covers cross-tenant reads and role-specific write restrictions.

## Findings and remediation priorities

### F-01 — Security Advisor evidence is inconsistent
**Priority: High (release evidence gap).** The implementation status document reports one WARN for leaked-password protection being disabled, while the older security audit document reports zero lints. These are dated observations, not necessarily simultaneous results. The current provider setting was not queried during this review.

**Action:** Obtain a fresh Security Advisor result from the existing TEST project when available, record its timestamp, and reconcile both documents. Do not claim the warning is fixed by SQL or client-side code. Do not upgrade the plan under the free-only constraint.

### F-02 — Live authentication and tenant-isolation tests remain unverified
**Priority: Critical (release gate).** Source and local pgTAP tests cannot prove deployed Auth settings, real JWT behavior, or live two-user/two-workspace API isolation.

**Action:** When the existing TEST service is accessible without restore or paid activation, use disposable test accounts and non-sensitive test data to verify signup, login, recovery, viewer denial, non-member denial, and cross-workspace isolation. If TEST is inactive, leave these tests blocked; do not restore it.

### F-03 — AI provider success path is not demonstrated
**Priority: High.** The source requires server-side `OPENAI_API_KEY` and `OPENAI_MODEL`. No secret values were read. A successful authenticated generation has not been demonstrated by the reviewed evidence.

**Action:** Verify only the presence/configuration status through an authorized dashboard view; never expose values in logs, chat, frontend code, or commits. If configuration is absent, keep AI generation marked unavailable rather than simulating success.

### F-04 — Quota behavior on provider failures needs a test
**Priority: Medium.** The AI endpoint reserves quota before calling the provider. This is fail-closed for quota enforcement, but provider failures after reservation may still consume quota.

**Action:** Add a deterministic test for timeout, provider 4xx/5xx, malformed provider response, and quota exhaustion. Decide whether failed provider attempts should be refunded through a safe atomic database operation. Do not weaken quota enforcement.

### F-05 — Dependency audit result is CI-scoped
**Priority: Medium.** The reviewed Actions run reports the dependency-audit step succeeded. This is evidence for that lockfile and that run only; it is not continuous monitoring or a full software supply-chain assessment.

**Action:** Keep lockfile-based installs, pin CI actions to reviewed commit SHAs, and repeat dependency auditing on each dependency update.

### F-06 — Backup/restore, monitoring, and operational recovery are not certified
**Priority: High (production gate).** Documentation states that production backup/restore drills, monitoring, retention, and incident-response exercises remain incomplete.

**Action:** Document a restore runbook and test only against a disposable local environment or already-active TEST project with explicit safeguards. No restore was performed in this review.

## Release gates

- [ ] Fresh, timestamped TEST Security Advisor result reconciled with documentation.
- [ ] Live signup/login/password-recovery and email-delivery tests.
- [ ] Two-user/two-workspace direct API isolation tests.
- [ ] Invalid/expired JWT, unauthorized origin, malformed/oversized request tests.
- [ ] AI provider success and failure-path tests, including quota behavior.
- [ ] Backup/restore and incident-response drills in a disposable environment.
- [ ] Separate owner approval and rollback plan before any production deployment.

## Verified versus not verified

**Verified from source/CI evidence:** configured JWT gateway checks, AI endpoint source-level authorization controls, request-size handling, draft-only behavior, the presence of local RLS test coverage, and successful completion of both jobs in Actions run `44886113136`.

**Not verified:** current live TEST status, current Security Advisor state, deployed function versions, live auth/email delivery, real multi-tenant isolation, successful AI provider call, actual latest pgTAP execution, production security, mobile/Windows runtime, and backup restoration.

## Owner constraints honored

- Supabase TEST was not restored or activated.
- No paid service or plan upgrade was initiated.
- No production settings, migrations, or data were changed.
- No secrets were requested, read, or committed.
- No deployment or release approval was granted.

**Final Red Team decision: retain the Production Release HOLD until every applicable release gate has fresh evidence.**
