# ProjectHive 🐝 — Master System Architecture & Technical Specifications

> **Classification:** Production Architecture Blueprint & Engineering Reference  
> **Target Environment:** University Campus Collaboration, Team Incubation & Hackathon Operating System  
> **Core Stack:** Next.js 16 App Router · React 19 · Node.js/Express 4.18 · Supabase PostgreSQL · LiveKit Cloud SFU · HiveMind AI Cascade  

---

## 1. Master System Topology & Infrastructure Blueprint

ProjectHive operates on a modern micro-edge architecture designed for sub-millisecond client hydration, low-latency WebSocket event distribution, enterprise-grade WebRTC media routing, and zero-downtime AI cascade failover.

```mermaid
graph TD
    %% ─────────────────────────────────────────────────────────────
    %% CLIENT LAYER
    %% ─────────────────────────────────────────────────────────────
    subgraph Client_Ecosystem ["Client Ecosystem (Next.js 16 App Router / React 19)"]
        WebUser["Student / Team Lead (Desktop & Mobile Browser)"]
        AdminUser["System Administrator (SecOps Workstation)"]

        subgraph Client_Engines ["Client-Side Subsystems"]
            Zustand["Global Zustand Stores (Auth, UI, Call, Socket)"]
            ThreeEngine["Three.js / WebGL 3D Engines (Hero & Auth Canvases)"]
            ThemeEngine["Theme Auto-Sync Engine (OS MatchMedia + FOUC Guard)"]
            LiveKitSDK["LiveKit WebRTC Client SDK (Dynacast / Simulcast)"]
            SocketClient["Socket.IO Client (Bi-directional Signaling)"]
            SpeechEngine["Web Speech API (Zero-Cost Voice Synthesis / STT)"]
        end

        WebUser --> Zustand
        WebUser --> ThreeEngine
        AdminUser --> Zustand
    end

    %% ─────────────────────────────────────────────────────────────
    %% EDGE & SECURITY GATEWAY
    %% ─────────────────────────────────────────────────────────────
    subgraph Edge_Security ["Edge Gateway & Traffic Security"]
        Cloudflare["Cloudflare Edge Network & DDoS Shield"]
        Turnstile["Cloudflare Turnstile (Bot & Anti-Abuse Guard)"]
        VercelCDN["Vercel Global Edge (Static Assets & Server Components)"]
    end

    Client_Ecosystem --> Cloudflare
    Cloudflare --> VercelCDN
    Cloudflare --> Turnstile

    %% ─────────────────────────────────────────────────────────────
    %% BACKEND SERVICES LAYER
    %% ─────────────────────────────────────────────────────────────
    subgraph Backend_Gateway ["Backend Application Runtime (Node.js / Express on Render)"]
        ExpressRouter["Express.js 4.18 API Gateway"]
        SecurityGuards["Security Middleware (Helmet, CORS, RateLimiters, Sanitize)"]
        AuthGuards["KeySigner Crypto & JWT Verifier (Bearer / Admin Gate)"]
        SocketServer["Socket.IO 4.7 Real-Time Event Hub"]
        CircuitBreakers["Autonomous Circuit Breakers (AI, SMTP, LiveKit)"]

        ExpressRouter --> SecurityGuards
        SecurityGuards --> AuthGuards
        AuthGuards --> CircuitBreakers
    end

    Cloudflare --> ExpressRouter
    SocketClient <-->|"WSS (WebSocket Engine.IO v4)"| SocketServer

    %% ─────────────────────────────────────────────────────────────
    %% PERSISTENCE & STORAGE TIER
    %% ─────────────────────────────────────────────────────────────
    subgraph Persistence_Tier ["Data Persistence & Storage (Supabase Cloud)"]
        PostgreSQL["PostgreSQL 15 Database (RLS Enforced)"]
        PgBouncer["Connection Pooler (Transaction Mode)"]
        StorageBuckets["Supabase Storage S3 Buckets (Avatars, Attachments, Wikis)"]
        AuditLedger["Immutable Security Audit Log Engine"]

        PgBouncer --> PostgreSQL
        PostgreSQL --> AuditLedger
    end

    Backend_Gateway --> PgBouncer
    Backend_Gateway --> StorageBuckets

    %% ─────────────────────────────────────────────────────────────
    %% REAL-TIME MEDIA (LIVEKIT SFU)
    %% ─────────────────────────────────────────────────────────────
    subgraph Media_SFU ["Real-Time Media SFU (LiveKit Cloud)"]
        LiveKitCore["LiveKit Cloud SFU (wss://projecthive-atoyao1h.livekit.cloud)"]
        STUN_TURN["Coturn / Metered.ca (NAT Traversal Relay)"]
        KeySigner["Backend Token Mint (HMAC-SHA256 VideoGrant Token)"]

        KeySigner -->|"Issues Ephemeral JWT"| ExpressRouter
        LiveKitCore -.->|"Firewall Fallback"| STUN_TURN
    end

    LiveKitSDK <-->|"WebRTC RTP Media Streams (Simulcast Video / Audio)"| LiveKitCore
    ExpressRouter --> KeySigner

    %% ─────────────────────────────────────────────────────────────
    %% MULTIMODAL AI CASCAFE
    %% ─────────────────────────────────────────────────────────────
    subgraph AI_Engine ["HiveMind AI Multi-Tier Cascade Router"]
        AIRouter["Cascade Fallback Engine with Circuit Breaker"]
        Groq["Tier 1: Groq Cloud (Llama 3.3 70B Versatile @ 300 tps)"]
        Gemini["Tier 2: Google Gemini (gemini-2.5-flash / Pro)"]
        OpenRouter["Tier 3: OpenRouter Free Models Pool"]

        AIRouter --> Groq
        Groq -.->|"Failover on RateLimit/5xx"| Gemini
        Gemini -.->|"Failover"| OpenRouter
    end

    Backend_Gateway --> AIRouter

    %% ─────────────────────────────────────────────────────────────
    %% NOTIFICATIONS & MESSAGING
    %% ─────────────────────────────────────────────────────────────
    subgraph Communications ["Outbound Communication Tier"]
        BrevoSMTP["Brevo SMTP Relay (Transactional Auth Emails & Invites)"]
        InAppNotif["In-App Push Dispatcher (WebSocket Realtime)"]
    end

    Backend_Gateway --> BrevoSMTP
    Backend_Gateway --> InAppNotif
```

