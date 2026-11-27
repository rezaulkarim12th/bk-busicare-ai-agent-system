# BK-BusiCare One — Multi-Platform Release & QA Plan

**Status:** Planning baseline committed for review; implementation and release gates remain open.  
**Target platforms:** Android 16 phones/tablets, responsive web on laptop/desktop, Windows EXE installer and Windows MSIX package.  
**Protected configuration:** Existing Settings, account/workspace configuration, authentication configuration, and current Dashboard behavior are regression-protected. No production configuration or database changes are authorized by this plan.

## 1. Current repository evidence

This plan is based on the repository state inspected on 2026-11-25.

- The project is a Vite browser application with a Capacitor Android wrapper.
- `capacitor.config.json` identifies the app as `com.bkbusicare.app`, named `BK-BusiCare`, with `dist` as its web asset directory.
- The current Android workflow builds a **debug APK** and uploads it as a GitHub Actions artifact. It does not produce a signed Play Store AAB.
- The published browser MVP is available at https://rezaulkarim12th.github.io/bk-busicare-ai-agent-system/.
- The browser application has responsive desktop/mobile styling, but tablet, Android 16, and Windows packaged-app acceptance evidence is not yet recorded.
- The repository does not currently contain a Windows desktop shell or EXE/MSIX packaging workflow.
- The repository's release checklist explicitly keeps Play Store submission on HOLD pending signed AAB, live authentication, tenant-isolation, security, privacy, and owner-approval evidence.
- The implementation status document describes the application as an MVP, not a complete production SaaS.

A successful build or uploaded artifact is not proof of end-to-end platform acceptance.

## 2. Non-regression contract

The following are release invariants:

1. Do not redesign, rename, remove, reset, or silently alter the Settings screen or its saved values.
2. Preserve sign-in, account identity, workspace selection, and role-based access behavior.
3. Preserve existing Dashboard, Leads, Sales Pipeline, Content Planner, AI Content Studio, Team, Reports, and navigation behavior where implemented.
4. Keep TEST and Production environments separate. Do not run migrations or deploy functions to Production as part of packaging work.
5. Do not introduce sample/demo data into real workspaces.
6. Do not embed Supabase service-role keys, OpenAI keys, signing passwords, or other secrets in browser code, desktop bundles, APKs, or source control.
7. Do not enable live checkout, payment, publishing, ad spend, or external messaging as a side effect of desktop packaging.
8. Every behavior change must be reviewed in a pull request and pass the relevant regression suite.

## 3. Platform delivery tracks

### A. Website — laptop and desktop browsers

- Keep the existing published web application as the primary cross-platform experience.
- Verify production build, deployment path/base URL, HTTPS, route loading, refresh/deep-link behavior, and browser console errors.
- Test current supported Chromium, Firefox, and Safari-family browsers where available.
- Verify responsive layouts at common laptop and desktop widths, keyboard-only navigation, zoom/text scaling, and accessible focus states.
- Test authentication redirects and workspace switching against TEST accounts only.
- Do not claim the live website has been updated until a reviewed main-branch deployment succeeds.

### B. Android 16 phones and tablets

- Retain the existing application ID `com.bkbusicare.app` unless the owner explicitly approves a package identity change.
- Review Capacitor, Android Gradle Plugin, Java, compileSdk, targetSdk, and plugin compatibility as one versioned set before upgrading.
- Build a debug APK for internal device testing; separately prepare a signed release AAB only after the owner-controlled signing process is configured.
- Test Android 16 phone and tablet layouts, portrait/landscape, system back navigation, keyboard, safe areas, app resume/process restoration, network interruption, and upgrade installation.
- Test Settings and workspace persistence before and after app restart and upgrade.
- Record device model, Android version, build commit, artifact checksum, and test result for each test.

### C. Windows desktop — EXE and MSIX

