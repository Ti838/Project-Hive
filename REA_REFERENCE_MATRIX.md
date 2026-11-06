# PROJECTHIVE: REA REFERENCE MATRIX & BENCHMARK INTELLIGENCE

**Document Version:** 2.0.0 (Reverse Engineering Analysis Master Reference)  
**System Scope:** End-to-End Enterprise University Collaboration, Incubation & Academic Platform  
**Target Architecture:** Next.js 16.3.3 App Router, React 19.2.8, Express 4.18.2, Supabase PostgreSQL, LiveKit Cloud SFU, Socket.IO 4.7.2.

---

## 1. Executive Reference Ecosystem Mapping

ProjectHive unifies eleven specialized industry leaders into a cohesive academic workspace. Each reference has been reverse engineered across its publicly observable information architecture, interaction patterns, API models, and data persistence models:

| Domain | Benchmark Product | Inspected Architecture & Capabilities | Concrete ProjectHive Implementation & Route |
| :--- | :--- | :--- | :--- |
| **Project & Issue Management** | **Linear** (`linear.app`) | Command palette (`Cmd+K`), keyboard navigation (`Cmd+B`), optimistic UI updates, multi-tier sprint milestones, cycle burndowns. | `frontend/src/components/layout/Sidebar.tsx`, `Topbar.tsx`, `TeamClassworkView.tsx`, `/teams/[id]` |
| **Developer Identity & Repos** | **GitHub** (`github.com`) | Commit frequency timeline, verified contributor activity, branch/PR linking, multi-repo showcase cards. | `frontend/src/components/profile/ProfileView.tsx`, `frontend/src/components/developer/CodeViewer.tsx` |
| **Knowledge Base & Wiki** | **Notion** (`notion.com`) | Clean full-bleed markdown documentation, nested action checklists, live persistent autosave, architecture RFC tabs. | `frontend/src/components/teams/TeamDocsView.tsx` |
| **Academic Mesh & LMS** | **Google Classroom** & **Canvas** | Course code linking, syllabus/lab track, sprint deliverables, submission drawer (GitHub/Drive/Demo), grading rubrics. | `frontend/src/components/teams/TeamClassworkView.tsx`, `teams/create/page.tsx` |
| **Realtime Team Chat** | **Slack** & **Discord** | Channel dual-dispatch, floating reaction docks, typing indicators, waveform audio players for voice notes. | `frontend/src/app/(app)/messages/page.tsx`, `VoiceMessagePlayer.tsx`, `ReactionDock.tsx` |
| **Conferencing & Video** | **Google Meet** & **LiveKit** | Selective Forwarding Unit (SFU), active speaker detection, minimized PIP call widget, collaborative canvas. | `frontend/src/components/calling/CallManager.tsx`, `MinimizedCallWidget.tsx` |
| **Multimodal AI Studio** | **Claude** & **Cursor** | Split-pane live artifact editor, multi-model routing cascade (Groq/Gemini/OpenRouter), voice prompt dictation. | `frontend/src/app/(app)/generator/page.tsx`, `HiveAIWorkspace.tsx`, `HiveAIComposer.tsx` |
| **Campus Community & Showcase**| **Product Hunt** & **LinkedIn**| Optimistic upvoting, rich media mosaic, nested threaded discussions, peer skill endorsement counters. | `frontend/src/app/(app)/feed/page.tsx`, `MediaMosaic.tsx`, `ThreadedComments.tsx`, `/showcase` |
| **Auth & Device Security** | **WorkOS** & **Clerk** | Split-screen login, Google PKCE OAuth, active session device management, 1-click remote token revocation. | `frontend/src/app/login/page.tsx`, `register/page.tsx`, `settings/page.tsx` |
| **Database & Identity Cloud** | **Supabase** (`supabase.com`) | PostgreSQL row-level security, auth session refresh, structured JSONB schema persistence, Singapore cluster. | `server/database/supabase.js`, `frontend/src/lib/api.ts` |
| **Visual Collaboration** | **Excalidraw** & **Miro** | Realtime socket whiteboard broadcast, freehand drawing, geometric shapes, sticky project cards. | `frontend/src/components/calling/CallManager.tsx` (In-call Whiteboard) |

---

## 2. Granular Reverse Engineering by Domain

### 2.1 Academic Workspace & Google Classroom (`classroom.google.com`)
- **Observed Architecture:**
  - Classrooms organize around Course Code, Section, Instructor, and Announcement stream.
  - Deliverables ("Classwork") have assigned dates, point values/rubrics, and distinct states: `Assigned`, `Turned In`, `Graded / Returned`.
  - Submissions accept file attachments, Google Drive URLs, and link attachments with timestamped audit logs.
