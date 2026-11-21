# BK-BusiCare — Google Play Pre-Release QA Gate

**Release state: HOLD — DO NOT SUBMIT OR ROLL OUT TO GOOGLE PLAY.**

This checklist is a release-control record. A checked item requires recorded evidence; source-code presence or a successful CI build alone is not acceptance evidence.

## Immutable release controls
- [ ] Adult Play Console owner confirms ownership and access.
- [ ] Confirm Play Console package name is exactly `com.bkbusicare.app`; package names are permanent.
- [ ] Confirm app name, developer name, support email, privacy-policy URL and country availability with the owner.
- [ ] Confirm the first release will use Play App Signing and that the upload key backup is stored securely.
- [ ] Confirm versionCode is unique and higher than every previously uploaded bundle.
- [ ] Written owner approval is recorded before any Play Console upload.
- [ ] Written owner approval is recorded separately before any testing-track rollout or Production rollout.

## Build and artifact integrity
- [ ] Capacitor 8 / Android Gradle build completes on clean GitHub-hosted runner.
- [ ] compileSdk and targetSdk are verified as 36 or higher.
- [ ] Signed AAB is produced using owner-controlled upload key.
- [ ] AAB signature verifies with `jarsigner -verify -verbose -certs`.
- [ ] Package ID, versionCode, versionName, minSdk, targetSdk and requested permissions are extracted from the final AAB and reviewed.
- [ ] SHA-256 checksum is recorded and artifact is retained securely.
- [ ] No debug signing key, test endpoint, debug flag, secret, or test data is packaged.
- [ ] Build is reproducible from the reviewed commit.

## Functional acceptance (TEST environment only)
- [ ] Fresh install and upgrade install tested on supported Android versions.
- [ ] App launch, navigation, back button, keyboard, orientation and process restoration tested.
- [ ] Signup, email verification, login, logout and password recovery tested.
- [ ] Workspace create/select/switch and membership roles tested.
- [ ] Two independent users and two workspaces tested for direct API isolation.
- [ ] Viewer and non-member permissions tested.
- [ ] AI Content Studio tested with valid and invalid sessions, quota exhaustion, provider errors and network interruption.
- [ ] Form draft persistence and clearing behavior tested through navigation, workspace switch and logout.
- [ ] Data export, restore, deletion and account deletion flows tested where offered.
- [ ] Accessibility, text scaling, screen readers, contrast and touch target checks completed.
- [ ] Crash, ANR, startup and network failure tests completed.
- [ ] No real customer data used in TEST.

## Product scope and claims
- [ ] Every store-listing claim is demonstrably implemented in the submitted build.
- [ ] Incomplete CRM, commerce, checkout, payments, social publishing and external integrations are not advertised as available.
- [ ] Demo/sample data is clearly labelled and cannot be mistaken for real inventory, orders or customer records.
- [ ] All external actions and AI-generated content remain user-reviewed; no unapproved publishing or messaging.

## Privacy and policy declarations
- [ ] Final SDK/dependency inventory reviewed, including Capacitor plugins and transitive SDKs.
- [ ] Actual data collected, purpose, processing, sharing, retention and security documented.
- [ ] Privacy policy publicly reachable, app-specific, and consistent with actual behavior.
- [ ] Data Safety form completed from verified evidence, not assumptions.
- [ ] Account deletion requirements reviewed and implemented if account creation is available.
- [ ] App access instructions supplied for reviewer login, with safe review credentials.
- [ ] Ads declaration, target audience, content rating, app category and permissions declarations completed accurately.
- [ ] Permission minimization and any sensitive permission declarations reviewed.

## Store listing assets
- [ ] App title, short description and full description reviewed and localized.
- [ ] App icon, feature graphic and phone screenshots match the actual app UI.
- [ ] Screenshots are genuine captures of the submitted build, not mockups of unavailable features.
- [ ] Support contact and privacy-policy link tested.
- [ ] Release notes reviewed.

## Play Console review
- [ ] Upload to Internal testing only after explicit owner approval.
- [ ] Install from Play testing link on multiple physical devices.
- [ ] Play pre-launch report reviewed; all blocking issues fixed.
- [ ] Closed testing requirement checked against this developer account's type and creation date.
- [ ] Production access eligibility confirmed in Play Console.
- [ ] Final release notes, countries, device availability and staged rollout reviewed.
- [ ] Production rollout requires a separate explicit owner approval.

## Current known blockers (as of 2026-11-21)
- Live Auth, password recovery and invitation email delivery have not been fully verified.
- Live authenticated AI generation has not been demonstrated; TEST provider secrets must be configured by the owner.
- Live multi-user / multi-workspace API isolation acceptance tests remain outstanding.
- Android signed AAB has not yet been built or inspected.
- The app is an MVP; the implementation status document lists CRM workflows, commerce, payments and external integrations as incomplete or unverified.
- No final privacy/data inventory or Data Safety declaration has been verified.
- No final store graphics/screenshots or approved listing copy have been accepted.
- No Play Console upload, testing release or publication is authorized by this checklist.

## Final sign-off
A release manager must attach evidence for every item above, list any accepted limitations, record the exact commit SHA and AAB SHA-256, and obtain the owner's explicit written approval. If any critical item is unknown or fails, status remains HOLD.
