<p align="center">
  <img src="frontend/public/logo.png" width="140" alt="ProjectHive Logo" />
</p>

<h1 align="center">ProjectHive 🐝 — System Architecture & Technical Specifications</h1>

<p align="center">
  <strong>Comprehensive Engineering Blueprints, Multi-Model Routing, LiveKit SFU Calling & Entity-Relationship Schemas</strong>
</p>

---

## 1. Master System Topology & Infrastructure Blueprint

ProjectHive implements a microservices-inspired monolithic edge architecture. Next.js 16 App Router handles the client tier and static pre-rendering on Vercel, while Node.js/Express and Socket.IO power the stateful real-time backend on Render. Persistent data resides in Supabase PostgreSQL, media streams are handled by LiveKit Cloud SFU, and AI reasoning is distributed across a 4-tier cascading model pool.

```mermaid
graph TD
    %% Clients
    subgraph Client_Ecosystem ["Client Tier (Next.js 16 App Router / React 19)"]
        BrowserMobile["Mobile Client (< 640px)"]
        BrowserDesktop["Desktop Client (>= 1024px)"]
        AppShell["Global AppShell & Topbar"]
        HiveMindWidget["HiveMind AI Copilot (STT / TTS / Vision)"]
        LiveKitWidget["MinimizedCallWidget (PiP Docking)"]
        SocketEngine["useSocket Client Hook"]
        StoreLayer["Zustand State Stores (Auth, UI, Call)"]
    end

    %% Edge CDN
    subgraph Edge_Infrastructure ["Edge & Routing Tier (Vercel)"]
        VercelCDN["Vercel Global CDN & Static Assets"]
        NextServer["Next.js SSR & Server Actions Runtime"]
    end

    %% Backend Engine
    subgraph Backend_Gateway ["Backend Gateway (Render.com Node.js Engine)"]
        ExpressRouter["Express 4.x Gateway"]
        AuthMiddleware["JWT Authentication Guard"]
        RateLimiter["express-rate-limit (OWASP)"]
        LiveKitTokenService["LiveKit AccessToken Issuer"]
        SocketCluster["Socket.IO 4.x WebSocket Hub"]
        DBConnector["Supabase JS / pg Connection Pool"]
    end

    %% Multi-Model AI Engine
    subgraph AI_Inference_Cluster ["Cascading AI Cluster (100% Free Tier)"]
        GroqTier["Tier 1: Groq Cloud (Llama-3.3-70B-versatile)"]
        GeminiTier["Tier 2: Google Gemini Flash (Vision & Text)"]
        OpenRouterTier["Tier 3: OpenRouter Free Failover Pool"]
        WebSpeechTier["Tier 4: Browser Web Speech API (STT & TTS)"]
    end

    %% Cloud Services & Persistence
    subgraph Persistence_Media ["Cloud Infrastructure & Real-Time Media"]
        PostgreSQL[("Supabase PostgreSQL Database")]
        LiveKitCluster["LiveKit Cloud SFU Media Server"]
        BrevoSMTP["Brevo SMTP Transactional Mailer"]
    end

    %% Connections
    BrowserMobile --> VercelCDN
    BrowserDesktop --> VercelCDN
    VercelCDN --> NextServer
    NextServer --> AppShell
    AppShell --> StoreLayer
    StoreLayer --> SocketEngine

    AppShell -->|HTTPS REST API| ExpressRouter
    SocketEngine <-->|WSS Bi-directional| SocketCluster
    ExpressRouter --> AuthMiddleware
    AuthMiddleware --> RateLimiter
    RateLimiter --> DBConnector
    DBConnector --> PostgreSQL
    SocketCluster --> PostgreSQL

    ExpressRouter --> LiveKitTokenService
    LiveKitTokenService -->|Minted JWT Token| LiveKitWidget
    LiveKitWidget <-->|WebRTC SFU Tracks| LiveKitCluster

    HiveMindWidget <--> WebSpeechTier
    ExpressRouter --> GroqTier
    GroqTier -.->|Failover on Quota/Limit| GeminiTier
    GeminiTier -.->|Failover on Quota/Limit| OpenRouterTier
    ExpressRouter --> BrevoSMTP
```

---

## 2. Database Entity-Relationship Diagram (ERD)

