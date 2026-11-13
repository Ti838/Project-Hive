<p align="center">
  <img src="frontend/public/logo.png" width="160" alt="ProjectHive Logo" />
</p>

<h1 align="center">ProjectHive 🐝</h1>

<p align="center">
  <strong>The Next-Generation University Project Incubation, Teammate Discovery & Real-Time Collaboration Ecosystem</strong>
</p>

<p align="center">
  <a href="https://projecthive-bd.vercel.app"><img src="https://img.shields.io/badge/Frontend-Next.js%2016%20App%20Router-black?style=for-the-badge&logo=nextdotjs" alt="Next.js 16" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react" alt="React 19" /></a>
  <a href="https://projecthive-backend.onrender.com"><img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%205-46E3B7?style=for-the-badge&logo=node.js" alt="Node.js Express" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase PostgreSQL" /></a>
  <a href="https://socket.io"><img src="https://img.shields.io/badge/Realtime-Socket.IO%204.x-010101?style=for-the-badge&logo=socketdotio" alt="Socket.IO" /></a>
  <a href="https://livekit.io"><img src="https://img.shields.io/badge/SFU%20Calling-LiveKit%20Cloud-2088FF?style=for-the-badge&logo=webrtc" alt="LiveKit Cloud SFU" /></a>
  <a href="https://groq.com"><img src="https://img.shields.io/badge/AI%20Engine-Groq%20%2B%20Gemini%20%2B%20OpenRouter-F55036?style=for-the-badge&logo=openai" alt="Cascading AI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License" /></a>
</p>

---

