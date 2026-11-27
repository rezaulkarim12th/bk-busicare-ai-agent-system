# Red Team Scope and Rules of Engagement

## In-scope (only after owner approval)
- Repository: `rezaulkarim12th/bk-busicare-ai-agent-system`
- Dedicated Supabase TEST project: `rmnoiwzkhjwmgxwkfdzb`
- A designated TEST web deployment and test Android/Windows builds, once their exact URLs and artifact hashes are recorded by the owner.
- Synthetic test users and workspaces created specifically for the assessment.
- Provider sandbox endpoints only, after credentials are configured directly by the authorized account owner.

## Explicitly out of scope
- Production Supabase project, production website, real customer/employee data, personal accounts and devices not designated for testing.
- Live payment processing, real refunds, real order fulfilment, social media publishing, advertising spend, email/SMS campaigns.
- Supabase, GitHub, Google, Meta, Microsoft, SSLCommerz or other provider infrastructure outside the application's authorized integration boundary.
- Load testing, stress testing, denial-of-service, destructive database actions, persistence, lateral movement beyond the test tenant, and social engineering.

## Required authorization record
Before active testing, record:
- Authorizing owner and approval timestamp
- Exact TEST URLs, project reference and build commit SHA
- Test start/end time and tester identities
- Synthetic account identifiers (never passwords or tokens)
- Allowed test techniques and emergency contact
- Backup/restore checkpoint and rollback owner

## Safety controls
- Use read-only checks first; use disposable synthetic data for mutation tests.
- Limit request rates to normal interactive usage; no concurrency or volume testing without separate approval.
- Do not enumerate or retrieve records belonging to unknown users or tenants. Verify isolation with controlled synthetic tenants only.
- Redact secrets and personal information from screenshots, logs and reports.
- Stop and report if any test returns non-synthetic data or affects availability.
- All changes must be reversible; record cleanup and confirm no test artifacts remain.

## Approval status
**Pending owner authorization for active testing.** Repository documentation and test planning may be prepared before approval; live probing may not.
