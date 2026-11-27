# Red Team Initial Execution Log

Assessment status: **PARTIAL / BLOCKED — repository and disposable local security checks pass; live TEST validation remains blocked by Supabase free-project limit**
Date: 2026-11-27
Assessment branch: `security/red-team-readiness`
Assessment PR: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/pull/23

## Latest no-cost verification

Latest observed PR CI merge commit: `cef9e720aab422d8c94f7b19859adc3254114dea` (includes Red Team commit `96da20b704afa1897d6bc727b5121bad1e0cddef`).

| Check | Result | Evidence / limitation |
|---|---|---|
| Node application test suite | PASS | Local Supabase workflow run 46024806046; `npm test`: 64 passed, 0 failed, 0 skipped |
| SQL / pgTAP suite | PASS | Run 46024806046; 4 files, 44 tests, all successful |
| Dependency audit | PASS | Build workflow run 46024806000; 0 npm vulnerabilities |
| Supabase Edge Function type-check | PASS | Build workflow run 46024806000 |
| Migration safety checks | PASS | Build workflow run 46024806000 |
| JavaScript syntax checks | PASS | Build workflow run 46024806000 |
| Production web bundle build | PASS | Build workflow run 46024806000 |
| GitHub Pages artifact upload / deployment | NOT DEPLOYED | Upload step skipped and deploy job skipped in run 46024806000; this was a successful build workflow, not a live deployment |
| Full disposable local Supabase migration | PASS | Run 46024806046; all migrations applied to disposable local database |
| Local Supabase service verification and cleanup | PASS | Run 46024806046; services verified, stack stopped cleanly |
| Windows packaging pipeline | NOT REVERIFIED | Historical run 45924324002 failed at `npm test` (63/64); the current Linux CI suite passes 64/64, but no fresh Windows runner/build evidence is available |
| Dedicated Supabase TEST project availability | BLOCKED | Project `rmnoiwzkhjwmgxwkfdzb` is `INACTIVE`. An explicitly authorized restore attempt was rejected by Supabase: the organization has reached its maximum of two active free projects. |
| Active Supabase projects | OBSERVED | `BK-BusiCare` (`ekznyijmghrjtovbbgun`) and `BK-BusiCare-One` (`pdcpntalufiiilmpevnn`) are `ACTIVE_HEALTHY`; TEST project remains inactive. Neither active project was paused because that could interrupt production/app services. |
| TEST Edge Function inventory | OBSERVED | Supabase control plane lists six functions as ACTIVE: manage-workspace-member v14, busicare-create-order v2, create-workspace v12, sslcommerz-create-session v2, sslcommerz-ipn v4, ai-content v11. Function listing does not prove the project database or endpoint runtime is healthy. |
| Live two-account browser Auth / REST checks | NOT RUN | TEST project is inactive; exact TEST app URL and synthetic test accounts are also not recorded |
| Live Edge Function authorization/CORS/quota tests | NOT RUN | TEST project is inactive; runtime behavior cannot be validated |
| Android device permission/deep-link/WebView tests | NOT RUN | No designated test device/build artifact and hash supplied |
| Windows Electron runtime security tests | NOT RUN | No built artifact/hash supplied |
| Payment/webhook tests | NOT RUN | No confirmed sandbox merchant credentials/test window; no payment attempted |
| Backup/restore recovery exercise | NOT RUN | No disposable TEST backup checkpoint and recovery target supplied |

## Key technical observations