The persistent database schema is hosted on Supabase (PostgreSQL), utilizing foreign key constraints, cascading deletions, and indexed lookups for fast retrieval across users, squads, messages, feed posts, tickets, and audit trails.

```mermaid
erDiagram
    USERS ||--o{ TEAM_MEMBERS : "joins"
    USERS ||--o{ TEAMS : "owns/leads"
    USERS ||--o{ TEAM_JOIN_REQUESTS : "applies"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ POSTS : "publishes"
    USERS ||--o{ POST_REACTIONS : "reacts"
    USERS ||--o{ TICKETS : "files"
    USERS ||--o{ AUDIT_LOGS : "triggers (admin)"

    TEAMS ||--o{ TEAM_MEMBERS : "contains"
    TEAMS ||--o{ TEAM_JOIN_REQUESTS : "receives"
    TEAMS ||--o{ MESSAGES : "hosts group chat"

    POSTS ||--o{ POST_REACTIONS : "accumulates"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string university
        string role "student | admin"
        string avatar_color
        string bio
        string[] skills
        string github_url
        string linkedin_url
        boolean is_banned
        string last_login_ip
        string last_login_device
        timestamp created_at
        timestamp updated_at
    }

    TEAMS {
        uuid id PK
        string name
        string description
        string category
        uuid leader_id FK
        integer max_size
        string recruiting_status "recruiting | full"
        string[] required_skills
        timestamp created_at
    }

    TEAM_MEMBERS {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        string role "leader | member"
        timestamp joined_at
    }

    TEAM_JOIN_REQUESTS {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        string status "pending | accepted | rejected"
        string message
        timestamp created_at
    }

    MESSAGES {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK "nullable for team chat"
        uuid team_id FK "nullable for 1:1 chat"
        text content
        string image_url
        string status "sent | delivered | read"
        jsonb reactions
        timestamp created_at
    }

    POSTS {
        uuid id PK
        uuid author_id FK
        text content
        string image_url
        string post_type "general | project | question"
        timestamp created_at
    }

    POST_REACTIONS {
        uuid id PK
        uuid post_id FK
        uuid user_id FK
        string emoji
        timestamp created_at
    }

    TICKETS {
        uuid id PK
        uuid user_id FK
        string subject
        text message
        string category
        string status "open | in_progress | resolved"
        timestamp created_at
    }

    AUDIT_LOGS {
        uuid id PK
        string action "BAN_USER | DELETE_TEAM | UPDATE_FLAG"
        string admin_email
        jsonb details
        string ip_address
        string device_model
        timestamp created_at
    }

    SYSTEM_FLAGS {
        string key PK
        boolean value
        string description
        timestamp updated_at
    }
```

---

## 3. Multimodal AI Cascading Engine

The AI Copilot ("HiveMind AI") implements an intelligent 4-tier routing and failover cascade. It automatically prioritizes visual reasoning when images or diagrams are detected, and executes text and code synthesis through Groq with automated fallbacks.

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Developer
    participant UI as HiveMind Copilot (Frontend)
    participant Speech as Web Speech Engine (Browser)
    participant Gateway as Backend AI Controller
    participant Groq as Tier 1: Groq Cloud (Llama 3.3 70B)
    participant Gemini as Tier 2: Google Gemini 2.5 Flash
    participant OpenRouter as Tier 3: OpenRouter Free Pool

    alt User initiates Speech Dictation
        User->>Speech: Speaks into microphone
        Speech-->>UI: Live transcribed text
    end

    alt User attaches Screenshot / Diagram (or Ctrl+V)
        User->>UI: Paste clipboard image (Base64)
    end

    User->>UI: Click Send Prompt
    UI->>Gateway: POST /api/ai/chat { message, imageBase64, context }

    alt Image Input Detected (Vision Route)
        Gateway->>Gemini: gemini-2.5-flash (with inline image data)
        alt Gemini Vision Succeeds
            Gemini-->>Gateway: Formatted reasoning & code
        else Gemini Vision Quota Exceeded / Error
            Gateway->>OpenRouter: Failover to openrouter/free (multimodal model)
            OpenRouter-->>Gateway: Formatted reasoning & code
        end
    else Pure Text / Code Request
        Gateway->>Groq: llama-3.3-70b-versatile
        alt Groq Inference Succeeds
            Groq-->>Gateway: Ultra-fast token response (~250 tokens/s)
        else Groq Rate Limited (HTTP 429)
            Gateway->>Gemini: gemini-2.5-flash
            alt Gemini Succeeds
                Gemini-->>Gateway: Formatted response
            else Gemini Rate Limited
                Gateway->>OpenRouter: openrouter/free pool
                OpenRouter-->>Gateway: Fallback response
            end
        end
    end

    Gateway-->>UI: 200 OK { ok: true, reply, provider, model }
    UI-->>User: Render Markdown with syntax-highlighted code & copy action

    alt Auto-Speech TTS Enabled
        UI->>Speech: window.speechSynthesis.speak(sanitizedText)
        Speech-->>User: Natural audio playback
    end
