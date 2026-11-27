# BK-BusiCare One — 10-Folder Dashboard UI/UX Development Specification

## Status
- Implementation branch: `feature/approved-10-folder-dashboard`
- Pull request: #27
- Scope: authenticated workspace dashboard and responsive navigation
- Production release: not approved; merge and deployment are intentionally withheld pending review and device QA.

## Visual system
- Primary surfaces: navy blue (`#081a32`, `#173d65`)
- Accent: muted gold (`#d0a650`, `#f1d58f`)
- Cards: off-white / warm white
- Layout: mobile-first, two-column folder grid where space permits, one column on very narrow screens
- Interaction: semantic buttons, visible labels, keyboard-operable folder navigation, active bottom-navigation state

## Ten dashboard folders
1. AI Tools — AI Content Studio and draft generation
2. Marketing — campaign workspace, leads and content planner
3. SEO Growth — reserved SEO workspace; integrations are not yet connected
4. Freelancing — reserved profile, portfolio and proposal workspace
5. Training — reserved courses and learning progress workspace
6. Projects — reserved projects, tasks and milestones workspace
7. E-commerce — reserved store, product and order workspace
8. Team — existing workspace member and invitation workflow
9. Profile — signed-in account and workspace information
10. Settings — account, workspace and security information

## Navigation
- Desktop/tablet: folder cards and workspace navigation remain in the authenticated portal.
- Mobile: fixed five-item quick navigation — Home, AI Tools, Marketing, SEO, More.
- The More view links to Leads, Team, Profile and Settings.
- Folder cards navigate to their corresponding page routes without bypassing authentication.

## Existing workflows preserved
- Leads: existing workspace-scoped lead creation and listing.
- Content Planner: existing draft creation and listing.
- AI Content Studio: authenticated AI draft request and save-to-planner flow.
- Team: existing member list and invitation controls.
- Workspace switching and sign-out remain available.

## Security boundaries
- No database schema, RLS policy, authentication provider, secret, or production environment setting is changed by this UI work.
- Existing Supabase workspace scoping and RLS remain the authorization boundary.
- UI visibility is not a substitute for server-side authorization.
- AI content remains a draft; this dashboard does not auto-publish posts or initiate ad spend.
- Placeholder folders must not imply that live third-party integrations are active.

## Verification checklist
- [x] JavaScript syntax check passes on the implementation commit.
- [x] Existing migration/static test suite passes in CI.
- [x] Production Vite bundle builds in CI.
- [x] Android debug APK builds and is uploaded as a CI artifact.
- [ ] Disposable local Supabase migrations and pgTAP RLS isolation suite complete.
- [ ] Install and verify on a physical Android device.
- [ ] Verify tablet and desktop breakpoints.
- [ ] Verify folder navigation, keyboard focus, and narrow-screen overflow.
- [ ] Verify existing sign-in, workspace switch, leads, content, AI draft, team and sign-out flows.
- [ ] Review accessibility contrast and screen-reader labels.
- [ ] Product owner approval before merge and production deployment.

## Release policy
This pull request remains a draft until all required CI checks pass and manual device QA is recorded. A successful debug APK build is not equivalent to a tested production release.
