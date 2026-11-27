# Red Team Initial Execution Log

Assessment status: **BLOCKED / PARTIAL — repository checks pass; dedicated TEST project cannot be restored under the current Supabase free-project limit**
Date: 2026-11-27
Assessment branch: `security/red-team-readiness`
Assessment PR: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/pull/23

## Evidence-backed checks observed

| Check | Result | Evidence / limitation |
|---|---|---|
| Dependency audit on Red Team PR | PASS | GitHub Build workflow 46023933616 completed successfully |
| Supabase Edge Function type-check | PASS | Build workflow 46023933616 |
| Migration safety checks | PASS | Build workflow 46023933616 |
| JavaScript syntax checks | PASS | Build workflow 46023933616 |
| Production web bundle build | PASS | Build workflow 46023933616 |
| Local migration application | PASS | Supabase local CI run 46023933630; all migrations applied to disposable local database |
| Local pgTAP RLS isolation suite | PASS | Run 46023933630; pgTAP RLS isolation step completed successfully |
| Local Supabase service checks | PASS | Run 46023933630; local services verified and stack stopped cleanly |
| Windows packaging pipeline | BLOCKED | Latest inspected Windows run 45924324002 failed at `npm test`; 63/64 tests passed. The failing assertion expected the older role list; packaging steps were skipped. Current Red Team branch test source was updated, but a fresh Windows build/test run is still required. |
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

- Resolve the Supabase free-project cap without pausing either active project: choose an eligible plan upgrade for this organization, or explicitly choose an active project to pause after reviewing its service impact. The authorized restore was attempted, but the platform rejected it; no billing change or pause was performed.
- After TEST becomes active, verify the exact TEST web URL, database connectivity, migrations, RLS and Security Advisor findings.
- Provide two synthetic TEST accounts in separate TEST workspaces; share only labels/roles, never passwords, tokens or session cookies.
- Provide exact Android and Windows TEST artifact links and SHA-256 hashes.
- Record approved test start/end time and rollback/emergency contact.
- Confirm payment tests are restricted to provider sandbox endpoints and sandbox credentials are configured directly by the authorized account owner.

## Safety / release decision

No production resources were probed or changed. No active Supabase project was paused. No plan upgrade, deployment, merge, real customer data access, live payment, social publishing, ad spend, or third-party account action occurred. The Red Team assessment is **not complete** and no security clearance is granted. Keep production release blocked until the TEST project is available, all required tests are executed, findings remediated, and independent retesting is complete.