```

---

## 4. LiveKit Cloud SFU Audio/Video Calling & PiP Docking

ProjectHive replaces legacy P2P mesh topologies with a high-performance **Selective Forwarding Unit (SFU)** cluster hosted on LiveKit Cloud. This enables multi-participant video calls with minimal client CPU and bandwidth overhead.

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Initiator (Squad Member)
    participant Frontend as ProjectHive Client
    participant Server as Backend Express Gateway
    participant LiveKitCloud as LiveKit Cloud SFU Cluster
    actor RemotePeer as Remote Teammate

    Caller->>Frontend: Click "Start Squad Call" (/teams/[id])
    Frontend->>Server: POST /api/calls/token { roomName: teamId, participantName: user.name }
    Server->>Server: Generate LiveKit JWT with VideoGrant { roomJoin: true, canPublish: true }
    Server-->>Frontend: 200 OK { token, liveKitUrl }

    Frontend->>LiveKitCloud: Connect via WSS with LiveKit JWT
    LiveKitCloud-->>Frontend: Connection Established (Participant Joined)

    Frontend->>LiveKitCloud: Publish Local Camera & Mic Tracks
    LiveKitCloud->>RemotePeer: Notify "track_published"
    RemotePeer->>LiveKitCloud: Subscribe to Remote Tracks
    LiveKitCloud-->>RemotePeer: Forward Video/Audio RTP Stream

    alt Minimized Mode (Picture-in-Picture)
        Caller->>Frontend: Click "Minimize Call"
        Frontend->>Frontend: Mount MinimizedCallWidget
        Note over Frontend: Mobile: Dock top-right (top-4 right-4)<br/>Desktop: Dock bottom-right (bottom-20 right-4)
    end

    alt Reconnection & Network Degradation
        LiveKitCloud->>Frontend: Signal connection quality: 'poor'
        Frontend->>Frontend: Auto-downgrade video resolution (Dynacast)
    end

    Caller->>Frontend: Click "End Call"
    Frontend->>LiveKitCloud: room.disconnect()
    LiveKitCloud->>RemotePeer: Participant disconnected
```

---

## 5. Real-Time Socket.IO Bi-directional Event Pipeline

The messaging system powers both direct messaging (`/messages`) and embedded squad channels (`/teams/[id]`). It supports optimistic UI updates, delivery status updates, and emoji reaction broadcasts.

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Student A (Client)
    participant SocketGateway as Socket.IO Hub (server.js)
    participant DB as Supabase PostgreSQL
    actor Bob as Student B (Client)

    Alice->>SocketGateway: connect(auth: { token: BearerJWT })
    SocketGateway-->>Alice: Connection Verified
    SocketGateway->>Bob: Emit 'user:online' { userId: Alice }

    Alice->>SocketGateway: Emit 'message:send' { recipientId: Bob, content: "Hello!" }
    SocketGateway->>DB: INSERT INTO messages (sender_id, receiver_id, content, status='sent')
    DB-->>SocketGateway: Record created { id: msg_01, status: 'sent' }

    SocketGateway-->>Alice: Emit 'message:sent' { messageId: msg_01, status: 'sent' }
    SocketGateway->>Bob: Emit 'message:new' { message: msg_01 }

    Bob->>SocketGateway: Emit 'message:read' { messageId: msg_01, senderId: Alice }
    SocketGateway->>DB: UPDATE messages SET status='read' WHERE id=msg_01
    SocketGateway->>Alice: Emit 'message:status_updated' { messageId: msg_01, status: 'read' }

    Bob->>SocketGateway: Emit 'message:react' { messageId: msg_01, emoji: '🔥' }
    SocketGateway->>DB: UPDATE messages SET reactions = reactions || '🔥'
    SocketGateway->>Alice: Emit 'message:reaction_added' { messageId: msg_01, emoji: '🔥', userId: Bob }
