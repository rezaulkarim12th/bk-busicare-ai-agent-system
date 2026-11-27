# BK-BusiCare One — Red Team Readiness

Status: **Prepared for controlled assessment; testing not yet executed.**  
Branch: `security/red-team-readiness`  
Assessment environment: dedicated Supabase TEST project and non-production app build only.

## Mission
Independently challenge the application's security assumptions, identify exploitable weaknesses, validate tenant isolation and authorization boundaries, and provide reproducible, risk-ranked findings with remediation guidance.

## Non-negotiable rules
- Written authorization and a named test window are required before active testing.
- Scope is limited to assets explicitly listed in [SCOPE.md](./SCOPE.md). No production systems, real customer data, third-party platforms, personal accounts, or unrelated infrastructure.
- Use synthetic accounts, synthetic records, and provider sandbox credentials only.
- No destructive testing, denial-of-service, persistence, credential harvesting, phishing, malware, social engineering, or access to other users' data.
- Do not attempt to bypass payment providers, publish posts, send real messages, spend ad budget, or change production settings.
- Stop immediately on unexpected access to real data, service instability, suspected compromise, or out-of-scope assets. Preserve minimal evidence and notify the owner.
- Never place secrets, tokens, passwords, customer data, or raw session cookies in reports or chat.

## Red Team workstreams
1. Identity and session management
2. Multi-tenant authorization and RLS
3. API and Edge Function authorization
4. Input validation, injection resistance and file handling
5. Secrets, configuration and dependency supply chain
6. Client, Android and Windows desktop security
7. Payments, billing and webhook integrity (sandbox only)
8. Logging, privacy, backup and recovery
9. CI/CD and release integrity

## Deliverables
- Approved scope and test-window record
- Evidence-backed findings with severity, affected component, impact, reproduction summary, and remediation
- Retest results and residual-risk register
- Final go/no-go recommendation

## Current readiness statement
This folder establishes the assessment process and test cases. It does **not** represent a completed penetration test, a security certification, or proof that the application is secure. The known release gates in the repository's security review remain open until independently tested.