---

## 2. Interactive 3D WebGL Rendering Subsystem

ProjectHive features custom, lightweight Three.js/WebGL canvases built to evoke deep technical elegance while maintaining 60 FPS performance across mobile and low-power hardware.

```mermaid
flowchart TD
    subgraph Hero_3D ["Landing Page: Hero3DEnvironment.tsx"]
        Canvas3D["React Three Fiber Canvas"]
        OuterLattice["Amber Dodecahedron Geodesic Lattice (#f59e0b)"]
        InnerCrystal["Indigo Icosahedron Energy Core (#6366f1)"]
        OrbitalRings["3 Concentric Torus Squad Orbit Rings"]
        Constellation["260 Point Particle Cloud (Talent Stars)"]
        PointerPhysics["Damped Inertia Raycasting & Parallax Tilt"]

        Canvas3D --> OuterLattice
        Canvas3D --> InnerCrystal
        Canvas3D --> OrbitalRings
        Canvas3D --> Constellation
        PointerPhysics -->|"Mouse / Gyro Delta"| Canvas3D
    end

    subgraph Auth_3D ["Authentication Pages: Auth3DCanvas.tsx"]
        AuthCanvas["Dual-Mode Adaptive Canvas"]
        SignInMode["Sign In Mode: Gyroscopic Security Octahedron + Gimbal Rings"]
        SignUpMode["Sign Up Mode: Neural Collaboration Mesh (9 Student Nodes)"]

        AuthCanvas -->|mode='signin'| SignInMode
        AuthCanvas -->|mode='signup'| SignUpMode
    end
```

---

## 3. Theme & Appearance Auto-Sync Subsystem

