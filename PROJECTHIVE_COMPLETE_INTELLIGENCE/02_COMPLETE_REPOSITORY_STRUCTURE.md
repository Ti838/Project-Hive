# 02: COMPLETE REPOSITORY STRUCTURE & FILE INVENTORY

> **Document Classification:** Repository Topology, File Directory & Code Hygiene Map  
> **Target Repository:** `c:\Users\TIMON\Desktop\Project-Hive`  
> **Extraction Evidence Level:** `[VERIFIED]` Recursive File System Audit  

---

## 1. High-Level Workspace Architecture

The ProjectHive repository is organized as a monorepo-adjacent multi-tier structure containing two primary application packages (`frontend` and `server`), shared deployment specifications, SQL schema migrations, and documentation:

```
c:\Users\TIMON\Desktop\Project-Hive\
├── .env                              # Root local development environment configuration
├── .gitattributes                    # Git line-ending and binary file definitions
├── .gitignore                        # Global repository ignores (node_modules, logs, build)
├── .markdownlint.json                # Markdown linting configuration
├── API_DOCUMENTATION.md              # High-level REST API and Socket reference manual
├── ARCHITECTURE.md                   # Core system architecture blueprints & diagrams
├── dfd_diagrams.html                 # Data Flow Diagrams (HTML visualization)
├── LICENSE                           # MIT open-source license
├── LIVEKIT_SETUP.md                  # LiveKit Cloud SFU setup and deployment guide
├── package-lock.json                 # Root npm lockfile
├── package.json                      # Root workspace orchestrator (scripts for frontend)
├── QUICKSTART.md                     # Local setup instructions
├── README.md                         # Main repository overview and documentation
├── render.yaml                       # Render.com Infrastructure-as-Code deployment manifest
├── STACK.md                          # Technology stack and historical evolution reference
├── start-project.bat                 # Windows one-click dual-process launcher (frontend + server)
├── stitch.ps1                        # PowerShell utility script
├── tsconfig.json                     # Root TypeScript configuration
├── vercel.json                       # Root Vercel deployment specification (build/redirect rules)
│
├── frontend/                         # Client Application Package (Next.js 16 + React 19)
│   ├── .env.example                  # Client environment template
│   ├── .env.local                    # Local client environment variables
│   ├── .env.production               # Production client environment configuration
│   ├── .env.production.example       # Production template
│   ├── components.json               # shadcn / Tailwind component manifest
│   ├── eslint.config.mjs             # ESLint 9 flat configuration
│   ├── next-env.d.ts                 # Next.js TypeScript declarations
│   ├── next.config.ts                # Next.js 16 compiler, image domains, and 301 redirects
│   ├── package-lock.json             # Frontend npm lockfile
│   ├── package.json                  # Frontend dependencies and scripts (Turbopack)
│   ├── postcss.config.mjs            # PostCSS configuration for Tailwind CSS v4
│   ├── tsconfig.json                 # Frontend TypeScript compiler options
│   ├── vercel.json                   # Frontend-specific Vercel build overrides
│   ├── public/                       # Static public assets (logos, icons, manifests)
│   └── src/                          # Application source code
│       ├── app/                      # Next.js 16 App Router route definitions (33 pages)
│       ├── components/               # React 19 modular UI components (53 components)
│       ├── context/                  # React context providers (ThemeContext)
│       ├── hooks/                    # Custom React hooks (useSocket, useLiveKitRoom, useAuth)
│       ├── lib/                      # Core client libraries (api.ts, store.ts, callStore.ts)
│       └── types/                    # Shared TypeScript interfaces and type definitions
│
├── server/                           # Backend Application Package (Node.js + Express 4.18)
│   ├── .env                          # Local server environment configuration
│   ├── .env.example                  # Server environment template
│   ├── .env.production               # Production server environment configuration
│   ├── .env.production.example       # Production template
│   ├── app.js                        # Express app initialization, middleware, routes
│   ├── package-lock.json             # Backend npm lockfile
│   ├── package.json                  # Backend dependencies and scripts
│   ├── server.js                     # HTTP + Socket.IO server entry point
│   ├── check_tables.js               # Diagnostic script for database table verification
│   ├── triage_endpoints.js           # Comprehensive non-destructive runtime API triage script
│   ├── config/                       # Subsystem configuration (db, gemini, redis, supabase)
│   ├── controllers/                  # Route business logic handlers (14 controllers)
│   ├── database/                     # SQL schemas, production syncs, and migration scripts
│   ├── middleware/                   # Authentication, sanitization, rate limiting, error handling
│   ├── routes/                       # Express router definitions (13 route files)
│   ├── services/                     # Background and integration services (email, github, socket)
│   └── utils/                        # Utility helpers (jwt, dbQuery, ipResolver, ipUtils)
```

