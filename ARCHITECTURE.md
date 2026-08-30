# ProjectHive 🐝 — System Architecture & Technical Specifications

> High-Performance Student Collaboration, Real-Time Networking, and Project Incubation Platform.

---

## 1. High-Level Architecture Overview

```mermaid
graph TD
    subgraph Client Layer [Next.js 16 Client & Static Web]
        App[Next.js App Router]
        ZStore[Zustand Global Store]
        SocketHook[useSocket Realtime Hook]
        Tailwind[Tailwind CSS v4 & Lucide]
    end

    subgraph CDN & Edge [Vercel Edge Network]
        Vercel[Vercel Serverless / Static CDN]
    end

    subgraph Backend Services [Render.com Node.js Runtime]
        Express[Express 4.x REST API Engine]
        SocketServer[Socket.IO 4.x WebSocket Gateway]
        AuthGuard[JWT & Rate Limiter Middleware]
        ErrorHandler[Central PostgreSQL/Supabase Error Handler]
    end

    subgraph Data & Cloud Layer
        Supabase[(Supabase PostgreSQL Database)]
        Brevo[Brevo SMTP Transactional Mail]
        Groq[Groq AI - Llama 3 Fast Inference]
        Gemini[Google Gemini 1.5 Fallback AI]
        WebRTC[WebRTC Signaling & Jitsi Relay]
    end

    App --> Vercel
    App -->|REST API over HTTPS| Express
    SocketHook <-->|Bi-directional WSS| SocketServer
    Express --> AuthGuard
    AuthGuard --> ErrorHandler
    Express --> Supabase
    Express --> Brevo
    Express --> Groq
    Express --> Gemini
    SocketServer <--> WebRTC
    SocketServer --> Supabase
```

---

## 2. Real-Time WebSocket Communication Flow

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Student A (Client)
    participant SocketGateway as Socket.IO Gateway
    participant SupabaseDB as Supabase Database
    actor Bob as Student B (Client)

    Alice->>SocketGateway: connect (with Bearer JWT)
    SocketGateway-->>Alice: connect_acknowledged
    SocketGateway->>Bob: status:update { userId: Alice, status: 'online' }

    Alice->>SocketGateway: join:room { roomId: "room_123" }
    Bob->>SocketGateway: join:room { roomId: "room_123" }

    Alice->>SocketGateway: typing:start { roomId: "room_123" }
    SocketGateway->>Bob: user:typing { userId: Alice }

    Alice->>SocketGateway: message:send { roomId: "room_123", content: "Hey!" }
    SocketGateway->>SupabaseDB: INSERT into messages
    SocketGateway->>Bob: message:received { id, sender, content: "Hey!" }
    SocketGateway-->>Alice: message:received (echo acknowledgement)

    Alice->>SocketGateway: typing:stop { roomId: "room_123" }
    SocketGateway->>Bob: user:stop-typing { userId: Alice }
```

---

## 3. WebRTC Voice & Video Signaling Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Caller
    participant Server as Socket.IO Signaling Server
    actor Callee as Callee

    Caller->>Server: call:initiate { roomId, targetId, callerName, isWebRTC: true }
    Server->>Callee: call:incoming { roomId, callerId, callerName }

    alt Call Accepted
        Callee->>Server: call:accept { roomId, targetId }
        Server->>Caller: call:accepted { roomId, peerId }
        Note over Caller,Callee: WebRTC P2P / TURN Stream Established
    else Call Declined
        Callee->>Server: call:decline { roomId, targetId }
        Server->>Caller: call:declined { roomId }
    end
```

---

## 4. Authentication & Token Refresh Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant API as Backend Auth Router
    participant DB as Supabase DB

    User->>API: POST /api/auth/login { email, password }
    API->>DB: Query user + verify bcrypt hash
    API-->>User: 200 OK { accessToken (15m), refreshToken (7d), user }
    Note over User: Tokens stored in Secure LocalStorage / State

    User->>API: GET /api/users/me (with expired token)
    API-->>User: 401 Unauthorized

    User->>API: POST /api/auth/refresh { refreshToken }
    API->>DB: Verify active refresh token
    API-->>User: 200 OK { new accessToken, new refreshToken }
    User->>API: Retry GET /api/users/me (with new token)
    API-->>User: 200 OK { userProfile }
```

---

## 5. Security & International Compliance Standards

1. **OWASP Top 10 Protections**:
   - **XSS Prevention**: DOMPurify and custom input sanitization on all user-submitted markdown and message bodies.
   - **CSRF & Injection**: Strict CORS origin regex filters (`*.vercel.app` & explicit localhost) and parameterized SQL queries via Supabase JS client.
   - **Rate Limiting**: `express-rate-limit` protecting auth endpoints (20 req / 15 min) and global endpoints (100 req / 15 min).
2. **WCAG 2.1 Accessibility**:
   - Semantic HTML5 landmarks (`<aside>`, `<main>`, `<header>`, `<nav>`).
   - High-contrast color ratios complying with AA standard in both Light and Dark modes.
   - Fully keyboard-accessible navigation and ARIA attributes for screen readers.
3. **Data Integrity & Privacy**:
   - Passwords salted and hashed with **bcryptjs (cost factor 10)**.
   - Stateless JWT tokens signed with SHA-256 HMAC secrets.
   - Graceful server shutdown hooks ensuring database pool cleanup.