1. The deployed TEST AI Content Function source (v11) validates the caller token through Supabase Auth, checks workspace membership server-side, limits the body size, validates workspace UUID/topic/platform, reserves AI quota, and returns a draft without publishing.
2. The deployed TEST team-management Function source (v14) validates the caller token, requires owner/admin membership, constrains actions and roles, limits body size, rate-limits invitations, and uses database RPCs for membership/audit writes.
3. The AI Content Function has `verify_jwt=false` at the gateway but performs explicit `auth.getUser(token)` validation inside the handler. This is a source-level design observation; live negative/positive authorization tests remain mandatory.
4. The deployed TEST AI Content Function v11 permits roles `owner/admin/member`; the team-management function permits assignment of `admin/member/viewer`. Confirm the intended product role model against the live database once TEST is active. Do not assume the `editor` role is supported by the deployed function.
5. The deployed payment-session Function requires `SSLCOMMERZ_MODE=sandbox`, validates the authenticated order owner, pending status, BDT currency and amount bounds, and uses the SSLCommerz sandbox URL. The IPN Function validates the provider response against transaction ID, validation ID, amount and currency before changing payment state. These source checks do not replace provider sandbox replay/idempotency testing.
6. The deployed AI Content Function allows only configured `APP_ALLOWED_ORIGINS` plus the exact Android HTTPS origin `https://localhost`. The deployed origin configuration itself is not readable here and remains unverified.
7. The repository security review previously recorded a Supabase Security Advisor WARN for an authenticated SECURITY DEFINER workspace-creation RPC. The latest TEST project Advisor calls returned no lints while the project was inactive; this is not evidence that the warning has been resolved.
8. The Electron main process sets `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`; navigation is restricted to the configured app origin. **Desktop architecture risk:** packaged Electron loads the hosted GitHub Pages URL rather than the packaged local `dist` bundle. The installed app therefore depends on remote content at launch. Confirm this trust model or change to a reviewed local bundle / signed pinned update channel before desktop release.
9. Capacitor Android runtime permissions, deep links, WebView navigation, storage and release-signing behavior still require a real TEST APK and designated device.

## Required next actions

- Keep the current no-cost posture. Do not pause either active project or upgrade the Supabase plan without a separate, informed future decision.
- Once the user decides on a future TEST environment path, verify the exact TEST web URL, database connectivity, migrations, RLS and Security Advisor findings.
- Provide two synthetic TEST accounts in separate TEST workspaces; share only labels/roles, never passwords, tokens or session cookies.
- Provide exact Android and Windows TEST artifact links and SHA-256 hashes.
- Record approved test start/end time and rollback/emergency contact.
- Confirm payment tests are restricted to provider sandbox endpoints and sandbox credentials are configured directly by the authorized account owner.

## Safety / release decision

No production resources were probed or changed. No active Supabase project was paused. No plan upgrade, deployment, merge, real customer data access, live payment, social publishing, ad spend, or third-party account action occurred. The latest GitHub Pages workflow built the bundle but skipped artifact upload and deployment. The Red Team assessment is **not complete** and no security clearance is granted. Keep production release blocked until the TEST project is available, all required tests are executed, findings remediated, and independent retesting is complete.


## Follow-up verification — 2026-11-27

After the previous log snapshot, the latest no-cost CI runs were checked:

| Check | Result | Evidence / limitation |
|---|---|---|
| GitHub Pages production bundle build | PASS | Run 46025175797 completed successfully; dependency audit reported 0 npm vulnerabilities, Edge Function type-check, migration safety, JavaScript syntax and production bundle build passed. Artifact upload and deploy jobs were skipped, so no deployment occurred. |
| Disposable local Supabase migration and RLS workflow | PASS | Run 46025175779 completed successfully. All migrations applied to the disposable local database; pgTAP RLS isolation tests passed; local Supabase services verified; local stack stopped cleanly. |

This confirms repository-level and isolated local checks only. It does not resolve the inactive hosted TEST project or replace live Auth/RLS, Edge Function, Android, Windows, payment sandbox, or backup/restore testing. Production release remains blocked.


## Follow-up verification — active BK-BusiCare One inventory — 2026-11-27

This is a read-only control-plane and catalog review of the currently active application project. It is **not** a substitute for the dedicated TEST assessment, and no active penetration testing was performed.