---

## 2. Granular Inventory of Important Files

### 2.1 Root Configuration & Infrastructure Files

| File Path | Purpose & Responsibilities | Key Exports / Commands | Active Status |
|---|---|---|---|
| `package.json` | Root monorepo orchestrator. Provides top-level convenience scripts to run the frontend package. | `scripts: { dev, build, start }` | `[VERIFIED]` Active |
| `render.yaml` | Infrastructure-as-Code blueprint for deploying `projecthive-backend` to Render as a Node.js web service. | Defines service name, plan (free), build (`npm install`), start (`node server.js`), and health check (`/health`). | `[VERIFIED]` Active |
| `vercel.json` | Vercel deployment configuration specifying root directory forwarding and edge routing. | Overrides output and sets Next.js server configuration. | `[VERIFIED]` Active |
| `start-project.bat` | Windows batch script to launch both backend (`server/server.js`) on port 5000 and frontend (`next dev`) on port 3000 in concurrent command windows. | Dual `start cmd.exe` script. | `[VERIFIED]` Active |
| `LIVEKIT_SETUP.md` | Architecture documentation and setup manual for LiveKit Cloud SFU integration. | WebRTC SFU configuration guide. | `[VERIFIED]` Active Documentation |
| `ARCHITECTURE.md` | Master engineering architecture document outlining system topology, ERD, and component diagrams. | Mermaid system architecture blueprints. | `[VERIFIED]` Active Documentation |
| `dfd_diagrams.html` | Standalone interactive HTML document rendering Data Flow Diagrams (Level 0, Level 1, Level 2) for ProjectHive. | DFD visualizer using SVG/Canvas. | `[VERIFIED]` Active Documentation |

---

### 2.2 Frontend Source Inventory (`frontend/src/`)

#### A. Core Libraries & Global State (`frontend/src/lib/`)

| File Path | Size | Purpose & Responsibilities | Important Exports | Dependencies | Status |
|---|---|---|---|---|---|
| `frontend/src/lib/api.ts` | 37.8 KB | Centralized API client wrapper. Manages JWT bearer tokens, automatic 401 token refresh mutex, error normalization, and typed endpoints. | `api` object (auth, users, teams, projects, messages, notifications, posts, stories, friends, ai, calls, github, reports, admin), `getAccessToken()`, `setTokens()`, `clearTokens()` | `zustand`, `types` | `[VERIFIED]` Core Active |
| `frontend/src/lib/store.ts` | 6.6 KB | Primary global Zustand store. Manages persistent authentication state, real-time online presence, and layout drawer toggles. | `useAuthStore`, `useSocketStore`, `useUIStore` | `zustand`, `zustand/middleware` | `[VERIFIED]` Core Active |
| `frontend/src/lib/callStore.ts` | 11.7 KB | Real-time call state store. Coordinates incoming/outgoing call status machines, hardware device selection, active speaker detection, and track toggles. | `useCallStore`, `CallStatus`, `CallSession`, `DeviceInfoList` | `zustand`, `api.ts`, `types` | `[VERIFIED]` Core Active |
| `frontend/src/lib/voiceEngine.ts` | 6.4 KB | Client hardware voice processor. Interfaces with W3C Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) for zero-cost STT/TTS. | `voiceEngine` singleton class (`startListening`, `stopListening`, `speakText`) | Native browser DOM | `[VERIFIED]` Core Active |
| `frontend/src/lib/deviceTelemetry.ts` | 7.0 KB | Hardware telemetry extractor. Probes unmasked WebGL GPU vendor/renderer (`WEBGL_debug_renderer_info`), physical CPU architecture, and screen geometry. | `getExactDeviceTelemetry()`, `DeviceTelemetry` | WebGL API, Navigator | `[VERIFIED]` Active (Admin) |
| `frontend/src/lib/deviceFingerprint.ts` | 3.4 KB | High-entropy browser fingerprinting generator. Computes persistent client identifiers for session tracking and brute-force mitigation. | `getExactDeviceDetails()`, `generateDeviceFingerprint()` | Canvas API, AudioContext | `[VERIFIED]` Active |
| `frontend/src/lib/utils.ts` | 4.6 KB | Shared UI utilities. Provides class name merging (`cn`), time-ago formatting, avatar color hashing, and text sanitizers. | `cn()`, `displayName()`, `timeAgo()`, `getInitials()`, `getAvatarColor()`, `sanitizeAndDecodeText()` | `clsx`, `tailwind-merge` | `[VERIFIED]` Core Active |
| `frontend/src/lib/universities.ts` | 6.0 KB | Comprehensive dataset of Bangladeshi and international universities with department mappings. | `BANGLADESH_UNIVERSITIES`, `ALL_UNIVERSITIES` | None | `[VERIFIED]` Core Active |

