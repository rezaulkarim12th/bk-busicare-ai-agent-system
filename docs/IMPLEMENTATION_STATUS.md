# BK-BusiCare One — Implementation & Release Status

Last verified: 2026-11-24 (GitHub and Supabase TEST read-only inspection)
Status: Browser MVP and TEST backend foundation available. **Not production-certified. Play Store publication is out of scope.**

## Environment

- Application: https://rezaulkarim12th.github.io/bk-busicare-ai-agent-system/
- Repository: https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system
- TEST Supabase: BK-BusiCare-TEST (`rmnoiwzkhjwmgxwkfdzb`), ACTIVE_HEALTHY.
- Production Supabase: BK-BusiCare (`ekznyijmghrjtovbbgun`), ACTIVE_HEALTHY; untouched during this work.
- All further development and validation must remain isolated to TEST until a separate, approved release plan exists.

## Implemented application scope

The repository README describes a responsive Vite web-app MVP, not a complete production SaaS or fully integrated AI agent.

- Local browser demo: dashboard, leads/sales pipeline, catalogue preview, content planning, reports, CSV export and JSON backup/restore.
- Local demo data is stored in the current browser and does not synchronize across accounts/devices.
- Authenticated portal source supports email/password sign-in, registration, password recovery, workspace creation/selection.
- Cloud workspace supports workspace-scoped Leads and Content CRUD protected by PostgreSQL RLS.
- Team membership/role operations use a server-side Edge Function.
- Template-based Social Content Studio can prepare text/storyboard drafts; it does not render MP4 or publish/schedule content.
- AI Content Studio has a server-side integration foundation and is designed to return draft-only content. Successful live provider generation is not yet evidenced.
- Commerce/order/payment backend foundations exist in TEST. This does not establish a complete storefront, successful payment, fulfilment or production order lifecycle.

Not implemented or not certified: live social publishing, ad campaign execution, messaging, complete commerce checkout/fulfilment, scheduled automation, full AI agent orchestration, production monitoring and operational recovery drills.

## TEST database — verified 2026-11-24

- 10 migrations applied, latest:
  - `20261123094545_sslcommerz_payment_foundation`
  - `20261123094616_deny_browser_access_payment_tables`
- Eight public tables have RLS enabled: `workspaces`, `workspace_members`, `leads`, `content_items`, `audit_events`, `product_catalog`, `orders`, `payment_transactions`.
- Commerce/payment tables deny direct browser-role access and are intended to be accessed through trusted server-side functions.
- Point-in-time row counts are not acceptance tests.

## TEST Edge Functions — verified 2026-11-24

| Function | Version | Gateway JWT |
|---|---:|---|
| `create-workspace` | 11 | Required |
| `manage-workspace-member` | 13 | Required |
| `ai-content` | 10 | Disabled at gateway; handler validates bearer token and workspace authorization |
| `busicare-create-order` | 2 | Required |
| `sslcommerz-create-session` | 2 | Required |
| `sslcommerz-ipn` | 4 | Disabled at gateway; handler validates provider callback |

An ACTIVE status proves deployment, not successful runtime behavior or provider configuration. The exact `APP_ALLOWED_ORIGINS`, `OPENAI_API_KEY`, and SSLCommerz merchant secrets are not readable through the connected inspection tools and must never be pasted into chat or committed to Git.

## CI evidence — 2026-11-24

On commit `95d0bea650093ed42574dff92dae722318c9cad1`:

- Build / dependency audit / type checks: SUCCESS — https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/45430721184
- Android debug APK build: SUCCESS — https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/45430721096
- Local Supabase migration and pgTAP RLS suite: SUCCESS — https://github.com/rezaulkarim12th/bk-busicare-ai-agent-system/actions/runs/45430721077

The Pages workflow's build succeeded but its deploy job was skipped. The Android artifact is a debug APK (artifact ID `14937837950`, approximately 8.68 MB, expires 2026-12-08); it is not a signed release and has not passed physical-device QA. Local CI does not prove live Auth email delivery, TEST provider secrets, or live API behavior.

## Advisor results — 2026-11-24

- Security Advisor: one WARN — `auth_leaked_password_protection` disabled. Supabase documents this HaveIBeenPwned check as Pro-and-above. An authorized adult account owner must decide plan eligibility and configure the provider-level setting. https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Performance Advisor: six INFO unused-index notices (`orders_user_created_idx`, `payment_transactions_order_idx`, `product_catalog_active_idx`, `audit_events_actor_idx`, `leads_workspace_status_idx`, `audit_workspace_created_idx`). Do not drop without representative workload evidence.
- Health Advisor: no findings.

## Open pull requests

- PR #12 — Subscription/Billing menu preview; no billing enforcement or actual recurring payments.
- PR #13 — Free-mode Social Content Studio; draft-only content generation, no MP4 rendering or publishing.
- PR #14 — SSLCommerz TEST backend foundation; no merchant sandbox transaction evidence.
- PR #15 — Documentation reconciliation.

All are open/unmerged in the inspected state. Do not merge or deploy to Production merely to make the checklist appear complete; review and validate each change first.

## Remaining acceptance gates (Play Store publication excluded)

1. Authorized owner configures exact TEST origins and server-side OpenAI/SSLCommerz secrets; verify configuration without disclosing secret values.
2. Complete live Auth signup, confirmation, login, logout and password-recovery/email-delivery tests.
3. Run independent two-user/two-workspace live API isolation tests.
4. Verify AI preflight and authenticated generation, quota enforcement and failure handling.
5. Complete SSLCommerz sandbox order/session/success/failure/cancel/replay/timeout and order-lifecycle tests.
6. Install the debug APK on a physical Android device and complete login, navigation, responsiveness, network-recovery and accessibility checks.
7. Complete backup/restore, monitoring, independent security review, signed release build and authorized owner sign-off.

The signed release build and Play Store publication must remain on hold until the relevant acceptance evidence and approvals exist. Production must remain untouched.

## Safety and deployment boundaries

- No Production deployment, real payment, external social publishing, customer messaging or advertising spend is authorized by this status document.
- Never expose service-role/secret keys, database passwords, OpenAI keys, payment credentials or OAuth tokens in browser code, source control or chat.
- Human approval is required before any external write action, real transaction, customer-data import or Production change.