## 📑 Table of Contents
1. [Documentation Portal & Architecture Specs (`docs/`)](#-documentation-portal--technical-specifications)
2. [Executive Overview](#-executive-overview)
3. [Live Deployments & Infrastructure](#-live-deployments--infrastructure)
4. [Master System Architecture](#-master-system-architecture)
5. [Database Entity-Relationship Architecture (16 Tables)](#-database-entity-relationship-architecture-16-tables)
6. [Zero-Trust Security & Row Level Security (RLS) Flow](#-zero-trust-security--row-level-security-rls-flow)
7. [LiveKit WebRTC Call State Machine](#-livekit-webrtc-call-state-machine)
8. [Cascading Multimodal AI Engine](#-cascading-multimodal-ai-engine)
9. [Two-Way Helpline & Support Management](#-two-way-helpline--support-management)
10. [Frontend Application Map (39 Routes)](#-frontend-application-map-39-routes)
11. [Backend REST & WebSocket API Reference](#-backend-rest--websocket-api-reference)
12. [Quickstart & Local Environment Setup](#-quickstart--local-environment-setup)
13. [Verification & Health Auditing](#-verification--health-auditing)
14. [License](#-license)

---

## 📚 Documentation Portal & Technical Specifications

Detailed engineering blueprints, API references, security threat models, and setup guides are maintained in the [`docs/`](./docs/README.md) directory:

| Section | Focus Area | Master Document |
| :--- | :--- | :--- |
| 🏛️ **Architecture** | Master Topology, 3D WebGL, SFU Calling & Sequence Diagrams | [docs/architecture/SYSTEM_ARCHITECTURE.md](./docs/architecture/SYSTEM_ARCHITECTURE.md) |
| 🗄️ **Database** | PostgreSQL Schemas, RLS Policies, ERD & Indexing | [docs/architecture/DATA_MODELS_AND_ERD.md](./docs/architecture/DATA_MODELS_AND_ERD.md) |
| 🛡️ **Security** | Defense-in-Depth, Admin Isolation, RBAC & Audit Report | [docs/security/SECURITY_ARCHITECTURE.md](./docs/security/SECURITY_ARCHITECTURE.md) |
| 🔌 **REST API** | Endpoint Contracts, JSON Envelope & Error Codes | [docs/api/API_REFERENCE.md](./docs/api/API_REFERENCE.md) |
| ⚡ **WebSockets** | Socket.IO Events, Room Lifecycle & Signaling Protocol | [docs/api/WEBSOCKET_EVENTS.md](./docs/api/WEBSOCKET_EVENTS.md) |
| 🚀 **Deployment** | Vercel, Render, Supabase & Cloudflare Setup | [docs/setup/DEPLOYMENT_AND_SETUP.md](./docs/setup/DEPLOYMENT_AND_SETUP.md) |
| 🎙️ **LiveKit SFU** | Managed WebRTC Calling, Dynacast & NAT Traversal | [docs/setup/LIVEKIT_SFU_GUIDE.md](./docs/setup/LIVEKIT_SFU_GUIDE.md) |
| 🎨 **Design System**| Obsidian Slate & Amber Tokens, 3D Physics & Auto-Sync | [docs/ui-ux/DESIGN_SYSTEM.md](./docs/ui-ux/DESIGN_SYSTEM.md) |
| 🎓 **Academic** | University Presentation Dossier & Defense Scripts | [docs/academic/SYSTEM_ANALYSIS_LAB_MANUAL.md](./docs/academic/SYSTEM_ANALYSIS_LAB_MANUAL.md) |

---

## 🌟 Executive Overview

**ProjectHive** is an industrial-grade collaborative platform designed to transform how university students, researchers, and aspiring founders build teams, manage hackathon sprints, communicate in real time, and incubate technical software.

Engineered to the visual and reliability benchmarks of **Discord, WhatsApp, GitHub, and Linear**, ProjectHive delivers:
- **Discord-Grade Academic Squads (`/teams/[id]`)**: Real-time recruitment status indicators, applicant evaluation drawers, leadership delegation, and room-scoped team chat.
- **WhatsApp-Grade Real-Time Messaging (`/messages`)**: Socket.IO bi-directional communication, delivery state tracking (`sent` → `delivered` → `read`), interactive emoji reactions, and clipboard screenshot pasting (`Ctrl+V`).
- **LiveKit Cloud SFU Audio/Video Calling**: Low-latency multi-peer calling with dynamic bitrate adaptation and a floating Picture-in-Picture (PiP) ambient widget.
- **Google Classroom & Canvas-Grade Academic Mesh**: Sprint milestone countdowns, rubric criteria checklists, and GitHub deliverable turn-ins.
- **Notion-Grade Markdown Project Wikis**: Collaborative documentation boards with persistent real-time database storage.
- **Cascading Multimodal AI ("HiveMind AI")**: Sub-second reasoning via Groq Cloud (Llama 3.3 70B), visual analysis via Google Gemini 2.5 Flash, and free failover pools via OpenRouter, paired with Browser Web Speech API for voice dictation.
- **Two-Way Connected Helpline System (`/help` ↔ `/admin/support`)**: Unified student ticketing interface with real-time status notifications, admin investigation tools, and internal staff notes.
- **Industrial Zero-Trust Security**: 100% Row Level Security (RLS) enforcement, database-level anti-privilege escalation triggers, folder-isolated object storage, and tamper-proof admin audit logging.

---

## 🌐 Live Deployments & Infrastructure

| Tier | Component | Environment | Live Endpoint | Status |
|:---|:---|:---|:---|:---:|
| 🌐 **Client** | Next.js 16 App Router | Vercel Edge | [projecthive-bd.vercel.app](https://projecthive-bd.vercel.app) | `ACTIVE` |
| 👑 **Admin** | Super Admin Command Center | Vercel Edge | [projecthive-bd.vercel.app/admin/login](https://projecthive-bd.vercel.app/admin/login) | `ACTIVE` |
| ⚙️ **API Gateway** | Express 5 REST Engine | Render.com | [projecthive-backend.onrender.com/api](https://projecthive-backend.onrender.com/api) | `ACTIVE` |
| 🔌 **WebSocket** | Socket.IO Event Hub | Render.com | `wss://projecthive-backend.onrender.com` | `ACTIVE` |
| 🗄️ **Database** | Supabase PostgreSQL 15+ | Singapore Cluster | `iekfvgjxkmgduxdvkuxf.supabase.co` | `ACTIVE` |
| 🎙️ **Media SFU** | LiveKit Cloud Media Hub | LiveKit Global | `wss://project-hive-o0q9p17e.livekit.cloud` | `ACTIVE` |
| 📧 **Mail Relay** | Brevo Transactional SMTP | Brevo Cloud | `smtp-relay.brevo.com:587` | `ACTIVE` |

---

## 📐 Master System Architecture

ProjectHive is built on an asynchronous, event-driven topology separating static edge delivery from stateful real-time processing and managed cloud persistence:

```mermaid
graph TD
    %% Client Tier
    subgraph Client_Ecosystem ["Client Ecosystem (Next.js 16 App Router / React 19)"]
        BrowserDesktop["Desktop Workstation (>= 1024px)"]
        BrowserMobile["Mobile Client (< 640px)"]
        AppShell["Global AppShell (Topbar, Sidebar, BottomNav)"]
        HiveAICopilot["HiveMind AI Copilot (Voice, Vision & Code)"]
        LiveKitWidget["MinimizedCallWidget (PiP Ambient Dock)"]
        SocketHook["useSocket Singleton Client Hook"]
        ZustandStores["Zustand State Stores (Auth, Socket, UI, Call)"]
    end

    %% Edge Network
    subgraph Edge_Infrastructure ["Edge Tier (Vercel Global Network)"]
        VercelCDN["Vercel Global Edge CDN & Cache"]
        NextServer["Next.js SSR & Server Actions Runtime"]
    end

    %% Backend Gateway
    subgraph Backend_Gateway ["Backend Gateway (Render.com Node.js Engine)"]
        ExpressRouter["Express 5 REST API Gateway"]
        AuthMiddleware["JWT Authentication & KeySigner Guard"]
        RateLimiter["express-rate-limit (OWASP Top 10)"]
        SocketCluster["Socket.IO 4.x WebSocket Hub"]
        LiveKitTokenService["LiveKit AccessToken Minting Engine"]
        DBConnector["Supabase Client (supabaseAdmin / service_role)"]
    end

    %% AI Cluster
    subgraph AI_Inference_Cluster ["Cascading AI Cluster (100% Free Tier)"]
        GroqTier["Tier 1: Groq Cloud (Llama-3.3-70B-versatile)"]
        GeminiTier["Tier 2: Google Gemini 2.5 Flash (Vision & Text)"]
        OpenRouterTier["Tier 3: OpenRouter Free Failover Pool"]
        WebSpeechTier["Tier 4: Browser Web Speech API (Client STT/TTS)"]
    end

    %% Persistence & Media
    subgraph Persistence_Media ["Cloud Infrastructure & Real-Time Media"]
        PostgresCluster[("Supabase PostgreSQL Cluster (Singapore)")]
        StorageBuckets["Supabase S3 Buckets (avatars, banners, attachments, resumes)"]
        LiveKitCloud["LiveKit Cloud SFU Media Server"]
        BrevoSMTP["Brevo SMTP Transactional Mailer"]
    end

    %% Connections
    BrowserDesktop --> VercelCDN
    BrowserMobile --> VercelCDN
    VercelCDN --> NextServer
    NextServer --> AppShell
    AppShell --> ZustandStores
    ZustandStores --> SocketHook

    AppShell -->|HTTPS REST API| ExpressRouter
    SocketHook <-->|WSS Bi-Directional Events| SocketCluster

    ExpressRouter --> AuthMiddleware
    AuthMiddleware --> RateLimiter
    RateLimiter --> DBConnector

    DBConnector --> PostgresCluster
    DBConnector --> StorageBuckets
    SocketCluster --> PostgresCluster
    ExpressRouter --> BrevoSMTP

    ExpressRouter --> LiveKitTokenService
    LiveKitTokenService -->|Minted Video Grant JWT| LiveKitWidget
    LiveKitWidget <-->|WebRTC Media Tracks| LiveKitCloud

    ExpressRouter --> GroqTier
    GroqTier -.->|Failover on 429| GeminiTier
    GeminiTier -.->|Failover on 503| OpenRouterTier
    HiveAICopilot <--> WebSpeechTier
```

---

## 🗄️ Database Entity-Relationship Architecture (16 Tables)

The entire persistent database is consolidated into a **single canonical master file**:  
📁 [`server/database/schema.sql`](file:///c:/Users/TIMON/Desktop/Project-Hive/server/database/schema.sql)

```mermaid
erDiagram
    users ||--o{ user_settings : "1-to-1 preferences"
    users ||--o{ teams : "leads"
    users ||--o{ team_members : "joins"
    teams ||--o{ team_members : "contains"
    users ||--o{ projects : "authors"
    teams ||--o{ projects : "owns"
    projects ||--o{ tasks : "contains"
    users ||--o{ tasks : "assigned"
    conversations ||--o{ messages : "contains"
    users ||--o{ messages : "sends"
    call_sessions ||--o{ call_participants : "tracks"
    users ||--o{ call_participants : "participates"
    users ||--o{ posts : "publishes"
    posts ||--o{ post_comments : "receives"
    users ||--o{ post_comments : "writes"
    users ||--o{ notifications : "receives"
    users ||--o{ support_tickets : "submits"
    users ||--o{ admin_audit_logs : "audited"

    users {
        uuid id PK "gen_random_uuid()"
        string email UK "Student email"
        string password_hash "Bcrypt 12 rounds"
        string first_name
        string last_name
        string role "user | moderator | admin | super_admin"
        boolean is_verified
        boolean is_banned
        integer strikes "3 strikes threshold"
        string university
        string major
        string department
        string academic_year
        jsonb skills
        jsonb interests
        timestamptz created_at
    }

    user_settings {
        uuid user_id PK,FK
        string theme "light | dark | system"
        jsonb privacy
        jsonb notifications
        jsonb ai_preferences
    }

    teams {
        uuid id PK
        string name
        string description
        string category
        uuid leader_id FK
        integer max_members
        string status "open | closed"
        jsonb rules
        timestamptz created_at
    }

    team_members {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        string role "leader | maintainer | member"
        timestamptz joined_at
    }

    projects {
        uuid id PK
        string title
        string description
        uuid owner_id FK
        uuid team_id FK
        string status "planning | in-development | completed"
        string github_url
        string demo_url
        jsonb tech_stack
        integer upvotes
    }

    tasks {
        uuid id PK
        uuid project_id FK
        string title
        string status "todo | in_progress | review | done"
        string priority "low | normal | high | urgent"
        uuid assigned_to FK
        timestamptz due_date
    }

    conversations {
        uuid id PK
        string type "direct | group | team"
        uuid target_id
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        string room_id
        uuid sender_id FK
        string content
        string type
        string file_url
        jsonb reactions
        boolean is_read
    }

    call_sessions {
        uuid id PK
        string room_name UK
        string call_type "audio | video"
        uuid initiator_id FK
        string status "initiated | connected | ended"
        integer duration_seconds
    }

    call_participants {
        uuid id PK
        uuid call_id FK
        uuid user_id FK
        string role "initiator | participant"
        integer duration_seconds
    }

    posts {
        uuid id PK
        uuid author_id FK
        string content
        jsonb media_urls
        jsonb tags
        integer upvotes
        jsonb poll_data
    }

    post_comments {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        string content
        uuid parent_id FK
    }

    notifications {
        uuid id PK
        uuid user_id FK
        string type
        string title
        string message
        jsonb data
        boolean is_read
    }

    support_tickets {
        uuid id PK
        string ticket_number UK "PH-YYYY-XXXXXX"
        uuid user_id FK
        string subject
        string category
        string priority "low | normal | urgent"
        string status "Open | Waiting for Admin | Waiting for User | Resolved | Closed"
        jsonb messages
    }

    admin_audit_logs {
        uuid id PK
        uuid admin_id FK
        string admin_email
        string action
        string target_type
        string target_id
        jsonb details
        string ip_address
    }

    system_flags {
        string key PK "maintenanceMode, registrationEnabled, emailVerification"
        boolean value
        timestamptz updated_at
    }
```

---

## 🔒 Zero-Trust Security & Row Level Security (RLS) Flow

Security is not assumed; it is enforced deterministically at the database kernel level through PostgreSQL Row Level Security (RLS) policies and immutable triggers:

```mermaid
flowchart TD
    Request([Database Execution Request]) --> AuthGate{Who is calling?}

    AuthGate -->|SUPABASE_SERVICE_ROLE_KEY| BackendWorker[Node.js Express / System Admin API]
    BackendWorker --> ServiceRoleBypass[Policy: service_role_all_* -> Full Access Granted]

    AuthGate -->|Authenticated User JWT| TableRouter{Target Entity}

    TableRouter -->|users Table Update| TriggerGuard{tr_user_immutability Check}
    TriggerGuard -->|Modifying role, is_banned, strikes| BlockEscalation[❌ Privilege Escalation Blocked Exception]
    TriggerGuard -->|Updating bio, avatar, skills| AllowSelfUpdate[✅ Permitted: auth.uid == id]

    TableRouter -->|user_settings| SettingsCheck{auth.uid == user_id}
    SettingsCheck -->|True| AllowSettings[✅ Access Granted]
    SettingsCheck -->|False| BlockIDOR1[❌ IDOR Blocked]

    TableRouter -->|support_tickets| TicketCheck{auth.uid == user_id}
    TicketCheck -->|True| AllowTicket[✅ View / Reply Permitted]
    TicketCheck -->|False| BlockIDOR2[❌ IDOR Blocked: Private Support Ticket]

    TableRouter -->|admin_audit_logs| BlockAudit[❌ Forbidden: Zero Client Policies Configured]

    AuthGate -->|Anonymous Public Key| AnonRouter{Target Entity}
    AnonRouter -->|posts, system_flags| AllowAnonRead[✅ Read-Only Permitted]
    AnonRouter -->|users, tickets, messages, admin_logs| BlockAnon[❌ Access Denied: Authentication Required]
```

---

## 🎙️ LiveKit WebRTC Call State Machine

Audio and video calls transition through a deterministic lifecycle, guaranteeing automatic reconnection, room cleanup, and zero orphaned sessions:

```mermaid
stateDiagram-v2
    [*] --> IDLE
    
    IDLE --> CALLING: startCall() initiated by caller
    IDLE --> RINGING: call:incoming received by callee
    
    CALLING --> CONNECTING: Peer emits call:accept
    CALLING --> REJECTED: Peer emits call:decline
    CALLING --> MISSED: Dialing timeout (30s)
    
    RINGING --> CONNECTING: Callee clicks 'Accept Call'
    RINGING --> REJECTED: Callee clicks 'Decline'
    
    CONNECTING --> CONNECTED: LiveKit SFU room joined & tracks published
    CONNECTING --> FAILED: Token invalid or SFU timeout
    
    CONNECTED --> RECONNECTING: Network drop / RoomEvent.Reconnecting
    RECONNECTING --> CONNECTED: Network restored / RoomEvent.Reconnected
    RECONNECTING --> FAILED: Reconnect timeout exceeded
    
    CONNECTED --> ENDED: Participant clicks 'Hang Up' (call:hangup)
    
    ENDED --> IDLE: Teardown tracks & resetCallState()
    REJECTED --> IDLE: resetCallState()
    MISSED --> IDLE: resetCallState()
    FAILED --> IDLE: resetCallState()
```

---

## 🤖 Cascading Multimodal AI Engine

HiveMind AI features sub-second response times and zero-downtime reliability by cascading requests across multiple free-tier model providers:

```mermaid
flowchart LR
    UserInput([User Prompt / Code / Image]) --> ContentType{Payload Type}

    ContentType -->|Image / Screenshot| GeminiTier[Google Gemini 2.5 Flash]
    ContentType -->|Text / Code Debug| GroqTier[Groq Cloud: Llama 3.3 70B]

    GroqTier -->|Success (< 500ms)| Response([Synthesized Response])
    GroqTier -.->|Rate Limit / 429| GeminiTier

    GeminiTier -->|Success| Response
    GeminiTier -.->|Unavailable / 503| OpenRouterTier[OpenRouter Free Tier Failover Pool]

    OpenRouterTier -->|Success| Response
    OpenRouterTier -.->|All Exhausted| LocalFallback[Local Fallback Heuristics]

    Response --> WebSpeech[Browser Web Speech API: Voice Synthesis Readback]
```

---

## 🎫 Two-Way Helpline & Support Management

The helpline links the public student interface (`/help`) with the administrator investigation terminal (`/admin/support`), providing complete two-way resolution workflows:

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (/help)
    participant Backend as Express API (/api/support)
    participant Database as Supabase (support_tickets)
    actor Admin as Administrator (/admin/support)

    Student->>Backend: POST /api/support/tickets (subject, category, message, attachments)
    Backend->>Database: INSERT into support_tickets (ticket_number, user_id, status: 'Open')
    Database-->>Backend: Created Ticket (e.g. PH-2026-104921)
    Backend-->>Student: Ticket Reference & Real-Time Notification
    
    Admin->>Backend: GET /api/support/admin/tickets (filter by status, category, priority)
    Backend->>Database: SELECT with user profile join
    Database-->>Admin: Populated Ticket Queue

    Admin->>Backend: POST /api/support/admin/tickets/:id/reply (message, is_internal: false)
    Backend->>Database: UPDATE support_tickets (append to messages JSONB, status: 'Waiting for User')
    Backend->>Student: Dispatch in-app Notification & Socket Alert
    
    Student->>Backend: POST /api/support/tickets/:id/reply (user response)
    Backend->>Database: UPDATE support_tickets (append to messages JSONB, status: 'Waiting for Admin')
    Backend->>Admin: Queue status badge dynamically switches to 'Waiting for Admin'

    Admin->>Backend: PATCH /api/support/admin/tickets/:id/status (status: 'Resolved')
    Backend->>Database: UPDATE status = 'Resolved', updated_at = NOW()
    Backend->>Student: Ticket resolved notification & satisfaction rating prompt
```

---

## 📱 Frontend Application Map (39 Routes)

The Next.js 16 App Router application compiles into **39 optimized production routes** categorized into three primary zones:

```text
frontend/src/app/
├── (app)/                          # Authenticated Student Zone
│   ├── dashboard/                  # Personalized student feed, task list, squad status
│   ├── feed/                       # Campus social feed, interactive polls, code snippets
│   ├── friends/                    # Peer connections and collaboration requests
│   ├── generator/                  # AI sprint task and project idea generator
│   ├── help/                       # Two-way student assistance helpline & ticket tracker
│   ├── messages/                   # Socket.IO direct & team chat with delivery receipts
│   ├── notifications/              # In-app real-time notification center
│   ├── people/                     # Student directory and skill-based teammate finder
│   ├── profile/                    # Personal portfolio, verified badges, academic credentials
│   │   ├── [id]/                   # Public peer portfolio inspection
│   │   └── view/                   # Self profile preview mode
│   ├── projects/                   # Incubation project directory & filtering
│   │   └── [id]/development/       # Project sprint Kanban task board & repo workspace
│   ├── saved/                      # Bookmarked projects, squads, and posts
│   ├── settings/                   # Theme toggle, notification channels, privacy controls
│   ├── showcase/                   # University product showcase & hackathon pitches
│   └── teams/                      # Squad discovery & recruitment
│       ├── [id]/                   # Discord-grade squad workspace (roster, chat, applicants)
│       └── create/                 # Squad creation wizard
│
├── admin/                          # Super Admin Control Center
│   ├── login/                      # Dedicated administrative authentication terminal
│   ├── dashboard/                  # Live system telemetry, node ping, server health metrics
│   ├── audit/                      # Terminal-style immutable audit trail viewer
│   ├── moderation/                 # Content moderation (reported posts, attachment scans)
│   ├── support/                    # Helpline administration, ticket queues, investigation
│   ├── system/                     # Feature kill switches (maintenance mode, registration)
│   ├── teams/                      # University-wide squad governance & dispute mediation
│   └── users/                      # User management (disciplinary strikes, bans, role changes)
│
└── public/                         # Public & Authentication Landing Zone
    ├── /                           # High-converting landing page with live statistics
    ├── login/                      # Student authentication (email/password, Google OAuth)
    ├── register/                   # Student registration & university credential intake
    ├── forgot-password/            # Password recovery dispatch
    ├── reset-password/             # Secure token-based password reset
    ├── verify-email/               # Email verification callback handler
    ├── privacy/                    # Platform privacy policy (GDPR & FERPA aligned)
    └── terms/                      # Platform terms of service
```

---

## 🔌 Backend REST & WebSocket API Reference

The Express 5 backend powers **14 modular route controllers** accessible under the `/api` prefix:

| Controller Module | Route Prefix | Primary Endpoints | Access Control |
|:---|:---|:---|:---:|
| **Authentication** | `/api/auth` | `/register`, `/login`, `/google`, `/refresh`, `/logout`, `/verify-email` | Public |
| **Admin Authentication** | `/api/admin/auth` | `/login`, `/me`, `/logout` | Super Admin |
| **Admin Management** | `/api/admin` | `/stats`, `/users`, `/teams`, `/audit-logs`, `/system-flags`, `/ban` | Admin / Super Admin |
| **Users & Profiles** | `/api/users` | `/me`, `/profile/:id`, `/update`, `/skills`, `/badges` | Authenticated |
| **Teams & Squads** | `/api/teams` | `/`, `/:id`, `/create`, `/:id/join`, `/:id/applicants`, `/:id/leave` | Authenticated |
| **Projects & Showcase** | `/api/projects` | `/`, `/:id`, `/create`, `/:id/upvote`, `/showcase` | Authenticated / Public |
| **Kanban Tasks** | `/api/tasks` | `/:projectId`, `/create`, `/:id/status`, `/:id/assign` | Team Members |
| **Conversations** | `/api/conversations`| `/`, `/:id/messages`, `/direct/:userId` | Authenticated |
| **Messages & Chat** | `/api/messages` | `/send`, `/room/:roomId`, `/react`, `/pin`, `/read` | Authenticated |
| **Audio/Video Calls** | `/api/calls` | `/token`, `/room/:roomName`, `/session`, `/end` | Authenticated |
| **Campus Feed** | `/api/posts` | `/`, `/:id`, `/create`, `/:id/comment`, `/:id/upvote` | Authenticated / Public |
| **Notifications** | `/api/notifications`| `/`, `/:id/read`, `/mark-all-read` | Authenticated |
| **Support Helpline** | `/api/support` | `/tickets`, `/tickets/:id`, `/tickets/:id/reply`, `/admin/*` | Authenticated / Admin |
| **HiveMind AI** | `/api/ai` | `/chat`, `/analyze-image`, `/generate-tasks`, `/pitch` | Authenticated |

---

## 🛠️ Quickstart & Local Environment Setup

### Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase Account**: (Free tier PostgreSQL database & Storage)
- **LiveKit Cloud Account**: (Free tier WebRTC SFU)
- **Groq & Google Gemini API Keys**: (Free tier AI inference)

### 1. Clone & Install
```bash
git clone https://github.com/Ti838/Project-Hive.git
cd Project-Hive
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-super-secure-jwt-secret-key-32-chars-min
ADMIN_EMAIL=timonbiswas33@gmail.com
ADMIN_PASSWORD=ProjectHive@Admin2026!
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
BREVO_API_KEY=your-brevo-api-key
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-project.livekit.cloud
```

### 3. Deploy Master Database Schema
1. Open the **[Supabase Dashboard](https://supabase.com/dashboard)** $\rightarrow$ **SQL Editor**.
2. Open [`server/database/schema.sql`](file:///c:/Users/TIMON/Desktop/Project-Hive/server/database/schema.sql).
3. Copy all contents, paste into the SQL Editor, and click **Run**.
4. The database is instantly provisioned with all 16 tables, RLS policies, triggers, and the pre-seeded super administrator!

### 4. Start Development Servers

**Start Backend (Terminal 1):**
```bash
cd server
npm install
npm run dev
```

**Start Frontend (Terminal 2):**
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the student platform, or `http://localhost:3000/admin/login` to access the Super Administrator Command Center.

---

## 🧪 Verification & Health Auditing

Automated CLI verification scripts ensure platform health before any deployment:

```bash
# 1. Verify Supabase Database & Security Policies
node --env-file=server/.env -e "import('./server/config/db.js').then(m => m.connectDB())"

# 2. Test Express Backend Application Loading
node --env-file=server/.env -e "import('./server/app.js').then(() => console.log('✅ Backend Loaded'))"

# 3. Test Full Next.js 16 Production Build
npm run build --prefix frontend
```

---

## 📜 License

ProjectHive is licensed under the **[MIT License](LICENSE)**.

Copyright (c) 2025-2026 ProjectHive Contributors. All rights reserved.
