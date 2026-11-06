# 05: COMPLETE ROUTE & PAGE INVENTORY

> **Document Classification:** Granular Page-by-Page & Route Forensic Inventory  
> **Total Frontend Pages:** 33 `page.tsx` route files (35 total Next.js endpoints)  
> **Extraction Evidence Level:** `[VERIFIED]` Code Inspection & Build Log Analysis  

---

## 1. Master Route Directory Table

| # | Exact Route Path | File System Path | Access Level | Layout Wrapper | Status |
|---|---|---|---|---|---|
| 1 | `/` | `frontend/src/app/page.tsx` | Public | RootLayout | FULLY WORKING |
| 2 | `/login` | `frontend/src/app/login/page.tsx` | Public (Guest) | RootLayout | FULLY WORKING |
| 3 | `/register` | `frontend/src/app/register/page.tsx` | Public (Guest) | RootLayout | FULLY WORKING |
| 4 | `/forgot-password` | `frontend/src/app/forgot-password/page.tsx` | Public (Guest) | RootLayout | FULLY WORKING |
| 5 | `/reset-password` | `frontend/src/app/reset-password/page.tsx` | Public (Token-Gated) | RootLayout | FULLY WORKING |
| 6 | `/verify-email` | `frontend/src/app/verify-email/page.tsx` | Public (Token-Gated) | RootLayout | FULLY WORKING |
| 7 | `/auth/callback` | `frontend/src/app/auth/callback/page.tsx` | Public (OAuth Callback) | RootLayout | FULLY WORKING |
| 8 | `/dashboard` | `frontend/src/app/(app)/dashboard/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 9 | `/feed` | `frontend/src/app/(app)/feed/page.tsx` | Authenticated / Browsable | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 10 | `/messages` | `frontend/src/app/(app)/messages/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 11 | `/teams` | `frontend/src/app/(app)/teams/page.tsx` | Authenticated / Browsable | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 12 | `/teams/create` | `frontend/src/app/(app)/teams/create/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 13 | `/teams/[id]` | `frontend/src/app/(app)/teams/[id]/page.tsx` | Authenticated (Dynamic) | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 14 | `/projects` | `frontend/src/app/(app)/projects/page.tsx` | Authenticated / Browsable | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 15 | `/showcase` | `frontend/src/app/(app)/showcase/page.tsx` | Authenticated / Browsable | AuthenticatedLayout -> AppShell (Alias) | FULLY WORKING |
| 16 | `/projects/[id]/development` | `frontend/src/app/(app)/projects/[id]/development/page.tsx` | Authenticated (Dynamic) | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 17 | `/people` | `frontend/src/app/(app)/people/page.tsx` | Authenticated / Browsable | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 18 | `/friends` | `frontend/src/app/(app)/friends/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell (Alias) | FULLY WORKING |
| 19 | `/generator` | `frontend/src/app/(app)/generator/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 20 | `/saved` | `frontend/src/app/(app)/saved/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 21 | `/notifications` | `frontend/src/app/(app)/notifications/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 22 | `/profile` | `frontend/src/app/(app)/profile/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 23 | `/profile/view` | `frontend/src/app/(app)/profile/view/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell (Alias) | FULLY WORKING |
| 24 | `/profile/[id]` | `frontend/src/app/(app)/profile/[id]/page.tsx` | Authenticated (Dynamic) | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 25 | `/settings` | `frontend/src/app/(app)/settings/page.tsx` | Authenticated | AuthenticatedLayout -> AppShell | FULLY WORKING |
| 26 | `/admin` | `frontend/src/app/admin/page.tsx` | Admin Role + Desktop Gate | DesktopGate -> AdminLayout | FULLY WORKING |
| 27 | `/admin/dashboard` | `frontend/src/app/admin/dashboard/page.tsx` | Admin Role + Desktop Gate | Redirects -> `/admin` | FULLY WORKING |
| 28 | `/admin/login` | `frontend/src/app/admin/login/page.tsx` | Public (Admin Entrance) | DesktopGate | FULLY WORKING |
| 29 | `/admin/users` | `frontend/src/app/admin/users/page.tsx` | Admin Role + Desktop Gate | DesktopGate -> AdminLayout | FULLY WORKING |
| 30 | `/admin/moderation`| `frontend/src/app/admin/moderation/page.tsx` | Admin Role + Desktop Gate | DesktopGate -> AdminLayout | FULLY WORKING |
| 31 | `/admin/teams` | `frontend/src/app/admin/teams/page.tsx` | Admin Role + Desktop Gate | DesktopGate -> AdminLayout | FULLY WORKING |
| 32 | `/admin/system` | `frontend/src/app/admin/system/page.tsx` | Admin Role + Desktop Gate | DesktopGate -> AdminLayout | FULLY WORKING |
| 33 | `/admin/audit` | `frontend/src/app/admin/audit/page.tsx` | Admin Role + Desktop Gate | DesktopGate -> AdminLayout | FULLY WORKING |

---

## 2. Granular Page-by-Page Technical Breakdown

### Page 1: Landing Page (`/`)
- **Route:** `/` (`frontend/src/app/page.tsx`)
- **Purpose:** Public introductory landing page showcasing platform value proposition, animated product demonstrations, feature workflows, and student calls-to-action.
- **Access Level:** Public.
- **Components:** `SmoothScroll`, `Navbar`, `Hero`, `ProductStory`, `FeaturesSequence`, `Workflow`, `Showcase`, `CTA`.
- **User Actions:**
  - Click "Launch Workspace" -> navigates to `/dashboard` (if authenticated) or `/login`.
  - Click "Join as Student" -> navigates to `/register`.
  - Explore interactive 3D Three.js canvas in `Showcase.tsx`.
- **API Calls:** Public stats endpoint `GET /api/stats` to render dynamic user/team/project counters.
- **Responsive Behavior:** Full mobile responsiveness with collapsible mobile drawer menu.

---

### Page 2: Sign In Page (`/login`)
- **Route:** `/login` (`frontend/src/app/login/page.tsx`)
- **Purpose:** Student authentication entrance supporting email/password credentials and Google OAuth PKCE single sign-on.
- **Access Level:** Public (Guest).
- **Form Fields:** `email` (string, university format), `password` (string).
- **Buttons & Behaviors:**
  - "Sign In with Google": Calls `api.auth.googleInitiate()`, receives Google OAuth authorization URL, redirects user.
  - "Sign In" (Submit): Calls `getExactDeviceDetails()` for device fingerprinting, then posts to `api.auth.login(email, password, deviceMeta)`. Upon 200 OK, invokes `useAuthStore.getState().login(user, accessToken, refreshToken)` and pushes `/dashboard`.
- **Error States:** Renders inline banner alert (`serverError`) on 401 Unauthorized or unverified email.

---

### Page 3: Student Registration Page (`/register`)
- **Route:** `/register` (`frontend/src/app/register/page.tsx`)
- **Purpose:** New student account registration with institutional university selection.
- **Access Level:** Public (Guest).
- **Form Fields:** `first_name`, `last_name`, `email`, `university` (dropdown autocomplete populated by `BANGLADESH_UNIVERSITIES`), `password`, `confirm_password`.
- **Validation:** Enforces name length, valid university email syntax, min 6 password chars, password match assertion via Zod.
- **API Calls:** `POST /api/auth/register`. On success, automatically logs in user or redirects to verification prompt based on system flags.

---

### Page 4: Student Dashboard (`/dashboard`)
- **Route:** `/dashboard` (`frontend/src/app/(app)/dashboard/page.tsx`)
- **Purpose:** Personalized command center showing campus vital metrics, joined squads, active projects, recommended teammates, and recent feed activity.
- **Access Level:** Authenticated Student / Faculty / Admin.
- **Layout Structure:** Multi-column responsive grid with KPI stat cards, quick-action navigation pills, and dynamic activity feed.
- **Components:** `StatCard` (with micro-sparklines and positive trend indicators), `QuickAction`, `TeamCard`, `FeedSnippet`.
- **API Calls:**
  - `GET /api/stats`
  - `GET /api/teams/my-teams`
  - `GET /api/projects`
  - `GET /api/users/recommended`
- **Loading & Empty States:** Skeleton pulse loaders during data fetching; displays callout banner prompting user to create a team when `teamsCount === 0`.

---

### Page 5: Campus Social Feed (`/feed`)
- **Route:** `/feed` (`frontend/src/app/(app)/feed/page.tsx`)
- **Purpose:** Academic activity feed supporting project announcements, milestone celebrations, rich code snippets, interactive polls, and multi-image galleries.
- **Access Level:** Authenticated Student / Faculty / Admin.
- **Components:**
  - `PostComposerModal`: Multi-mode post composer supporting text, code snippets (with syntax highlighting), multi-image uploads (HTML5 canvas client-side compression), and multi-choice polls.
  - `PostCard`: Individual post renderer with inline formatted text, clickable hashtags, and media gallery.
  - `MediaMosaic`: Adaptive photo grid (1, 2, 3, 4+ layout).
  - `ReactionDock`: Facebook/LinkedIn-style floating reaction selector (`like`, `love`, `care`, `haha`, `wow`, `sad`, `angry`, `celebrate`, `insightful`, `fire`, `support`).
  - `ThreadedComments`: Nested discussion threads with replies, editing, and deletion.
  - `ReactionListModal`: Tabbed modal displaying users grouped by reaction type.
- **API Calls:**
  - `GET /api/posts?page=1&limit=20&sortBy=recent`
  - `POST /api/posts`
  - `POST /api/posts/:id/react`
  - `POST /api/posts/:id/comments`
  - `POST /api/posts/:id/poll/vote`
  - `POST /api/posts/:id/save`
- **Real-Time Integration:** Listens to Socket.IO events for live comment insertion and reaction counter updates.

---

### Page 6: Unified Messaging Studio (`/messages`)
- **Route:** `/messages` (`frontend/src/app/(app)/messages/page.tsx`)
- **Purpose:** Telegram/WhatsApp-grade real-time messaging interface supporting Direct Messages (DMs) and Squad Channels.
- **Access Level:** Authenticated.
- **Layout:** Master-detail split layout (left: conversation list; right: active conversation viewport).
- **User Actions & Features:**
  - Send text messages, image attachments, voice notes (recorded via MediaRecorder API), and code blocks.
  - Floating emoji reaction dock on individual messages (`message:react`).
  - Message status checks: Sent (single check), Delivered (double gray check), Read (double cyan check).
  - Pinned conversations (`/messages/conversations/:roomId/pin`).
  - Voice Message Player with interactive waveform visualizer and scrub bar.
  - In-header Call Trigger: Initiates direct LiveKit video or voice call with callee.
- **API & Socket Operations:**
  - `GET /api/messages/conversations`
  - `GET /api/messages/:friendIdOrRoomId`
  - Socket emissions: `join:room`, `leave:room`, `message:send`, `typing:start`, `typing:stop`, `message:read`, `message:ack_delivered`.

---

### Page 7: Squads & Communities Hub (`/teams`)
- **Route:** `/teams` (`frontend/src/app/(app)/teams/page.tsx`)
- **Purpose:** Squad discovery directory where students search for open teams, filter by engineering discipline, view required skill tags, and submit recruitment applications.
- **Access Level:** Authenticated.
- **Tabs:** "Open Squads" (teams seeking members), "Campus Communities" (interest hubs), "My Squads" (teams where user is leader or member).
- **Modals:** `JoinRequestModal`: Opens application form allowing applicant to write a custom motivation statement and link their portfolio.
- **API Calls:**
  - `GET /api/teams?type=team&search=...&category=...`
  - `GET /api/teams/my-teams`
  - `POST /api/teams/:id/join`

---

### Page 8: Squad Collaborative Workspace (`/teams/[id]`)
- **Route:** `/teams/[id]` (`frontend/src/app/(app)/teams/[id]/page.tsx`)
- **Purpose:** High-fidelity team headquarters combining squad overview, member rosters, group chat, and administrative controls.
- **Access Level:** Dynamic route; viewable by public/students; chat and admin tabs restricted to active team members and leader.
- **Tabs:**
  1. `Overview`: Mission statement, required skills, member cards, and open recruitment positions.
  2. `Chat`: Squad-wide real-time group chat channel (`room_id = team_<id>`).
  3. `Settings` (Leader Only): Edit team description, toggle open hiring status, update required skills, kick members (`DELETE /api/teams/:id/members/:memberId`), and transfer leadership (`POST /api/teams/:id/transfer-leadership`).
- **In-Header Call Button:** "Start Squad Call" initiates a group LiveKit video session and broadcasts `call:group` to all online members.

---

### Page 9: Showcase & Project Discovery (`/showcase` & `/projects`)
- **Route:** `/projects` (aliased by `/showcase`)
- **Purpose:** ProductHunt-grade exhibition of student projects, hackathon prototypes, and research tools.
- **Access Level:** Authenticated / Publicly Browsable.
- **Key Features:**
  - ProductHunt Upvoting (`POST /api/projects/:id/upvote`): Increases vote tally with instantaneous optimistic UI update.
  - Category Pills: Filter by "Trending on Campus", "Web & Mobile", "AI & Machine Learning", "Hardware & IoT", "Open Source Tools".
  - "Submit Project" Modal: Allows students to submit title, description, category, tech stack tags, interactive demo URL, and GitHub repository URL.

---

### Page 10: GitHub Developer Workspace (`/projects/[id]/development`)
- **Route:** `/projects/[id]/development` (`frontend/src/app/(app)/projects/[id]/development/page.tsx`)
- **Purpose:** Deep GitHub repository exploration and AI-assisted code review console embedded directly in ProjectHive.
- **Access Level:** Authenticated.
- **Sub-Views / Tabs:**
  1. `Overview`: Project health score (0–100 calculated from commits, test coverage, PR velocity), repository stars, forks, and rendered README.md viewer (`ReadmeViewer.tsx`).
  2. `Code`: Interactive file tree explorer with blob viewer and syntax highlighting (`CodeViewer.tsx`).
  3. `Commits`: Commit history log with author avatars, commit SHAs, and timestamp records (`CommitsView.tsx`).
  4. `Issues`: Open and closed GitHub issue tracker (`IssuesView.tsx`).
  5. `Pull Requests`: PR review console with diff inspection and one-click "Request AI Code Review" modal (`AiPrReviewModal.tsx`).
  6. `CI/CD`: GitHub Actions workflow run monitor showing build status, pass/fail badges, and run durations (`CiCdPipelineView.tsx`).

---

### Page 11: HiveMind AI Studio (`/generator`)
- **Route:** `/generator` (`frontend/src/app/(app)/generator/page.tsx`)
- **Purpose:** Centralized artificial intelligence studio providing 11 specialized software engineering capabilities.
- **Access Level:** Authenticated.
- **Components:** `HiveAIWorkspace`, `HiveAIComposer`, `HiveAICapabilities`, `HiveAIMessage`, `HiveAIContextRail`, `HiveAIArtifact`.
- **Capabilities Supported:**
  1. `project_generator`: Comprehensive architecture blueprints and MVP roadmaps.
  2. `idea_analyzer`: Evaluates problem-solution fit and market novelty.
  3. `project_critic`: Brutal Red Team critique highlighting fatal security or scale flaws.
  4. `research_assistant`: Literature review and technical citations.
  5. `documentation_ai`: Generates production READMEs and API references.
  6. `code_assistant`: Bug diagnosis, syntax correction, and refactoring.
  7. `architecture_design`: Database schema design (PostgreSQL/Supabase) and microservice topology.
  8. `project_health`: Automated audit of repo architecture and CI/CD pipelines.
  9. `team_ai`: Team velocity analysis and role allocation advice.
  10. `career_ai`: Resume tailoring and technical interview coaching.
  11. `copilot_chat`: General conversational engineering pair programmer.
- **Speech Integration:** Native Web Speech API STT mic button and TTS audio playback speaker button.

---

### Page 12: Student Directory (`/people` & `/friends`)
- **Route:** `/people` (aliased by `/friends`)
- **Purpose:** Student talent discovery engine with granular multi-facet filtering.
- **Access Level:** Authenticated.
- **Filter Facets:** Major (CSE, EEE, SE, BBA, Data Science), University Campus (BUET, DU, SMUCT, NSU, BRAC, etc.), and Technical Skills (React, Python, Node, AI/ML, etc.).
- **User Cards:** Displays avatar, university, department, skill tags with peer endorsements, online presence badge, and dynamic relationship action button (Connect, Cancel Request, Accept, Message, Follow).

---

### Page 13: Student Profile View & Edit (`/profile` & `/profile/[id]`)
- **Route:** `/profile` (own profile) and `/profile/[id]` (public peer profile)
- **Purpose:** LinkedIn/GitHub-grade student portfolio displaying academic credentials, bio, verified university badge, project portfolio, skill endorsements, and contact links.
- **Access Level:** Authenticated.
- **Features:**
  - Avatar & Banner Upload: Uses offscreen HTML5 canvas client-side resizing and compression (< 150 KB JPEG) before storage upload.
  - Skill Endorsement: Peers can click the thumbs-up icon on any skill tag to increment endorsement tallies (`POST /api/users/:userId/skills/:skillId/endorse`).
  - Mutual Friends Counter: Resolves shared friendships through `GET /api/friends/mutual/:userId`.
  - Relationship Action Engine: Dynamic button rendering based on friendship state (`SELF`, `FRIEND`, `REQUEST_SENT`, `REQUEST_RECEIVED`, `NOT_FRIEND`, `BLOCKED`).

---

### Page 14: Settings & Privacy Center (`/settings`)
- **Route:** `/settings` (`frontend/src/app/(app)/settings/page.tsx`)
- **Purpose:** Student account configuration, security credentials, active session tracking, and notification preferences.
- **Access Level:** Authenticated.
- **Tabs:** Profile Details, Privacy Controls (public/private profile toggle), Password Security (current/new password change), Active Sessions (device models, browsers, IP ranges), AI Studio Preferences (enable/disable HiveMind copilot), and Notification Toggles.

---

### Page 15: Administrative Overview & Telemetry (`/admin`)
- **Route:** `/admin` (`frontend/src/app/admin/page.tsx`)
- **Purpose:** Master command center for institutional moderators and system administrators.
- **Access Level:** Restricted to users with `role = 'admin'` accessing via desktop workstations (enforced by `DesktopGate`).
- **Telemetry Indicators:**
  - Active WebSocket connections gauge.
  - Database roundtrip latency monitor (in milliseconds).
  - CPU usage and memory utilization sparklines.
  - Client hardware badge: Displays real client IP, WebGL GPU chipset, and OS.
  - System Vital KPIs: Total registered students, active squads, showcase projects, and total messages.
  - Live Audit Ledger Stream: Renders the 6 most recent administrative actions.

---

### Page 16: Admin User Management & Disciplinary Strikes (`/admin/users`)
- **Route:** `/admin/users` (`frontend/src/app/admin/users/page.tsx`)
- **Purpose:** User moderation directory with search, role modification, account banning, and 3-strike disciplinary enforcement.
- **Access Level:** Admin.
- **Capabilities:**
  - Search students with 300ms debounce across names, emails, and universities.
  - Filter by role (`student`, `faculty`, `admin`) and status (`active`, `banned`).
  - "Issue Strike" Modal: Assigns disciplinary warning, temporary suspension, or permanent ban with required audit reasoning (`POST /api/admin/users/:id/strikes`).
  - "Promote to Admin / Demote" Action (`PATCH /api/admin/users/:id/role`).
  - "Delete User Account" Action (`DELETE /api/admin/users/:id`).

---

### Page 17: Admin Moderation Queue (`/admin/moderation`)
- **Route:** `/admin/moderation` (`frontend/src/app/admin/moderation/page.tsx`)
- **Purpose:** Review and resolve community abuse reports filed against posts, comments, users, teams, or projects.
- **Access Level:** Admin.
- **Actions:** View report details, reporter identity, violation reason; click "Resolve" or "Dismiss" with resolution notes (`PATCH /api/admin/reports/:id/resolve`).

---

### Page 18: Admin System Flags & Platform Controls (`/admin/system`)
- **Route:** `/admin/system` (`frontend/src/app/admin/system/page.tsx`)
- **Purpose:** Real-time platform switches and infrastructure kill switches.
- **Access Level:** Admin.
- **Available Kill Switches (`system_flags`):**
  - `maintenanceMode`: Puts API into HTTP 503 maintenance mode.
  - `registrationEnabled`: Locks new student sign-ups.
  - `emailVerification`: Toggles mandatory email activation tokens.
  - `allowPublicProjects`: Controls public showcase project visibility.
  - `rateLimitStrict`: Drops rate-limit thresholds to 20 req/15m globally.
  - `aiReviewEnabled`: Enables/disables automated GitHub PR code reviews.

---

### Page 19: Admin Forensic Audit Ledger (`/admin/audit`)
- **Route:** `/admin/audit` (`frontend/src/app/admin/audit/page.tsx`)
- **Purpose:** Immutable forensic ledger of all administrative interventions.
- **Access Level:** Admin.
- **Logged Attributes:** Admin ID, Admin Email, Action Name (`BAN_USER`, `UPDATE_FLAGS`, `RESOLVE_REPORT`), Target Type, Target ID, Client IP Address, Device Model, Timestamp, and raw JSON parameters drawer.

