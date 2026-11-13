# ProjectHive — REA Reference Matrix & Real-World Benchmark Intelligence

**Document Version:** 1.0.0  
**Phase:** Phase 0 & Phase 1 Foundation  
**Execution Lead:** AGENT 2 (Real-World Reverse Engineering Specialist) & AGENT 0 (Lead Architect)  
**Standard:** Strict Feature-by-Feature Reverse Engineering Analysis (REA Framework)  

---

## 1. Executive Reference Directory Mapping (All 47 Primary References)

ProjectHive reverse-engineers the interaction patterns, information architecture, and operational patterns of internationally recognized software products rather than relying on generic SaaS templates:

### A. University Project Discovery, Team Formation & Showcasing
1. **Devpost** (`devpost.com`): Hackathon participation, team submission forms, skill-based teammate requirements, project categories, and showcase presentation.
2. **GitHub** (`github.com`): Developer profiles, repository linking, issue tracking, commit timelines, team permissions, and tamper-proof audit trails.
3. **GitLab** (`gitlab.com`): Milestone tracking, issue boards, group permissions, and project activity ledgers.
4. **Kaggle** (`kaggle.com`): Community profiles, notebooks/projects showcases, upvoting models, and competition team matchmaking.
5. **Product Hunt** (`producthunt.com`): Product showcase aesthetics, optimistic upvoting mechanisms, and featured discovery feeds.

### B. Team Discovery & Professional Identity
6. **LinkedIn** (`linkedin.com`): Student academic identity, verified education, technical skill tags, peer endorsements, and connection requests.
7. **Upwork** (`upwork.com`): Verified skill matching, availability status, portfolio highlights, and structured proposal/pitch submissions.
8. **Contra** (`contra.com`): High-visual portfolio presentation, clean modern card layouts, and collaboration status indicators.

### C. Team Communication & Messaging
9. **Slack** (`slack.com`): Workspaces, channel clustering, direct messaging, message reaction popovers, presence indicators, and unread badges.
10. **Discord** (`discord.com`): Room-scoped channels, active voice/video rooms, role badges, member rosters, and clipboard image pasting.
11. **WhatsApp** (`whatsapp.com`): Real-time delivery state receipts (`sent` single check → `delivered` double check → `read` blue check), voice note playback, and zero-distraction layout.
12. **Telegram** (`telegram.org`): Multi-device session audit management, active sessions revocation, and fast message sync.

### D. Project Management & Incubation
13. **Linear** (`linear.app`): Keyboard navigation (`Cmd+K`, `Cmd+B`), high-density dark mode, issue state machines (`Todo`, `In Progress`, `Review`, `Done`), and cycle burndowns.
14. **Trello** (`trello.com`): Drag-and-drop Kanban card physics, checklists, due date alerts, and assignee badges.
15. **Asana** (`asana.com`): Milestone dependencies, team workload visibility, and sprint deliverable tracking.
16. **Notion** (`notion.com`): Full-bleed Markdown documentation wikis, nested task blocks, and persistent real-time autosave.
17. **ClickUp** (`clickup.com`): Multi-view workspace architecture (List, Board, Timeline), priority tags, and goal progress metrics.
18. **Miro** (`miro.com`): Real-time collaborative whiteboard canvas, freehand annotations, and sticky notes for brainstorming.

### E. Audio, Video & Screen Sharing
19. **Google Meet** (`meet.google.com`): Clean meeting controls, active speaker detection, device switching, and network resilience.
20. **Zoom** (`zoom.us`): Multi-participant video grids, screen-sharing optimization for code legibility, and host participant controls.
21. **Microsoft Teams** (`teams.microsoft.com`): Meeting-in-channel paradigm, integrated meeting notes, and screen-sharing permissions.
22. **LiveKit** (`livekit.io`): WebRTC Selective Forwarding Unit (SFU), dynamic adaptive bitrate streaming, cryptographic room token minting, and connection quality indicators.
23. **Jitsi** (`jitsi.org`): Open-source conferencing patterns, room naming conventions, and low-latency audio pipelines.

### F. Authentication & Account Security
24. **Clerk** (`clerk.com`): Split-screen authentication layouts, multi-factor OTP verification, session management, and password strength indicators.
25. **WorkOS** (`workos.com`): Active device session inspection, remote token revocation, and enterprise identity isolation.
26. **Auth0** (`auth0.com`): Role-based access control (RBAC), token rotation, and sliding-window rate limiters.
27. **Google Account** (`myaccount.google.com`): Connected device lists with OS, browser, IP, location map, and one-click security kill switches.

### G. AI Product Experience & Interaction
28. **ChatGPT** (`chatgpt.com`): Conversational message streaming, markdown code formatting with copy triggers, and prompt history.
29. **Claude** (`claude.ai`): Long-form structured document generation, system architecture blueprints, and ethical guardrails.
30. **Gemini** (`gemini.google.com`): Multimodal reasoning, architectural diagram understanding, and visual prompt evaluation.
31. **Perplexity** (`perplexity.ai`): Structured research synthesis, citation-backed answers, and follow-up query suggestions.
32. **LangChain** (`langchain.com`): Provider routing, cascading fallback orchestration, and context injection pipelines.