| Check | Result | Evidence / limitation |
|---|---|---|
| Supabase organization plan | FREE | Organization inventory reports `tier_free`; no upgrade or billing change was made. |
| Dedicated TEST project | BLOCKED / INACTIVE | `BK-BusiCare-TEST` (`rmnoiwzkhjwmgxwkfdzb`) remains inactive. No restore attempted in this follow-up. |
| Active application project | OBSERVED | `BK-BusiCare-One` (`pdcpntalufiiilmpevnn`) is `ACTIVE_HEALTHY`; it was not modified. |
| Applied migrations on BK-BusiCare-One | OBSERVED | 14 migrations listed by Supabase. |
| Edge Function inventory on BK-BusiCare-One | OBSERVED | `create-workspace` v1, `manage-workspace-member` v1, `ai-assistant` v3 and `ai-content` v1 are listed ACTIVE with gateway JWT verification enabled. Inventory does not prove end-to-end runtime behavior. |
| RLS inventory on BK-BusiCare-One | PASS — configuration inventory only | Read-only SQL catalog query found RLS enabled on all 9 application tables checked: 8 public tables and private.ai_content_usage. Policy counts were present on each table. This is not a tenant-isolation penetration test. |
| Browser-role table grants | OBSERVED | Read-only grants inventory showed no anon/PUBLIC table grants in the returned application-schema rows; authenticated grants are limited by table. RLS remains the row-level boundary and still needs synthetic-user API tests. |
| Supabase Health Advisor | PASS | No health lints returned. |
| Supabase Security Advisor | WARN | One finding: leaked-password protection disabled. Organization is Free tier; this provider-level feature is not safely remediated by SQL or client-side code. No plan upgrade was made. |
| Supabase Performance Advisor | INFO | Six unused-index notices. No index was removed because the tables are new/low-usage and removal could degrade future workloads. |
| GitHub main build/deploy workflow | PASS | Run 46032855006 completed successfully on main. The workflow includes dependency audit, Deno checks, migration tests, syntax checks and production bundle build. A successful workflow does not prove device QA or live Auth/API correctness. |
| Red Team PR CI | PASS | Runs 46026023183 (build) and 46026023158 (local Supabase) completed successfully for PR #23. |
| Active AI Content Function source review | SOURCE REVIEW | Function validates the caller token, checks workspace membership/role, bounds request size, reserves per-user quota and returns draft-only output. Successful provider-backed generation remains unverified; server-side provider secret presence/value is not exposed by this review. |
| Legacy/alternate AI Assistant Function source review | FINDING — REVIEW REQUIRED | Active `ai-assistant` v3 source uses wildcard CORS (`Access-Control-Allow-Origin: *`). It also validates a bearer token with Supabase Auth and the current browser portal invokes `ai-content`, not `ai-assistant`. Determine whether `ai-assistant` is still required; if retained, replace wildcard CORS with an exact origin allowlist and retest. No live function or project configuration was changed. |

## Updated blockers and next actions

1. Keep `BK-BusiCare-TEST` inactive under the current Free-tier/no-cost constraint. Do not pause either active project to make room.
2. Treat leaked-password protection as a documented provider-plan limitation unless the owner separately approves a paid-plan decision. Do not claim it is enabled.
3. Review the unused `ai-assistant` function and remove it only through a separately reviewed, owner-approved change; if retained, implement exact-origin CORS in a TEST environment first.
4. Continue source/CI improvements and device packaging checks on non-production branches. Obtain exact TEST URL and Android/Windows artifact hashes before device or endpoint testing.
5. Do not merge PR #23, deploy, enable payments, or grant release clearance on the basis of these read-only observations.

No database schema, table data, Edge Function, secret, project state, billing setting, deployment, or production resource was changed during this follow-up. The Red Team assessment remains **PARTIAL / BLOCKED**, and production release remains blocked.


## Verification follow-up — CI completion and current release gates — 2026-11-27

The two workflows triggered by commit `b4ab9bf350ca276170770eae07e72f267adb39d5` have now completed:

| Check | Result | Evidence / limitation |
|---|---|---|
| Application Node test suite | PASS | Run 46037640886: `npm test` reports 64 tests, 64 passed, 0 skipped. |
| Disposable local Supabase migration | PASS | Run 46037640886: all migrations applied to an isolated local Supabase database; pgTAP RLS test files completed successfully; local services verified and stopped. |
| Edge Function type-check | PASS | Run 46037640834: Deno type-check for `manage-workspace-member` and `ai-content` completed successfully. |
| Dependency audit | PASS | Run 46037640834: npm audit reported 0 vulnerabilities. |
| JavaScript syntax / production bundle | PASS | Run 46037640834: syntax checks passed; Vite transformed 52 modules and built successfully. |
| Pages artifact upload / deployment | NOT DEPLOYED | Artifact upload step was skipped and deploy job was skipped because this run was on the Red Team branch. No live deployment resulted. |
| CI warnings | INFO | Build log contains Node.js 20 action deprecation and Node `punycode` deprecation warnings; no build failure. |
| Android APK / Windows package / Play AAB | NOT VERIFIED IN THIS RUN | These workflows were not run by the two CI jobs above. No new mobile/desktop artifact or device-test evidence was produced. |
| PR #23 | OPEN / DRAFT | PR remains unmerged; branch protection is not enabled on the assessment branch. Do not treat this documentation PR as a release candidate. |

