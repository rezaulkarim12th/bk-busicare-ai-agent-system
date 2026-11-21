# BK-BusiCare — Privacy & Data Safety Evidence Worksheet

**Status: INCOMPLETE — DO NOT SUBMIT A Data Safety declaration until every field is verified against the shipped build and backend.**

This worksheet intentionally does not guess what data the app collects or shares.

## Evidence required
1. Exact release commit SHA and AAB SHA-256.
2. Complete dependency and SDK inventory, including Capacitor plugins and transitive Android SDKs.
3. Android manifest permissions from the final generated project and final AAB.
4. Browser/app storage inventory (Local Storage, session storage, caches and files).
5. Supabase tables, columns, RLS policies, Auth settings, logs, backups and retention configuration.
6. Edge Function request/response fields and provider integrations.
7. AI provider data processing terms, retention settings and geographic processing details.
8. Any analytics, crash reporting, advertising, attribution, support or payment SDK inventory.
9. Account creation, account deletion and data deletion behavior.
10. Actual data-flow tests from a clean install and test account.

## Data categories to investigate
For each category, record: collected? optional/required? purpose? ephemeral or retained? shared with whom? encrypted in transit? deletion behavior? source evidence?
- Account identifiers and authentication data
- Name, email and workspace membership
- Business contact / lead records
- User-generated content and AI prompts/outputs
- Device identifiers and diagnostics
- App interactions and usage data
- Files, exports and backups
- Payment or financial information (do not claim collection unless implemented and verified)
- Precise/coarse location (do not claim collection unless implemented and verified)

## Third-party recipients
Record each service, exact SDK/API, data fields sent, purpose, retention and contractual/privacy terms. Verify Supabase and AI provider behavior from configuration and their current terms. Do not infer this from package names alone.

## Declaration rule
Only mark a category as collected, shared, optional, encrypted, or deletable when evidence supports that exact answer. Data Safety declarations are legal/product representations and must be approved by the adult app owner or their authorized compliance reviewer.

## Privacy policy minimum sections
- App and developer identity and contact
- Data categories collected and sources
- Purposes and legal basis where applicable
- Third-party processors and sharing
- Retention and deletion
- Security practices and limitations
- Children's / target audience handling, as applicable
- User rights and contact process
- Policy effective date and change history

## Current known product facts from repository documentation
The project documentation describes Supabase Auth and workspace-scoped Leads/Content, an AI Content Studio that sends prompts to a server-side Edge Function, a browser-local demo using Local Storage, and features that remain incomplete or unverified. This is not a complete data inventory. Validate all facts against the exact release build before writing the public policy.