#### B. Custom React Hooks (`frontend/src/hooks/`)

| File Path | Size | Responsibilities | Key Capabilities | Dependencies | Status |
|---|---|---|---|---|---|
| `frontend/src/hooks/useSocket.ts` | 12.5 KB | React wrapper for Socket.IO singleton. Manages connection lifecycle, room joins, typing notifications, message dual-dispatch, and whiteboard sync. | `useSocket()`, `getSocketUrl()`, `WhiteboardDrawPayload` | `socket.io-client`, `store.ts` | `[VERIFIED]` Core Active |
| `frontend/src/hooks/useLiveKitRoom.ts` | 14.3 KB | WebRTC SFU media room controller. Connects to LiveKit Cloud, mounts local video/audio tracks, synchronizes participant lists, and monitors network quality. | `useLiveKitRoom()`, `stopAllLocalTracks()`, `safelyTeardownRoom()`, `ParticipantTrackItem` | `livekit-client`, `callStore.ts` | `[VERIFIED]` Core Active |
| `frontend/src/hooks/useAuth.ts` | 1.4 KB | Lightweight authentication helper hook. | `useAuth()` convenience wrapper over `useAuthStore` | `store.ts` | `[VERIFIED]` Active |

#### C. Component Architecture (`frontend/src/components/`)