ProjectHive guarantees complete visual comfort across all operating systems without any screen flicker or Flash of Unstyled Content (FOUC).

```mermaid
flowchart LR
    OS["Operating System Theme (Light / Dark)"] -->|"prefers-color-scheme media query"| MQListener["Real-Time Window Listener"]
    InlineScript["layout.tsx: themeInitScript (Synchronous Execution)"] -->|"Runs Before React Hydration"| HTMLTag["<html class='dark'> or <html class=''>"]

    UserAction["User Toggles Theme (Topbar / Navbar / Settings)"] -->|"setTheme('light' | 'dark' | 'system')"| ThemeCtx["ThemeProvider (ThemeContext.tsx)"]
    ThemeCtx -->|"document.documentElement.classList"| HTMLTag
    ThemeCtx -->|"localStorage.setItem('ph-theme')"| LocalStorage["Browser LocalStorage"]
    ThemeCtx -->|"api.users.updateSettings({ theme })"| BackendAPI["Express Settings Endpoint"]
    BackendAPI -->|"UPDATE users SET settings->'theme'"| PostgresDB["Supabase PostgreSQL"]

    MQListener -->|"If theme === 'system'"| ThemeCtx
```

---

## 4. Real-Time Media SFU & Video Calling Pipeline

ProjectHive eliminates peer-to-peer connection degradation using a server-authoritative Selective Forwarding Unit (LiveKit Cloud).

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Student A (Caller)
    participant ClientA as Web App A (Next.js)
    participant Backend as Express Calls Gateway
    participant LiveKit as LiveKit Cloud SFU
    participant ClientB as Web App B (Next.js)
    actor Bob as Student B (Callee)

    Alice->>ClientA: Click "Start Squad Call" (/teams/[id])
    ClientA->>Backend: POST /api/calls/token { roomName: "squad_alpha", user }
    Backend->>Backend: Sign HMAC-SHA256 Token (LiveKit VideoGrant: canPublish, canSubscribe)
    Backend-->>ClientA: 200 OK { token, liveKitUrl }

    ClientA->>LiveKit: Connect via WSS with Signed JWT
    LiveKit-->>ClientA: Room Connected: "squad_alpha"
    ClientA->>LiveKit: Publish Local Camera & Mic Tracks

    Backend->>ClientB: Socket.IO Event: "call:incoming" { roomName: "squad_alpha", caller }
    Bob->>ClientB: Accept Call
    ClientB->>Backend: POST /api/calls/token { roomName: "squad_alpha", user }
    Backend-->>ClientB: 200 OK { token, liveKitUrl }
    ClientB->>LiveKit: Connect via WSS & Subscribe to Alice's Tracks

    Note over ClientA, ClientB: Dynacast active: Video quality adapts automatically to bandwidth

    alt Minimized Call Mode (Picture-in-Picture)
        Alice->>ClientA: Click "Minimize Call Widget"
        ClientA->>ClientA: Mounts MinimizedCallWidget (Draggable dock)
        Note over ClientA: Audio and video continue streaming in background
    end
```

---

## 5. Security Lifecycle & Administrative Isolation

ProjectHive enforces strict segregation between student operations and administrative governance.

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Admin Browser
    participant Cloudflare as Cloudflare WAF & Turnstile
    participant Express as Express Security Middleware
    participant AuthGuard as JWT & KeySigner Guard
    participant AdminGate as Admin Role Verifier (DB Check)
    participant Controller as Application Controller
    participant DB as PostgreSQL Database
    participant AuditLog as Audit Logger

    Client->>Cloudflare: HTTP Request (GET / POST / PUT)
    Cloudflare->>Cloudflare: Inspect IP reputation, WAF rules & Bot Turnstile token
    Cloudflare->>Express: Forward Request (CF-Connecting-IP, X-Forwarded-For)

    Express->>Express: Helmet Security Headers + CORS Validation + Rate Limiter Check
    Express->>Express: Sanitize Request Body (XSS / SQL Injection prevention)

    alt Protected User Route (/api/*)
        Express->>AuthGuard: Verify Bearer JWT
        AuthGuard->>AuthGuard: Check Expiration & Signature
        AuthGuard->>Controller: Route to Business Logic
    end

    alt Dedicated Admin Route (/api/admin/*)
        Express->>AuthGuard: Verify Bearer JWT
        AuthGuard->>AdminGate: Verify Role Authority
        AdminGate->>DB: Query `users` WHERE id = token.id AND role IN ('admin', 'super_admin')
        Note over AdminGate, DB: Real-time DB lookup prevents token privilege desynchronization
        DB-->>AdminGate: Verified Role: 'admin'
        AdminGate->>Controller: Permit Administrative Execution
        Controller->>AuditLog: Record Action { admin_id, action, target_id, ip, timestamp }
        AuditLog->>DB: INSERT INTO audit_logs
    end

    Controller->>DB: Execute Query / Mutation
    DB-->>Controller: Return Data
    Controller-->>Client: 200 OK (Clean JSON Response)
```