- First perform a desktop-shell feasibility spike against the existing Vite app. Compare Tauri and Electron for compatibility, bundle size, maintenance, security model, and installer support.
- Select one shell only after a reproducible Windows CI proof-of-concept. Do not maintain two independent desktop application codebases.
- Produce a signed Windows EXE installer and a separately packaged MSIX artifact from the same reviewed release commit.
- Confirm Windows architecture support (x64 initially; ARM64 only if separately built and tested), app identity, versioning, upgrade/uninstall behavior, Start Menu entry, app icon, deep links, and HTTPS-only network access.
- Keep desktop authentication on the approved HTTPS backend. Never package service-role credentials or provider secrets.
- Test clean install, upgrade, uninstall, reinstall, app launch, offline/network error handling, screen scaling, keyboard navigation, and Windows SmartScreen/signature behavior.
- Code-signing certificate ownership, MSIX publisher identity, and distribution channel must be confirmed before public distribution. Unsigned packages may be used only for controlled internal testing with clear warnings.

## 4. QA matrix and acceptance evidence

| Area | Phone | Tablet | Laptop / desktop web | Windows EXE | Windows MSIX |
|---|---|---|---|---|---|
| Install / upgrade / uninstall | Required | Required | N/A | Required | Required |
| Sign-in / sign-out / recovery | Required | Required | Required | Required | Required |
| Settings unchanged | Required | Required | Required | Required | Required |
| Workspace and role boundaries | Required | Required | Required | Required | Required |
| Dashboard and navigation | Required | Required | Required | Required | Required |
| Leads and draft persistence | Required | Required | Required | Required | Required |
| Content Planner / AI draft flow | TEST only | TEST only | TEST only | TEST only | TEST only |
| Responsive layout / scaling | Required | Required | Required | Required | Required |
| Network interruption / recovery | Required | Required | Required | Required | Required |
| Accessibility / keyboard | Touch + screen reader | Touch + screen reader | Required | Required | Required |
| Security / secret scan | Required | Required | Required | Required | Required |

### Required automated checks

- Locked dependency installation and dependency vulnerability audit.
- Unit and regression tests, including Settings non-regression assertions.
- JavaScript syntax checks and production Vite build.
- Supabase migration safety tests and RLS regression tests on disposable/local TEST infrastructure.
- Android clean-runner build and artifact inspection.
- Windows clean-runner build for both installer formats.
- Artifact SHA-256, package metadata, version, publisher identity, and signature verification.
- Smoke tests for login, navigation, Settings, workspace switching, Leads, and draft persistence.

### Required manual acceptance

- Test with separate test accounts and separate workspaces; verify non-member denial and viewer restrictions.
- Verify no loss or reset of Settings after app update.
- Verify phone, tablet, laptop, and desktop layouts on physical devices or supported test environments.
- Verify EXE and MSIX install, upgrade, launch, and uninstall on supported Windows versions.
- Record defects, screenshots/logs where appropriate, commit SHA, artifact hashes, and tester sign-off.

## 5. Release gates

1. **Scope and baseline:** confirm current main branch, Settings behavior, app identity, and supported OS/browser versions.
2. **Web regression:** build and test the existing website without changing Settings.
3. **Android compatibility:** reconcile the existing Capacitor workflow with the release checklist; produce and inspect a debug APK; then separately prepare signed AAB.
4. **Windows packaging spike:** select Tauri or Electron based on a tested prototype; build EXE and MSIX from one codebase.
5. **Cross-platform QA:** complete the matrix and fix all critical/high-severity defects.
6. **Security and privacy:** verify auth, tenant isolation, secrets handling, permissions, data disclosures, signing, and backup/rollback readiness.
7. **Owner approval:** obtain explicit approval before Production deployment, Play Console upload, public Windows distribution, or changes to Production configuration.

A platform is not marked complete until its build, installation, functional tests, security checks, and owner acceptance evidence are recorded.

## 6. Current blockers / owner-controlled inputs

- Windows desktop shell has not yet been selected or implemented.
- Windows code-signing certificate and MSIX publisher identity are not yet confirmed.
- Windows EXE/MSIX CI workflows do not yet exist.
- Android workflow currently creates a debug APK, not a signed release AAB.
- Live authentication, two-user/two-workspace API isolation, and authenticated AI provider behavior remain release gates in the implementation status.
- The repository's Play Store pre-release checklist remains HOLD.
- Supported Windows versions, architectures, and public distribution channel require owner confirmation before final packaging.

## 7. Completion reporting format

For each platform report: status (Not started / In progress / Blocked / Passed), commit SHA, workflow run, artifact name and size, SHA-256, test devices/OS versions, passed/failed tests, open defects, and approval status.

**Release rule:** Do not describe the entire multi-platform release as complete while any platform or security gate remains unverified.