The component ecosystem is divided into 10 domain clusters:
1. `layout/` (4 files): `AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `MobileNav.tsx` — powers the responsive platform shell and navigation.
2. `calling/` (8 files): `CallManager.tsx`, `ActiveCallOverlay.tsx`, `IncomingCallModal.tsx`, `OutgoingCallModal.tsx`, `MinimizedCallWidget.tsx`, `ParticipantTile.tsx`, `ScreenShareView.tsx`, `DeviceSettingsModal.tsx` — manages real-time LiveKit audio/video calling and PiP widget.
3. `chat/` (1 file): `InCallWhiteboard.tsx` — collaborative HTML5 multi-tool canvas with undo history and sticky notes.
4. `ai/` (11 files): `HiveAIWorkspace.tsx`, `HiveAICopilotDrawer.tsx`, `HiveAIComposer.tsx`, `HiveAIMessage.tsx`, `HiveAIThinking.tsx`, `HiveAICapabilities.tsx`, `HiveAIContextRail.tsx`, `HiveAIArtifact.tsx`, `HiveAIEmptyState.tsx`, `HiveAIHeader.tsx`, `HiveAIIcon.tsx` — powers the 11-mode multimodal intelligence studio.
5. `developer/` (9 files): `ProjectHealthScore.tsx`, `CodeViewer.tsx`, `ReadmeViewer.tsx`, `CommitsView.tsx`, `IssuesView.tsx`, `PullRequestsView.tsx`, `CiCdPipelineView.tsx`, `AiPrReviewModal.tsx`, `ConnectRepoModal.tsx` — GitHub workspace and AI PR review interface.
6. `feed/` (6 files): `PostComposerModal.tsx`, `RichPostContent.tsx`, `MediaMosaic.tsx`, `ReactionDock.tsx`, `ReactionListModal.tsx`, `ThreadedComments.tsx` — social feed with multi-image mosaics and rich polls.
7. `teams/` (1 file): `JoinRequestModal.tsx` — team application submission dialog.
8. `admin/` (1 file): `DesktopGate.tsx` — workstation hardware security gate enforcing >= 1024px desktop access.
9. `landing/` (9 files): `Hero.tsx`, `Navbar.tsx`, `ProductStory.tsx`, `FeaturesSequence.tsx`, `Features.tsx`, `Workflow.tsx`, `Showcase.tsx`, `CTA.tsx`, `SmoothScroll.tsx` — marketing landing page.
10. `ui/` (2 files): `UserAvatar.tsx`, `UserProfileHoverCard.tsx` — reusable user avatar and rich popover card.

---

### 2.3 Backend Source Inventory (`server/`)

#### A. Core Entry Points & Middleware (`server/`)

| File Path | Size | Purpose & Responsibilities | Key Exports | Status |
|---|---|---|---|---|
| `server/server.js` | 9.3 KB | Primary backend entry point. Spawns HTTP server, initializes Socket.IO with optional Redis adapter, registers socket event handlers, runs startup health sweeps, and initiates keep-alive pings. | `startServer()` | `[VERIFIED]` Core Active |
| `server/app.js` | 14.7 KB | Express application configurator. Enforces reverse proxy trust, CORS whitelist, Helmet CSP headers, rate limiters, XSS sanitization, maintenance mode guards, and mounts all REST routers. | Express `app` instance | `[VERIFIED]` Core Active |
| `server/middleware/auth.js` | 2.7 KB | JWT authentication guard. Verifies bearer token, checks ban status, and populates `req.user`. Also exports `optionalAuthMiddleware` for public browsing. | `authMiddleware`, `optionalAuthMiddleware` | `[VERIFIED]` Core Active |
| `server/middleware/adminAuth.js` | 3.0 KB | Administrative privilege guard. Verifies user has `role = 'admin'` via database lookup and checks admin token validity. | `adminAuthMiddleware` | `[VERIFIED]` Core Active |
| `server/middleware/socketAuth.js` | 2.3 KB | WebSocket handshake authentication middleware. Validates JWT passed in `socket.handshake.auth.token` and attaches `socket.userId`. | `socketAuthMiddleware` | `[VERIFIED]` Core Active |
| `server/middleware/sanitize.js` | 2.3 KB | Global XSS input sanitizer. Strips dangerous script tags and malicious attributes from `req.body`, `req.query`, and `req.params`. | `sanitizeInputMiddleware` | `[VERIFIED]` Core Active |
| `server/middleware/turnstile.js` | 1.5 KB | Cloudflare Turnstile token verification middleware for bot protection. | `verifyTurnstileToken` | `[VERIFIED]` Active (Optional) |
| `server/middleware/errorHandler.js` | 1.2 KB | Global Express error handler returning structured JSON responses. | `errorHandler` | `[VERIFIED]` Core Active |

#### B. Controllers & Services (`server/controllers/` & `server/services/`)

| File Path | Size | Primary Domain & Responsibilities |
|---|---|---|
| `server/controllers/auth.controller.js` | 33.7 KB | Handles student registration, login, JWT token issuance, refresh token rotation, password recovery, email verification, and Google OAuth PKCE exchange. |
| `server/controllers/admin.auth.controller.js` | 4.8 KB | Standalone administrative authentication validating credentials against environment variables and granting admin privileges. |
| `server/controllers/admin.controller.js` | 33.2 KB | Institutional governance: system KPIs, user banning, role assignment, disciplinary strikes, report resolution, system flag toggling, and audit log retrieval. |
| `server/controllers/ai.controller.js` | 32.8 KB | Cascading multi-model AI inference engine: Groq Cloud -> Google Gemini -> OpenRouter. Implements `executeHiveAICapability` supporting all 11 AI capabilities with in-memory sanitization. |
| `server/controllers/calls.controller.js` | 8.1 KB | LiveKit room token issuer (`getCallToken`), call session lifecycle recorder (`endCall`), and call history viewer (`getCallHistory`). |
| `server/controllers/friends.controller.js` | 27.7 KB | Friendship lifecycle: send request, accept, reject, cancel, unfriend, follow, unfollow, block, unblock, mutual friends discovery, and relationship state resolution. |
| `server/controllers/github.controller.js` | 10.5 KB | GitHub API integration: repository overview, file tree, blob content, commit history, branch list, issue tracker, pull requests, CI/CD actions, health scoring, and AI PR review. |
| `server/controllers/messages.controller.js` | 25.6 KB | Chat history retrieval, direct message creation with friend-gating, conversation pins, reaction toggling, and message deletion. |
| `server/controllers/notifications.controller.js` | 2.2 KB | Notification management: list notifications, mark single as read, mark all as read, and delete. |
| `server/controllers/posts.controller.js` | 37.9 KB | Social feed operations: post creation (updates, code snippets, polls), reactions, threaded comments, post saving, and poll voting. |
| `server/controllers/projects.controller.js` | 9.5 KB | Showcase projects: project submission, update, delete, like, ProductHunt-grade upvoting, and bookmarking. |
| `server/controllers/stories.controller.js` | 7.6 KB | 24-hour ephemeral stories: story publishing, feed listing, view tracking, and deletion. |
| `server/controllers/teams.controller.js` | 27.5 KB | Squad formation: team creation, member management, leadership transfer, member kick, join request submission, and approval/rejection workflows. |
| `server/controllers/users.controller.js` | 43.9 KB | User directory: profile retrieval, update, search, people discovery with filters, skill endorsements, password changes, support tickets, and account deletion. |
| `server/services/socket.service.js` | 14.6 KB | Socket.IO event processor: user socket registration, room joins/leaves, message broadcasting with dual-dispatch, typing indicators, reactions, read receipts, and call signaling. |
| `server/services/github.service.js` | 16.0 KB | Octokit / GitHub REST API wrapper: fetches profiles, trees, raw files, commits, issues, PRs, workflows, and computes repo health scores. |
| `server/services/livekit.service.js` | 1.6 KB | LiveKit server SDK helper issuing cryptographically signed video grants. |
| `server/services/email.service.js` | 18.5 KB | Transactional email engine integrating Brevo HTTP API and Gmail SMTP for welcome messages, email verifications, and password reset tokens. |
| `server/services/crypto/keySigner.service.js` | 9.6 KB | Confidential computing layer abstracting cryptographic signing (SoftwareKeySigner vs HardwareEnclaveKeySigner). |
| `server/services/crypto/sanitizer.service.js` | 6.3 KB | In-memory zero-leak AI prompt scrubber stripping private keys, DB URIs, and credentials before LLM dispatch. |

---

## 3. Dead Code, Legacy Files & Deprecation Analysis

`[VERIFIED]` The forensic audit revealed several legacy artifacts resulting from the architectural transition from static HTML to Next.js 16:

1. **Legacy Static HTML Redirects (`frontend/next.config.ts:lines 48–172`):**
   - *Observation:* Over 25 redirect rules map old paths such as `/pages/auth/login.html` -> `/login` and `/pages/user/dashboard.html` -> `/dashboard`.
   - *Status:* Maintained for backwards compatibility with legacy bookmarks and external links.
2. **Permissive Reverse Proxy Warning (`server/app.js:33`):**
   - *Observation:* `app.set('trust proxy', true)` triggers an `ERR_ERL_PERMISSIVE_TRUST_PROXY` warning from `express-rate-limit` during startup.
   - *Remediation Recommendation:* Change to trust only the specific loopback, Render, and Cloudflare IP CIDR blocks instead of wildcard boolean `true`.
3. **Redundant Diagnostic Files in Server Root:**
   - `server/check_tables.js` (929 bytes)
   - `server/fix-email-verification.js` (995 bytes)
   - `server/get_users.js` (443 bytes)
   - `server/test-bcrypt.js` (504 bytes)
   - `server/test-db.js` (626 bytes)
   - `server/test-email.js` (427 bytes)
   - `server/test-login-debug.js` (2,913 bytes)
   - `server/test-register-login.js` (1,139 bytes)
   - *Status:* One-off developer diagnostic scripts. They do not affect production execution but can be archived into a `/scripts` directory.

