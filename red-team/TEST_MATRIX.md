# Red Team Test Matrix

Status key: `PLANNED` = defined, not executed; `PASS/FAIL` requires timestamped evidence. No test in this matrix is marked PASS by preparation alone.

| ID | Domain | Controlled validation | Expected secure result | Status |
|---|---|---|---|---|
| RT-01 | Authentication | Verify sign-in, sign-out, recovery and session expiry using synthetic accounts | Invalid/expired sessions rejected; recovery flow does not disclose account existence | PLANNED |
| RT-02 | Password policy | Check server-side Supabase Auth policy and leaked-password protection setting | Server enforces approved policy; unavailable provider features recorded as blocker | PLANNED |
| RT-03 | Tenant isolation | Create two synthetic users in separate workspaces; compare only their own seeded records | No cross-workspace reads or writes | PLANNED |
| RT-04 | Role authorization | Exercise owner/admin/member permissions on synthetic workspace | Only explicitly authorized roles can perform privileged actions | PLANNED |
| RT-05 | RLS and grants | Review table grants, RLS policies, helper functions and SECURITY DEFINER search_path | Least privilege; policies enforce tenant and role boundaries | PLANNED |
| RT-06 | Edge Functions | Test missing/invalid JWT, valid role, invalid role, malformed input and exact-origin CORS in TEST | Unauthorized calls rejected; authorized calls constrained; no wildcard CORS | PLANNED |
| RT-07 | Input handling | Submit harmless boundary strings and malformed data to test forms/APIs | Validation rejects invalid data; no code/SQL execution or data corruption | PLANNED |
| RT-08 | File/backup handling | Validate file type/size/schema and restore behavior using disposable exports | Invalid or oversized imports rejected; valid restore is bounded and reversible | PLANNED |
| RT-09 | Secret management | Inspect tracked files, frontend bundle and CI configuration for accidental secret exposure | No service-role keys, provider secrets or private credentials in source/client bundle | PLANNED |
| RT-10 | Dependency chain | Review lockfile, advisories, lifecycle scripts and CI permissions | Vulnerabilities triaged; CI uses least privilege and pinned dependencies where practical | PLANNED |
| RT-11 | Android | Review app permissions, deep links, WebView navigation, local storage and release signing | Minimal permissions; no sensitive secrets in client; release artifact integrity verified | PLANNED |
| RT-12 | Windows | Review Electron context isolation, Node integration, preload bridge and navigation allowlist | Renderer is sandboxed; privileged APIs narrowly exposed | PLANNED |
| RT-13 | Payment | Run provider sandbox success/failure/cancel/replay/idempotency tests only | Server verifies provider authenticity; no duplicate or forged paid state | PLANNED |
| RT-14 | Webhooks | Verify signature, replay handling, amount/currency/order binding in sandbox | Invalid/replayed/mismatched events rejected and audited | PLANNED |
| RT-15 | Logging/privacy | Review logs for tokens, passwords, personal data and overly detailed errors | Sensitive values redacted; access and security events auditable | PLANNED |
| RT-16 | Recovery | Restore a synthetic TEST backup and verify data integrity | Recovery meets owner-defined RPO/RTO; no production data involved | PLANNED |
| RT-17 | Release pipeline | Verify branch protections, workflow permissions, artifact provenance and approval gates | Unreviewed changes cannot silently reach production | PLANNED |
| RT-18 | Regression | Retest every confirmed finding after remediation | Finding closed only with repeatable evidence | PLANNED |

## Execution notes
- Record tester, timestamp (UTC), commit SHA, environment and synthetic account IDs for each test.
- Record only the minimum evidence necessary. Redact all secrets and personal data.
- Use separate synthetic tenants and never probe unknown tenant identifiers.
- Findings require a safe reproduction summary, impact, severity rationale and remediation recommendation.
- A test is not passed until evidence is reviewed by someone other than the person who performed it.
