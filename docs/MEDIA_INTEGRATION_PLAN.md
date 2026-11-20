# BK-BusiCare provider integration plan

Status: implementation preparation only. No third-party media account is connected and no publishing or ad-spend action is enabled.

## Selected providers
- OpenAI: authenticated server-side content generation is being prepared in the `ai-content` Edge Function. Activation requires an owner-managed `OPENAI_API_KEY` secret and a configured exact-origin allowlist. Never put provider keys in browser code, `VITE_` variables, GitHub source, or chat.
- Facebook and Instagram: Meta app registration, business ownership/permissions, OAuth review where required, scoped Page/Instagram account authorization, token lifecycle handling, webhook verification, and publishing review are prerequisites.
- TikTok: developer app, account authorization, required Content Posting API scopes and review/approval are prerequisites.
- LinkedIn: developer application, member/organization permissions, OAuth scopes and product approval are prerequisites.
- YouTube: Google Cloud project, OAuth consent configuration, YouTube Data API enablement, quota review and channel authorization are prerequisites.
- Meta Ads: separate Ads API permissions, business/ad-account authorization, campaign review and explicit spend approval are required.
- Google Ads: developer token, OAuth consent, customer-account access and explicit campaign/budget approval are required.

## Required security model
1. OAuth authorization code flow with state and PKCE where supported; never collect account passwords.
2. Encrypt provider refresh/access tokens at rest in a server-only store. Never return tokens to the browser.
3. Validate webhook signatures and replay windows.
4. Enforce per-user/workspace quotas and audit every connection, publish, message and ad mutation.
5. Default to draft-only. Require a human confirmation for publishing, messaging, campaign creation, budget changes or spend.
6. Provide disconnect/revoke controls and token deletion.
7. Test with sandbox/test accounts before requesting production scopes.

## Release gates
- Provider app registrations and approvals completed by the account owner.
- Server-side secret storage and rotation verified.
- Per-provider least-privilege scopes documented.
- Cross-workspace isolation and authorization tests pass.
- Test-account publish flows pass without live ad spend.
- Explicit owner approval before enabling any production action.

## Current boundary
This repository change does not connect external accounts, publish content, send messages, create campaigns, or incur provider API usage. The selected providers are recorded as requirements only.
