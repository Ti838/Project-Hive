# PROJECTHIVE: ENTERPRISE-GRADE SCALABILITY & HIGH CONCURRENCY ARCHITECTURE

**Document Version:** 1.0.0  
**Target Workload:** High-Concurrency University Collaboration, Real-Time Messaging & Multimodal AI  
**Deployment Infrastructure:** Render (Node.js Backend), Vercel (Next.js 16 Frontend), Supabase (PostgreSQL Singapore), LiveKit Cloud (SFU Calling), Upstash / Redis  

---

## 1. Architectural Overview & Design Tenets

ProjectHive's scalability architecture is engineered to decouple high-throughput user traffic from persistent storage and external model inference APIs. Under high concurrency (e.g. hackathon launches, university capstone presentation weeks), the system prevents resource exhaustion through **stateless horizontal backend scaling, distributed Redis pub/sub, tiered caching, asynchronous background queues, and circuit breaking**.

```
                           ┌───────────────────────────────┐
                           │      Cloudflare Edge DNS      │
                           │   DDoS & Turnstile Protection │
                           └───────────────┬───────────────┘
                                           │
                   ┌───────────────────────┴───────────────────────┐
                   ▼                                               ▼
     ┌───────────────────────────┐                   ┌───────────────────────────┐
     │      Vercel Edge CDN      │                   │     Render Node Cluster   │
     │  Next.js 16 App Router    │                   │   Express API Instances   │
     │  Statically Optimized     │                   │  (Instance 1 ... N)       │
     └───────────────────────────┘                   └─────────────┬─────────────┘
                                                                   │
                         ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                         ▼                                         ▼                                         ▼
            ┌─────────────────────────┐               ┌─────────────────────────┐               ┌─────────────────────────┐
            │   Distributed Redis     │               │   Supabase PostgreSQL   │               │    External Providers   │
            │  - Socket.IO Pub/Sub    │               │  - Connection Pooler    │               │  - LiveKit SFU (WebRTC) │
            │  - Shared Cache (LRU)   │               │  - 34 Tables + Indexes  │               │  - Groq & Gemini (AI)   │
            │  - Distributed Presence │               │  - Zero-Trust RLS       │               │  - Brevo / Gmail (SMTP) │
            │  - Background Queue     │               └─────────────────────────┘               │  - Circuit Breakers     │
            └─────────────────────────┘                                                         └─────────────────────────┘
```

### Core Tenets
1. **Stateless Backend Nodes:** Backend instances maintain zero state in local memory that is required by other nodes. User presence, socket room broadcasts, and cache entries synchronize via Redis.
2. **Resilient Degradation (Fallback First):** If Redis is temporarily unreachable, all services transparently degrade to high-performance in-memory LRU storage and local socket dispatch without failing user requests.
3. **Asynchronous Non-Blocking HTTP:** Operations requiring external network hops (transactional emails, notification fanouts) do not block HTTP responses. They are enqueued and processed with exponential backoff retries.
4. **Circuit Breaking for External Services:** External dependencies (Groq, Gemini, Brevo, LiveKit) are protected by automated circuit breakers to prevent thread starvation and socket exhaustion.
5. **Data Protection:** Zero destructive migrations; zero table truncations. All database changes are 100% additive and guarded by PostgreSQL Row-Level Security (RLS).

---

## 2. Subsystem Scalability Engineering

### 2.1 Backend HTTP Layer (`Express 4.x + Node.js`)
* **Request & Timeout Hardening:**
  - `server.requestTimeout = 30000` (30 seconds per request)
  - `server.headersTimeout = 35000` (35 seconds)
  - `server.keepAliveTimeout = 65000` (65 seconds, prevents race condition with reverse proxy idle timeouts)
  - Body limit constrained to 15MB to support capstone media while preventing memory buffer bloat.
* **Health & Probing Hierarchy:**
  - `GET /api/health/live`: Instant 200 OK liveness probe with process uptime and event-loop lag.
  - `GET /api/health/ready`: Readiness probe with 15-second cached database ping, cache stats, and circuit breaker status.
  - `GET /api/health/metrics`: System telemetry for Prometheus / Datadog agents.
* **Centralized Graceful Shutdown:**
  - Intercepts `SIGINT` and `SIGTERM`.
  - Broadcasts `server:shutdown` event to connected WebSockets.
  - Closes HTTP server with `server.closeIdleConnections()`.
  - Drains background queue worker with an 8-second window.
  - Closes Redis connections and exits cleanly with code 0.

### 2.2 Redis-Based Infrastructure
* **Socket.IO Scaling:** Uses `@socket.io/redis-adapter` with dual pub/sub connections (`pubClient` and `subClient`) configured with `maxRetriesPerRequest: 2` and `enableOfflineQueue: false` to fail fast to local dispatch if Redis disconnects.
* **Distributed Caching Service (`cache.service.js`):**
  - Caches low-volatility public resources:
    * `/api/stats` cached for 60 seconds.
    * `/api/projects` (unauthenticated public listings) cached for 60 seconds with key pattern `projects:public:*`.
  - Invalidation triggers: mutations (`submitProject`, `updateProject`, `deleteProject`, `likeProject`) immediately purge `projects:*` keys.
* **Distributed Presence:** Active user presence synchronizes across instances via Redis `online_users` set, falling back to local `Map` when Redis is absent.

### 2.3 Background Queue Engine (`queue.service.js`)
* Decouples long-running operations from synchronous request threads.
* **Queues & Concurrency Allocations:**
  - `send_email`: Max 5 concurrent workers (protects SMTP relay limits)
  - `push_notification`: Max 10 concurrent workers
  - `audit_log`: Max 15 concurrent workers
* **Retry Strategy:** Exponential backoff ($2^n \times 1000\text{ms}$: 2s, 4s, 8s) up to 3 attempts.
* **Dead Letter Queue (DLQ):** Failed jobs are tracked in DLQ with stack traces for administrative inspection.

### 2.4 External AI Engine Protection (`circuitBreaker.js` & `ai.controller.js`)
* External model inference is protected by 3 layers:
  1. **Tiered Rate Limiter (`aiLimiter`):** 30 requests/min per IP.
  2. **AbortController Timeouts:** 12-second hard timeout per tier (`TIER_TIMEOUT_MS`).
  3. **Automated Circuit Breaker:** Tripped after 4 consecutive failures; enters 20-second recovery timeout (`HALF_OPEN`) to prevent socket exhaustion during provider outages.
  4. **Cascading Model Fallback:** Groq (Tier 1) $\to$ Gemini Flash (Tier 2) $\to$ OpenRouter Free (Tier 3).

### 2.5 Database Query Optimization & Additive Indexes
* **PostgreSQL B-Tree Indexes:**
  - `idx_projects_status_created` ON `projects(status, created_at DESC)`
  - `idx_projects_status_likes` ON `projects(status, likes DESC)`
  - `idx_teams_status_created` ON `teams(status, created_at DESC)`
  - `idx_posts_created` ON `posts(created_at DESC)`
  - `idx_messages_sender` ON `messages(sender_id)`
  - `idx_join_requests_team_status` ON `join_requests(team_id, status)`
  - `idx_project_views_project` ON `project_views(project_id)`
* All indexes use `CREATE INDEX IF NOT EXISTS` and are non-blocking.

