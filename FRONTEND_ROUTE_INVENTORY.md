# PROJECTHIVE: COMPLETE FRONTEND ROUTE INVENTORY (37 Core Routes)

**Audit Date:** 2026-11-06  
**Auditor:** Principal Frontend Architect & Senior Next.js 16 Engineer  
**Framework:** Next.js 16.3.3 App Router with React 19.2.8 & Webpack

---

## 1. Master Route Directory

| # | Route Path | Layout / Gate | Primary Component / File | Purpose & Capabilities | Status |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **1** | `/` | Public Landing | `frontend/src/app/page.tsx` | Bento Hero, Feature preview, Testimonials, CTA, Footer. | `VERIFIED` |
| **2** | `/login` | Public Auth | `frontend/src/app/login/page.tsx` | Split-screen login, Google PKCE OAuth, inline unverified resend. | `VERIFIED` |
| **3** | `/register` | Public Auth | `frontend/src/app/register/page.tsx` | Progressive registration with password strength gauge. | `VERIFIED` |
| **4** | `/verify-email` | Public Auth | `frontend/src/app/verify-email/page.tsx` | 6-digit OTP verification with 60s cooldown resend. | `VERIFIED` |
| **5** | `/forgot-password` | Public Auth | `frontend/src/app/forgot-password/page.tsx` | Password reset request with email verification link. | `VERIFIED` |
| **6** | `/reset-password` | Public Auth | `frontend/src/app/reset-password/page.tsx` | Secure new password creation with confirmation token. | `VERIFIED` |
| **7** | `/terms` | Public Legal | `frontend/src/app/terms/page.tsx` | Official Terms of Service & University Code of Conduct. | `VERIFIED` |
| **8** | `/privacy` | Public Legal | `frontend/src/app/privacy/page.tsx` | Data Privacy Policy, GDPR compliance, zero-leak AI rules. | `VERIFIED` |
| **9** | `/auth/callback` | Auth Callback | `frontend/src/app/auth/callback/page.tsx` | OAuth redirect handler exchange and session token hydration. | `VERIFIED` |
| **10**| `/dashboard` | AppShell | `frontend/src/app/(app)/dashboard/page.tsx` | User hub, active squad milestones, upcoming sprint tasks. | `VERIFIED` |
| **11**| `/feed` | AppShell | `frontend/src/app/(app)/feed/page.tsx` | Campus social feed, media mosaic, 6-reaction dock, polls. | `VERIFIED` |
| **12**| `/messages` | AppShell (Internal Scroll) | `frontend/src/app/(app)/messages/page.tsx` | Socket.IO realtime messaging, audio visualizer, file shares. | `VERIFIED` |
| **13**| `/teams` | AppShell | `frontend/src/app/(app)/teams/page.tsx` | Squad discovery, skill chips, Capstone track filters. | `VERIFIED` |
| **14**| `/teams/create` | AppShell | `frontend/src/app/(app)/teams/create/page.tsx` | Squad creation wizard with Academic Coursework tagger. | `VERIFIED` |
| **15**| `/teams/[id]` | AppShell | `frontend/src/app/(app)/teams/[id]/page.tsx` | Squad workspace: Classwork/Sprints, Docs Wiki, Chat. | `VERIFIED` |
| **16**| `/projects` | AppShell | `frontend/src/app/(app)/projects/page.tsx` | Project directory, tags, tech stacks, GitHub repo links. | `VERIFIED` |
| **17**| `/projects/[id]/development` | AppShell | `frontend/src/app/(app)/projects/[id]/development/page.tsx` | GitHub code review, commit history, branch/PR inspections. | `VERIFIED` |
| **18**| `/showcase` | AppShell | `frontend/src/app/(app)/showcase/page.tsx` | Product Hunt-grade student project showcase with upvotes. | `VERIFIED` |
| **19**| `/people` | AppShell | `frontend/src/app/(app)/people/page.tsx` | Campus student discovery, department, and skill filters. | `VERIFIED` |
| **20**| `/friends` | AppShell | `frontend/src/app/(app)/friends/page.tsx` | Peer network, connection requests, pending invites. | `VERIFIED` |
| **21**| `/profile` | AppShell | `frontend/src/app/(app)/profile/page.tsx` | Authenticated user profile with verified developer badges. | `VERIFIED` |
| **22**| `/profile/[id]` | AppShell | `frontend/src/app/(app)/profile/[id]/page.tsx` | Dynamic student profile, portfolio, skill endorsements. | `VERIFIED` |
| **23**| `/profile/view` | AppShell | `frontend/src/app/(app)/profile/view/page.tsx` | Public profile preview mode. | `VERIFIED` |
| **24**| `/saved` | AppShell | `frontend/src/app/(app)/saved/page.tsx` | Bookmarked projects, posts, and reference snippets. | `VERIFIED` |
| **25**| `/notifications`| AppShell | `frontend/src/app/(app)/notifications/page.tsx` | Activity alerts, squad invitations, milestone reminders. | `VERIFIED` |
| **26**| `/generator` | AppShell (Internal Scroll) | `frontend/src/app/(app)/generator/page.tsx` | HiveMind AI Studio, voice dictation, live artifact canvas. | `VERIFIED` |
| **27**| `/help` | AppShell | `frontend/src/app/(app)/help/page.tsx` | Help Center, Knowledge Base FAQ, 2-way ticket ledger. | `VERIFIED` |
| **28**| `/settings` | AppShell | `frontend/src/app/(app)/settings/page.tsx` | 8-tab settings, active devices revocation, GDPR export. | `VERIFIED` |
| **29**| `/admin` | DesktopGate | `frontend/src/app/admin/page.tsx` | Redirects to `/admin/dashboard`. | `VERIFIED` |
| **30**| `/admin/login` | DesktopGate | `frontend/src/app/admin/login/page.tsx` | Dedicated Admin login checking live database role. | `VERIFIED` |
| **31**| `/admin/dashboard` | DesktopGate + Layout | `frontend/src/app/admin/dashboard/page.tsx` | System KPIs, hardware telemetry, server health metrics. | `VERIFIED` |
| **32**| `/admin/users` | DesktopGate + Layout | `frontend/src/app/admin/users/page.tsx` | Paginated user management, strikes issuance, ban/unban. | `VERIFIED` |
| **33**| `/admin/moderation`| DesktopGate + Layout | `frontend/src/app/admin/moderation/page.tsx` | Content report queue, post moderation, resolutions. | `VERIFIED` |
| **34**| `/admin/teams` | DesktopGate + Layout | `frontend/src/app/admin/teams/page.tsx` | Squad oversight, capstone track inspection, disband. | `VERIFIED` |
| **35**| `/admin/system` | DesktopGate + Layout | `frontend/src/app/admin/system/page.tsx` | Platform feature flags, maintenance mode toggle. | `VERIFIED` |
| **36**| `/admin/audit` | DesktopGate + Layout | `frontend/src/app/admin/audit/page.tsx` | Immutable administrative audit log viewer. | `VERIFIED` |
| **37**| `/admin/support` | DesktopGate + Layout | `frontend/src/app/admin/support/page.tsx` | Zendesk-grade support inbox, private notes, ticket states. | `VERIFIED` |