### H. Design Systems & Frontend Quality
33. **Linear Design** (`linear.app`): Pitch-black obsidian surfaces (`#0B0F17`), amber glowing accents (`#F59E0B`), micro-interactions, and tight typography.
34. **Vercel** (`vercel.com`): Minimalist dashboard hierarchy, live status dots, and crisp 1px borders.
35. **Stripe** (`stripe.com`): Error state handling, clear validation feedback, and accessible form inputs.
36. **Radix UI** (`radix-ui.com`): Accessible primitives (Dialogs, Popovers, Tabs, Dropdowns, Tooltips) with full keyboard navigation.
37. **shadcn/ui** (`ui.shadcn.com`): Reusable component architecture and clean theme consistency.
38. **Tailwind CSS** (`tailwindcss.com`): Consistent spacing tokens, responsive breakpoint discipline, and dark mode tokens.
39. **Mobbin** (`mobbin.com`): Mobile interaction flows, bottom sheets, navigation rails, and thumb-zone ergonomics.
40. **Figma** (`figma.com`): Design tokens, component variants, and interactive prototyping.

### I. Admin Portal & Operational Governance
41. **Discord Server Admin** (`discord.com`): Granular role permissions, user kick/ban workflows, and audit logging.
42. **GitHub Org Admin** (`github.com`): Organization membership management, repository access rights, and security logs.
43. **Supabase Dashboard** (`supabase.com`): Relational data inspection, Row Level Security policies, and storage bucket controls.
44. **Cloudflare Dashboard** (`cloudflare.com`): Security challenge triggers (Turnstile), traffic analytics, and edge rate-limiting.
45. **Sentry** (`sentry.io`): Production error tracking, stack trace inspection, and alert thresholds.
46. **Grafana** (`grafana.com`): Telemetry dashboards, system health probes, and uptime visualization.
47. **Vercel Administration** (`vercel.com`): Deployment logs, environment secret isolation, and edge runtime monitoring.

---

## 2. Granular REA Adaptation Matrix for ProjectHive

| ProjectHive Feature | Primary Reference | Inspected Pattern | Concrete ProjectHive Adaptation |
|---|---|---|---|
| **Public Landing Page** | Linear & Vercel | Dark obsidian canvas with ambient glow, interactive product preview, feature bento grid. | Implemented in `frontend/src/app/page.tsx` with high-contrast `#0B0F17` surfaces, amber `#F59E0B` glows, and zero synthetic claims. |
| **Authentication Flow** | Clerk & WorkOS | Split-screen layout: left branding testimonial, right streamlined form with strength meter. | Implemented in `/register` & `/login` with Zod validation, Turnstile bot check, and 12-round bcrypt. |
| **Device Intelligence** | Google Account & WorkOS | Active session cards with OS, browser, IP, location, and one-click remote revocation. | Implemented in `/settings` (Sessions tab) & `user_sessions` table with SHA-256 token hashing. |
| **Squad Discovery** | Devpost & Wellfound | Filter sidebar (category, department, campus), needed-role badges, one-click pitch application. | Implemented in `/teams` with real-time text search and open vacancy badges (`Looking for: 1 Backend Dev`). |
| **Squad Workspace** | Discord & GitHub | Private squad room with tabs, role badges, and slide-out applicant evaluation drawer. | Implemented in `/teams/[id]` with role-guarded applicant review drawer. |
| **Kanban Task Board** | Linear & Trello | 4-column drag-and-drop state machine (`Todo`, `In Progress`, `Review`, `Done`), priority tags. | Implemented in `/projects/[id]/development` with HTML5 drag-and-drop and PostgreSQL task persistence. |
| **Real-Time Chat** | WhatsApp & Discord | Split-view layout, optimistic updates, 3-tier delivery ticks (`sent` → `delivered` → `read`), screenshot paste. | Implemented in `/messages` using Socket.IO 4.x room-scoped clusters and Supabase attachment storage. |
| **Video Meetings** | LiveKit & Google Meet | Embedded WebRTC room with dynamic adaptive bitrate, screen share, and floating ambient PiP widget. | Implemented in `CallManager.tsx` & `MinimizedCallWidget.tsx` powered by LiveKit Cloud SFU. |
| **HiveMind AI Copilot** | Groq & Gemini | Sub-second prompt-to-blueprint generation, cascading fallback, voice dictation. | Implemented in `/generator` with Groq Llama 3.3 70B, Google Gemini 2.5 Flash, and Web Speech API. |
| **Admin Command Center** | GitHub Org & Discord Admin | Live telemetry, user deep-inspection drawer, remote device termination, content moderation queue. | Implemented in `/admin/dashboard` & `/admin/users` with authentic database-driven metrics. |