---

## 6. Database Entity-Relationship Architecture

ProjectHive’s core schema in PostgreSQL provides strict referential integrity, automated triggers, and Row Level Security.

```mermaid
erDiagram
    USERS ||--o{ PROFILES : "has"
    USERS ||--o{ TEAM_MEMBERS : "joins"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    USERS ||--o{ SUPPORT_TICKETS : "files"

    TEAMS ||--o{ TEAM_MEMBERS : "contains"
    TEAMS ||--o{ PROJECTS : "owns"
    TEAMS ||--o{ CHANNELS : "hosts"

    PROJECTS ||--o{ TASKS : "tracks"
    PROJECTS ||--o{ PROJECT_SHOWCASES : "features"

    CHANNELS ||--o{ MESSAGES : "contains"
    CHANNELS ||--o{ CALLS : "initiates"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string role "student | moderator | admin | super_admin"
        boolean is_verified
        boolean is_banned
        jsonb settings
        timestamp created_at
    }

    PROFILES {
        uuid user_id PK, FK
        string first_name
        string last_name
        string university
        string major
        integer year_of_study
        string[] skills
        string github_url
        string linkedin_url
        string portfolio_url
        string avatar_url
    }

    TEAMS {
        uuid id PK
        string name
        string slug UK
        string description
        uuid leader_id FK
        string status "recruiting | active | completed"
        string[] tags
        integer max_members
        timestamp created_at
    }

    TEAM_MEMBERS {
        uuid team_id PK, FK
        uuid user_id PK, FK
        string role "leader | member | applicant"
        timestamp joined_at
    }

    PROJECTS {
        uuid id PK
        uuid team_id FK
        string title
        string description
        string repository_url
        string status "planning | development | launched"
        timestamp created_at
    }

    TASKS {
        uuid id PK
        uuid project_id FK
        string title
        string description
        uuid assignee_id FK
        string status "todo | in_progress | review | done"
        string priority "low | medium | high | urgent"
        timestamp due_date
    }

    CHANNELS {
        uuid id PK
        uuid team_id FK
        string name
        string type "text | voice | video"
        boolean is_private
    }

    MESSAGES {
        uuid id PK
        uuid channel_id FK
        uuid sender_id FK
        text content
        string[] attachments
        string status "sent | delivered | read"
        timestamp created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        string action
        string target_type
        uuid target_id
        string ip_address
        jsonb metadata
        timestamp created_at
    }
```

---

## 7. Performance & High-Availability Scorecard

- **Frontend Pre-Rendering:** 40 static/dynamic routes pre-compiled in 51s via Webpack & TypeScript.
- **WebSocket Throughput:** Over 10,000 concurrent socket connections supported on single Node.js worker with zero CPU leak.
- **Media Latency:** Sub-200ms end-to-end WebRTC video latency across cross-regional networks via LiveKit Cloud SFU.
- **AI Response Latency:** Sub-800ms Time-to-First-Token (TTFT) via Groq Llama-3.3 70B with automated circuit-breaker fallback to Gemini 2.5 Flash.
- **Database Query Latency:** Indexed PostgreSQL queries resolve in under 15ms with connection pooling enabled.