```

---

## 6. Team Collaboration & Join Request State Machine

Squad workflows are modeled as a deterministic state machine to ensure member counts never exceed squad capacity and leadership is securely preserved.

```mermaid
stateDiagram-v2
    [*] --> TeamCreated: Leader creates Squad

    state TeamCreated {
        [*] --> ActivelyRecruiting: Member Count < Max Size
        ActivelyRecruiting --> SquadFull: Member Count == Max Size
        SquadFull --> ActivelyRecruiting: Member leaves or is kicked
    }

    state JoinRequestLifecycle {
        [*] --> PendingRequest: Student submits Join Request
        PendingRequest --> Accepted: Leader approves request
        PendingRequest --> Rejected: Leader declines request
    }

    Accepted --> MemberAdded: Insert into team_members
    MemberAdded --> TeamCreated: Increment member_count

    state LeadershipLifecycle {
        LeaderRole --> MemberRole: Leader transfers ownership
        MemberRole --> LeaderRole: Target user becomes Leader
    }
```

---

## 7. Security, OWASP & Auth Token Lifecycle

ProjectHive maintains zero-trust security standards across all endpoints and browser sessions:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Gateway as Express Auth Router
    participant DB as Supabase DB

    User->>Gateway: POST /api/auth/login { email, password }
    Gateway->>DB: Query user by email
    DB-->>Gateway: User Record with bcrypt hash
    Gateway->>Gateway: bcrypt.compare(password, password_hash)

    alt Invalid Credentials
        Gateway-->>User: 401 Unauthorized { message: "Invalid email or password" }
    else Valid Credentials
        Gateway->>Gateway: Sign Access Token (15 min expiry)
        Gateway->>Gateway: Sign Refresh Token (7 days expiry)
        Gateway->>DB: Store active refresh token hash
        Gateway-->>User: 200 OK { accessToken, refreshToken, user }
    end

    Note over User: Subsequent Request with Expired Access Token
    User->>Gateway: GET /api/teams (with expired Bearer token)
    Gateway-->>User: 401 Unauthorized { code: "TOKEN_EXPIRED" }

    User->>Gateway: POST /api/auth/refresh { refreshToken }
    Gateway->>DB: Verify active refresh token in database
    Gateway->>Gateway: Issue new Access Token (15 min) & rotated Refresh Token
    Gateway-->>User: 200 OK { accessToken: newAccess, refreshToken: newRefresh }
    User->>Gateway: Retry GET /api/teams (with newAccess)
    Gateway-->>User: 200 OK { teams: [...] }
```

---

## 8. International Responsive Design System Standards

1. **Dynamic Viewport Height (`100dvh`)**: All full-screen viewports enforce `min-height: 100dvh` in `globals.css` and template containers to prevent layout jumps when mobile address bars expand or collapse.
2. **iOS Safari Auto-Zoom Prevention**: Form text inputs enforce `text-base sm:text-sm` (minimum 16px computed font size on mobile viewports) to prevent browser auto-zooming on focus.
3. **WCAG 2.1 AAA Touch Targets**: All interactive elements (navigation buttons, dropdown toggles, modal closures, and action pills) enforce a strict minimum boundary of `44x44px` (`.touch-target`).
4. **Dual Presentation Data Layouts**:
   - Desktop (`>= 768px`): High-density tabular views (`hidden md:block`).
   - Mobile (`< 768px`): Zero-horizontal-scroll stacked card views (`md:hidden`) with hardware, network, and contextual actions.
5. **Zero Cumulative Layout Shift (CLS)**: Skeletons (`.skeleton-shimmer`) match the exact pixel dimensions of resolved data components, eliminating page jumpiness during async fetching.

---

## 📜 License

This architecture and codebase are licensed under the **[MIT License](LICENSE)**.

Copyright (c) 2025-2026 ProjectHive Contributors.