The active BK-BusiCare One Supabase inventory was rechecked:
- `BK-BusiCare-One` and `BK-BusiCare` remain `ACTIVE_HEALTHY`; `BK-BusiCare-TEST` remains `INACTIVE`.
- BK-BusiCare One still lists 14 applied migrations.
- Health Advisor remains clear.
- Security Advisor still reports one WARN: leaked-password protection disabled.
- Performance Advisor still reports six INFO unused-index notices. No index was removed because usage is too low to make a safe removal decision.
- The active `ai-assistant` v3 function source still contains wildcard CORS. No live function was changed. The finding remains open pending owner/product confirmation whether this alternate function is needed and a safe TEST validation path.

## Final status of this verification pass

**Repository / isolated CI verification: PASS. Hosted TEST and end-to-end release verification: BLOCKED / NOT RUN.**

The successful CI run proves the tested source branch builds, the 64 application tests pass, and migrations/RLS tests pass on a disposable local Supabase stack. It does not prove hosted tenant isolation, live Auth, AI provider configuration, Android or Windows runtime behavior, payment sandbox integrity, backup restoration, or production readiness.

No TEST restore, paid upgrade, production deployment, merge, live payment, secret change, database mutation, or Edge Function change was performed. Keep production release blocked pending a working dedicated TEST environment and fresh Android/Windows artifact and runtime evidence.


## Verification follow-up — Android WebView AI Content CORS patch — 2026-11-28

A narrowly scoped source change was committed to the existing assessment branch:

- Commit: `dcd75483a2444d3d2b37a8fd3c90f3675f88a402`
- File: `supabase/functions/ai-content/index.ts`
- Change: the OPTIONS preflight response now reflects the browser's requested header list only after the request Origin passes the existing exact allowlist. The response varies on both Origin and Access-Control-Request-Headers. No wildcard origin was introduced.
- Preserved: handler-side Supabase Auth token validation, workspace membership authorization, body-size and input limits, quota reservation, and server-only OpenAI provider key use.
- Review path: PR #23, already open as a draft. No merge was performed.

### Runtime evidence and limits

A read-only log review of active BK-BusiCare One showed Android 16 WebView requests from `https://localhost`. The observed AI Content OPTIONS requests returned HTTP 204, and ordinary authenticated REST reads for workspace members, leads, and content items returned HTTP 200. This proves those specific preflight/read requests succeeded at the recorded time; it does **not** prove the subsequent AI Content POST, provider response, or end-to-end draft generation succeeded.

The latest GitHub workflow lookup for the new commit returned no associated PR-triggered workflow runs at the time of review. Therefore this new patch is **not yet CI-verified**. It has not been deployed to any Supabase project.

### Updated status

| Work item | Status |
|---|---|
| CORS source patch committed to assessment branch | DONE |
| Patch CI/type-check/regression test | PENDING |
| Dedicated hosted TEST project | BLOCKED — inactive; previous restore attempt was rejected because the Free organization already has two active projects |
| Live authenticated AI Content POST / OpenAI generation | NOT VERIFIED |
| Android 16 device retest with a recorded build SHA | NOT RUN |
| Windows package and runtime security test | NOT RUN |
| Payment sandbox and backup/restore exercises | NOT RUN |
| Production deployment / Play Store release | HOLD |

No active Supabase project was paused, no Free-tier limit was bypassed, no plan upgrade was made, and no deployment, merge, secret change, payment, or production modification occurred. Do not treat the source patch as a verified fix until CI passes and an authenticated Android 16 POST/generation test succeeds in a dedicated authorized TEST environment.


## Verification follow-up — deployed AI Content function comparison — 2026-11-28