- **ProjectHive Implementation:**
  - Integrated into [`TeamClassworkView.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/components/teams/TeamClassworkView.tsx).
  - Stored inside `teams.rules` JSON structure in PostgreSQL: `{ courseCode, instructor, sprintMilestones: [...], rubrics: [...], submissions: [...] }`.
  - Zero mock data: submissions and milestone statuses are saved immediately through `api.teams.update(teamId, { rules: updatedRules })`.

### 2.2 Notion Knowledge Base (`notion.com`)
- **Observed Architecture:**
  - Distraction-free document editing with live markdown preview.
  - Tabbed organizational structure separating Specs, Meeting Minutes, and Architectural RFCs.
  - Visual status pill indicating `Saved` or `Unsaved Changes` with autosave debounce.
- **ProjectHive Implementation:**
  - Integrated into [`TeamDocsView.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/components/teams/TeamDocsView.tsx).
  - Provides editable and markdown-rendered views with template pre-fills for System Architecture, Database Schemas, and Sprint Minutes.
  - Persists directly to backend database on edit with instant feedback toasts.

### 2.3 Linear Issue Tracking & Navigation (`linear.app` & `linear.app/mobile`)
- **Observed Architecture:**
  - Ultra-high keyboard ergonomics: `Cmd+B` toggles sidebar, `Cmd+K` launches unified command palette.
  - Mobile experience features bottom navigation with safe-area spacing and thumb-accessible bottom sheets instead of miniature desktop modals.
- **ProjectHive Implementation:**
  - [`AppShell.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/components/layout/AppShell.tsx) and [`MobileNav.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/components/layout/MobileNav.tsx) implement 5-tab thumb-reachable navigation (`Home`, `Feed`, `Chat`, `Teams`, `Profile`).
  - [`BottomSheet.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/components/ui/BottomSheet.tsx) handles mobile sheets with backdrop blur and touch drag handles.
  - [`FloatingActionButton.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/components/ui/FloatingActionButton.tsx) provides primary mobile trigger.

### 2.4 WorkOS Active Session Management (`workos.com`)
- **Observed Architecture:**
  - Displays authenticated user devices with OS name, browser family, IP address, and last active timestamp.
  - Allows users to revoke individual sessions or log out all other devices.
- **ProjectHive Implementation:**
  - Integrated in [`settings/page.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/app/(app)/settings/page.tsx) under the "Sessions" tab.
  - Queries active sessions via `api.users.getSessions()` and terminates them via `api.users.revokeSession(sessionId)`.

### 2.5 Developer & Competitive Coding Identity (GitHub, LeetCode, Devpost)
- **Observed Architecture:**
  - Developers validate their skills through verified external profiles (GitHub repos, LeetCode rank, Devpost hackathon prizes, Google Scholar citations).
- **ProjectHive Implementation:**
  - Integrated into [`ProfileView.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/components/profile/ProfileView.tsx) with high-contrast verified badges:
    - GitHub Contributor & Star counters
    - LeetCode / Codeforces competitive rank
    - Devpost Hackathon achievements
    - Google Scholar / ORCID research indicators
    - Real-time recruitment status toggle ("Open to Teammates")

---

## 3. Technology Matrix & Zero-Mock Guarantee

| Capability | Backend Service | API Endpoint | Frontend Component | Persistence Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Supabase Auth + Brevo SMTP | `POST /api/auth/login`, `POST /api/auth/register` | `login/page.tsx`, `register/page.tsx` | Supabase `auth.users` table |
| **Academic Mesh** | Express `teams.controller` | `PUT /api/teams/:id` | `TeamClassworkView.tsx` | PostgreSQL `teams.rules` JSON column |
| **Project Wiki** | Express `teams.controller` | `PUT /api/teams/:id` | `TeamDocsView.tsx` | PostgreSQL `teams.rules` JSON column |
| **Teammate Discovery** | Express `teams.controller` | `GET /api/teams?category=...` | `teams/page.tsx` | PostgreSQL `teams` & `team_members` |
| **Realtime Messaging**| Socket.IO 4.7.2 | `socket.emit("send_message")` | `messages/page.tsx` | PostgreSQL `messages` table |
| **WebRTC Audio/Video**| LiveKit Cloud SFU | `POST /api/calling/token` | `CallManager.tsx` | LiveKit Room API |
| **Multimodal AI** | Groq LPU + Gemini 2.0 Flash | `POST /api/ai/chat` | `HiveAIWorkspace.tsx` | Transient stream + local history |
| **User Settings** | Express `users.controller` | `PUT /api/users/settings` | `settings/page.tsx` | PostgreSQL `user_settings` |
| **Theme Synchronization**| DOM Engine + User API | `PUT /api/users/settings` | `ThemeContext.tsx` | `localStorage` + PostgreSQL |

