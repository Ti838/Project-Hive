# 23: COMPREHENSIVE SYSTEM ARCHITECTURE DIAGRAMS

> **Document Classification:** Master Visual Architectural Reference & Diagram Repository  
> **Extraction Evidence Level:** `[VERIFIED]` Architecture Specifications & Runtime Models  

---

## 1. Master System Topology

```mermaid
graph TD
    subgraph Client_Tier ["Client Tier (Next.js 16 App Router / React 19 / Turbopack)"]
        BrowserDesktop["Desktop Workstation Client (>= 1024px)"]
        BrowserMobile["Mobile Smartphone Client (< 640px)"]
        AppShell["Global AppShell (Topbar, Sidebar, MobileNav)"]
        HiveAICopilot["HiveMind AI Copilot (Drawer & Studio)"]
        LiveKitWidget["MinimizedCallWidget (PiP Ambient Dock)"]
        SocketHook["useSocket Singleton Client Hook"]
        ZustandStores["Zustand Stores (Auth, Socket, UI, Call)"]
    end

    subgraph Edge_Infrastructure ["Edge & Routing Infrastructure (Vercel)"]
        VercelCDN["Vercel Global Edge CDN"]
        NextServer["Next.js SSR & Server Runtime"]
    end

    subgraph Backend_Gateway ["Backend Gateway (Render.com Node.js Runtime)"]
        ExpressApp["Express.js 4.18 REST Router"]
        HelmetSecurity["Helmet CSP & HSTS Headers"]
        RateLimiter["express-rate-limit (Global 100/15m, Auth 20/15m)"]
        KeySignerService["KeySigner Cryptographic Layer (HS256/RS256)"]
        SanitizerService["Zero-Leak AI Prompt Sanitizer"]
        SocketHub["Socket.IO 4.7 WebSocket Server"]
        LiveKitTokenService["LiveKit AccessToken Minting Engine"]
        DBConnector["Supabase Client (supabaseAdmin)"]
    end

    subgraph Persistence_Media ["Persistence, Cloud Media & Mail"]
        SupabasePostgres[("Supabase PostgreSQL (Singapore Region)")]
        SupabaseBuckets["Supabase S3 Buckets (avatars, banners, attachments)"]
        LiveKitSFU["LiveKit Cloud SFU (wss://project-hive-o0q9p17e.livekit.cloud)"]
        BrevoSMTP["Brevo SMTP / Transactional Mailer"]
    end

    subgraph AI_Inference_Cluster ["Cascading AI Cluster (100% Free Tier)"]
        GroqTier["Tier 1: Groq Cloud (openai/gpt-oss-20b, 120b)"]
        GeminiTier["Tier 2: Google Gemini 2.0 Flash (Vision & Text)"]
        OpenRouterTier["Tier 3: OpenRouter Free Failover Pool"]
        WebSpeechTier["Tier 4: Browser Web Speech API (Client STT/TTS)"]
    end

    BrowserDesktop --> VercelCDN
    BrowserMobile --> VercelCDN
    VercelCDN --> NextServer
    NextServer --> AppShell
    AppShell --> ZustandStores
    ZustandStores --> SocketHook

    AppShell -->|HTTPS REST API| ExpressApp
    SocketHook <-->|WSS Bi-Directional| SocketHub

    ExpressApp --> HelmetSecurity
    HelmetSecurity --> RateLimiter
    RateLimiter --> KeySignerService
    KeySignerService --> DBConnector

    DBConnector --> SupabasePostgres
    DBConnector --> SupabaseBuckets
    SocketHub --> SupabasePostgres
    ExpressApp --> BrevoSMTP

    ExpressApp --> LiveKitTokenService
    LiveKitTokenService -->|Minted Video Grant JWT| LiveKitWidget
    LiveKitWidget <-->|WebRTC Media Tracks| LiveKitSFU

    ExpressApp --> SanitizerService
    SanitizerService --> GroqTier
    GroqTier -.->|Failover on 429| GeminiTier
    GeminiTier -.->|Failover on 503| OpenRouterTier
    HiveAICopilot <--> WebSpeechTier
```

---

## 2. LiveKit WebRTC Call State Machine

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

## 3. Data Flow Diagram: Level 1 (Collaborative Incubation)

```mermaid
flowchart LR
    StudentUser(("Student User"))
    
    subgraph Processes ["ProjectHive Core Processes"]
        P1["1.0 Authenticate & Verify Profile"]
        P2["2.0 Discover & Apply to Squads"]
        P3["3.0 Real-Time Chat & In-Call Whiteboard"]
        P4["4.0 GitHub Repository Workspace"]
        P5["5.0 Cascading AI Copilot"]
        P6["6.0 Showcase Project Pitch"]
    end

    subgraph DataStores ["Data Stores"]
        D1[("D1: Users & Profiles")]
        D2[("D2: Teams & Join Requests")]
        D3[("D3: Messages & Call Sessions")]
        D4[("D4: Projects & Upvotes")]
        D5[("D5: Admin Audit & System Flags")]
    end

    StudentUser -->|Credentials| P1
    P1 -->|JWT Tokens| StudentUser
    P1 <-->|Read / Write Identity| D1

    StudentUser -->|Search & Applications| P2
    P2 <-->|Squad Queries| D2

    StudentUser <-->|WebSocket Events| P3
    P3 <-->|Persist Messages| D3

    StudentUser -->|Repo Inspection & AI Review| P4
    StudentUser -->|Prompts & Screenshots| P5
    P5 <-->|Scrubbed Inference| ExternalAI["External LLM Cluster"]

    StudentUser -->|Submit Project & Upvote| P6
    P6 <-->|Showcase Records| D4
```

---

## 4. Zero-Trust Security & Row Level Security (RLS) Isolation Architecture

```mermaid
flowchart TD
    ClientReq([Client DB Operation]) --> RoleCheck{Caller Security Role}

    RoleCheck -->|SUPABASE_SERVICE_ROLE_KEY| BackendEngine[Node.js Express / System Engine]
    BackendEngine --> FullBypass[Full Access / Service Role Bypass Policy]

    RoleCheck -->|Authenticated JWT| TableGuard{Table & Operation}
    
    TableGuard -->|users / user_settings| UserCheck{auth.uid == target_id}
    UserCheck -->|Match| AllowUser[Access Granted]
    UserCheck -->|Mismatch| BlockUser[IDOR Protection: Access Denied]

    TableGuard -->|support_tickets| TicketCheck{auth.uid == user_id}
    TicketCheck -->|Match| AllowTicket[Access Granted]
    TicketCheck -->|Mismatch| BlockTicket[Access Denied]

    TableGuard -->|admin_audit_logs| AdminBlock[Forbidden: No Client Access Permitted]

    TableGuard -->|tr_user_immutability Trigger| PrivCheck{Modifying role / is_banned / strikes?}
    PrivCheck -->|Yes| ElevateBlock[Privilege Escalation Blocked Exception]
    PrivCheck -->|No| AllowUpdate[Profile Fields Updated]

    RoleCheck -->|Anonymous Key| AnonGuard{Target Table}
    AnonGuard -->|posts, system_flags| AnonRead[Public Read-Only Allowed]
    AnonGuard -->|users, tickets, messages, admin_logs| AnonBlock[Access Denied]
```