A read-only inspection compared the current hosted BK-BusiCare One Edge Function with the proposed source patch on the Red Team branch.

| Check | Result | Evidence / limitation |
|---|---|---|
| Hosted BK-BusiCare One `ai-content` function | ACTIVE, version 2 | Supabase control-plane inventory. This establishes deployment presence, not correctness. |
| Hosted source CORS behavior | PATCH NOT PRESENT | Retrieved hosted `index.ts` still has a fixed `Access-Control-Allow-Headers` list and `Vary: Origin`; its OPTIONS handler calls `corsHeaders(origin)` without reflecting `Access-Control-Request-Headers`. The branch patch is therefore not present in the hosted source snapshot. |
| Hosted function JWT gateway setting | ENABLED | Control-plane inventory reports `verify_jwt=true`. Handler source also performs explicit `auth.getUser(token)`. |
| Android 16 WebView AI Content preflight | OBSERVED PASS, LIMITED | Six logged `OPTIONS` requests to `/functions/v1/ai-content` returned HTTP 204 on 2026-11-27. This only confirms preflight status; request headers and the actual POST were not verified. |
| Authenticated AI Content POST / OpenAI generation | NOT OBSERVED | The reviewed seven-day logs contained no AI Content POST record. No provider-backed generation success can be claimed. |
| GitHub Actions for assessment head `3678eb757a209e50906a9b15d0fdd4f9e70e8480` | NO PR WORKFLOW RUN FOUND | The commit workflow lookup returned an empty workflow_runs list. The branch patch remains unverified by CI. |
| Hosted deployment of branch patch | NOT DEPLOYED | The hosted source comparison shows the proposed dynamic-header patch is absent. No deployment was initiated. |

### Required remediation / next safe actions

1. Keep the hosted function unchanged until the branch patch is reviewed and CI/type-check results are available.
2. Run the repository test and Deno checks for the exact PR head. The workflow lookup currently exposes no PR run for that head; if the repository workflow is not configured to run on this branch, correct the workflow trigger on the branch before considering deployment.
3. In a dedicated authorized TEST project, test preflight using the exact header set emitted by the Android 16 WebView, then perform authenticated positive and negative POST cases with synthetic test accounts. Confirm AI generation, quota enforcement, and no publication side effect.
4. Only after independent review and successful TEST evidence should a separate deployment decision be considered. Do not deploy this patch to the active application project as a substitute for TEST.

No hosted function, database, secret, billing plan, project state, or production resource was changed in this verification. Production release remains HOLD.


## Correction / follow-up — PR CI evidence for CORS patch — 2026-11-28

A repository-wide Actions run inventory was used after the exact-commit workflow lookup returned no rows. The PR run records include a successful validation for the current PR #23 head (e3a595fbcf9f5b6f591c8b8cf84dc4b5041d7d30):

| Check | Result | Evidence / limitation |
|---|---|---|
| Build workflow | PASS | Run 46038147731, event pull_request, associated with PR #23 whose current head was e3a595fbcf9f5b6f591c8b8cf84dc4b5041d7d30. Dependency audit, Deno Edge Function type-check, Node test suite, JavaScript syntax checks and production bundle build all succeeded. |
| Supabase local migration / RLS workflow | PASS | Run 46038147646, event pull_request, associated with PR #23 at the same head. Application/migration tests, Deno type-check, disposable local Supabase startup, migration reset, pgTAP RLS tests, service verification and cleanup all succeeded. |
| Pages artifact / deployment | NOT DEPLOYED | Artifact upload was skipped and deploy job skipped because this was a pull-request run. |
| Hosted AI Content function patch | NOT DEPLOYED | Read-only hosted source inspection still shows the old fixed CORS allow-header list. CI success does not deploy the patch. |

The earlier statement that no PR CI run existed was based on a lookup filtered by the raw head SHA, which did not expose the PR's synthetic merge-commit run records. The broader branch Actions inventory identifies the successful PR runs above. This entry supersedes that CI-status statement. No hosted deployment, merge, secret change or production modification occurred.

The assessment remains PARTIAL / BLOCKED because hosted TEST, authenticated AI POST/generation, Android/Windows device acceptance, payment sandbox, backup restore, independent security review and the legacy ai-assistant wildcard-CORS disposition are still open.
