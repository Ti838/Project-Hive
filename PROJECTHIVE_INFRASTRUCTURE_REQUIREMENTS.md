# ProjectHive — Infrastructure Sizing, Topology & Scaling Requirements

**Document Version:** 1.0.0  
**Target Environment:** Production (Render, Vercel, Supabase, Upstash Redis, LiveKit Cloud)  
**Applicability:** University Deployments (500 to 10,000+ Concurrent Active Users)  
**Status:** Approved Architectural Specification

---

## 1. Overview & Cloud Topologies

ProjectHive's architecture is decoupled into five distinct, horizontally scalable tiers:
1. **Frontend Edge:** Vercel Global Edge Network (Next.js 16 App Router).
2. **Backend API & Realtime:** Render Web Services (Node.js 20+ Express & Socket.IO).
3. **Data & State Storage:** Supabase PostgreSQL with transaction-mode connection pooling (PgBouncer).
4. **Distributed Cache & Message Broker:** Managed Redis (Upstash Serverless or Redis Cloud) with in-memory LRU fallback.
5. **Realtime Media Infrastructure:** LiveKit Cloud WebRTC SFU for selective forwarding of multi-party audio, video, and screen sharing.

---

## 2. Infrastructure Sizing by Concurrency Tier

| Concurrency Tier | Active Users | Render Backend Tier | Number of Nodes | Supabase Database Tier | Redis Tier | LiveKit Tier | Monthly Cloud Estimate |
|---|---|---|---|---|---|---|---|
| **Tier 1: Minimal / Dev** | < 100 | Starter ($7/mo) | 1 Node | Free Micro (500MB) | In-Memory (No Redis required) | Free Tier (50 GB egress) | ~$7 - $15 |
| **Tier 2: Single Campus** | 500 | Starter ($7/mo) or Standard ($25/mo) | 1 - 2 Nodes | Pro Plan ($25/mo) | Upstash Serverless (Pay-per-req) | Community Plan | ~$35 - $60 |
| **Tier 3: Peak Hackathon** | 1,000 | Standard ($25/mo) | 2 Nodes | Pro Plan ($25/mo) + PgBouncer | Upstash Pro / Redis Cloud (250MB) | Standard Plan | ~$80 - $120 |
| **Tier 4: Multi-Campus** | 5,000 | Standard ($25/mo) | 3 - 4 Nodes | Pro Compute Small (2 Core / 4GB) | Redis Cloud Standard (1 GB) | Pro Plan | ~$250 - $380 |
| **Tier 5: Enterprise / National** | 10,000+ | Pro ($85/mo) | 4 - 6 Nodes | Pro Compute Medium (4 Core / 8GB) | Redis Cloud High Availability (2.5 GB) | Enterprise Plan | ~$600 - $900 |

---

## 3. Detailed Component Specifications

### 3.1. Backend API (Render Configuration)
- **Node.js Version:** 20.x LTS or 22.x LTS (compatible with Node 26 runtime on Render).
- **Process Model:** Single event loop per container with `WEB_CONCURRENCY=1` (standard) or `WEB_CONCURRENCY=2` (on 2+ CPU cores).
- **V8 Heap Budgeting:**
  - For 512 MB Containers: `--max-old-space-size=384` (reserves 128 MB for native modules and thread pools).
  - For 2 GB Containers: `--max-old-space-size=1536` (reserves 512 MB for system overhead).
- **Libuv Thread Pool:**
  - Configure `UV_THREADPOOL_SIZE=8` (or `16` on high-concurrency instances) to prevent Bcrypt password hashing and crypto operations from stalling DNS resolution or file system I/O.
- **Graceful Draining:**
  - `SHUTDOWN_TIMEOUT_MS=15000` (15-second graceful window before `SIGKILL`).
- **Health Checks:**
  - Liveness Path: `/api/health/live` (Timeout: 5s, Interval: 10s)
  - Readiness Path: `/api/health/ready` (Timeout: 5s, Interval: 15s)

### 3.2. Database & Connection Pooling (Supabase PostgreSQL)
PostgreSQL handles connections by spawning heavy backend OS processes. Unbounded connections from multiple Node.js instances will quickly crash a PostgreSQL instance without connection pooling.

- **Direct Port vs Pooled Port:**
  - **MIGRATIONS & SCHEMA DDL:** Port `5432` (Direct Session Mode).
  - **EXPRESS APPLICATION RUNTIME:** Port `6543` (PgBouncer Transaction Pooling Mode).
- **PgBouncer Configuration Settings:**
  - Pool Mode: `transaction` (essential for stateless Express REST handlers).
  - Max Client Connections: `1,000` (clients connecting to PgBouncer).
  - Default Pool Size: `20 - 30` (actual active connections to PostgreSQL engine).
  - Statement Timeout: `10000` (10 seconds to kill runaway, unindexed queries).
  - Idle In Transaction Session Timeout: `5000` (5 seconds to terminate leaked transactions).

### 3.3. Distributed Cache & Pub/Sub (Redis)
- **Primary Roles:**
  1. Socket.IO cross-instance message broadcasting via `@socket.io/redis-adapter`.
  2. Distributed presence synchronization (`online_users` set and heartbeat keys).
  3. Shared rate-limiting buckets across multiple backend containers.
  4. Global cache for public statistics and project listings (`cache.service.js`).
- **Recommended Provider:**
  - **Upstash Serverless Redis:** Ideal for dynamic university load profiles; charges per request ($0.20 per 100k requests) with zero idle server cost. Provides standard TLS connection string (`rediss://...`).
  - **Redis Cloud / AWS ElastiCache:** Ideal for high sustained throughput (> 2,000 continuous RPS).
- **Resilience Policy:**
  - If Redis connection fails, ProjectHive's `cache.service.js` automatically degrades to local in-memory LRU caching, and `socket.service.js` falls back to the in-memory adapter without crashing the server.

### 3.4. Realtime Audio/Video (LiveKit Cloud)
- **Architecture:** ProjectHive uses LiveKit Cloud as an external Selective Forwarding Unit (SFU). Audio and video streams bypass the Node.js backend entirely and stream peer-to-cloud-to-peer.
- **Node.js Role:** Generates cryptographically signed access tokens via `/api/turn-credentials` (executes in < 5ms).
- **Bandwidth Consumption Estimates:**
  - Audio Only: ~32 kbps per participant.
  - 720p Video: ~1.2 Mbps per participant.
  - 10-person room with active video: ~12 Mbps egress per room.
  - LiveKit Cloud offloads 100% of this media network saturation from the Render backend.

### 3.5. Frontend Edge Network (Vercel)
- **Deployment Strategy:** Vercel Pro or Hobby.
- **Asset Optimization:**
  - Next.js Image Optimization handles avatar, thumbnail, and logo resizing at the edge.
  - Fonts: Self-hosted `next/font` (Inter / Plus Jakarta Sans) with zero layout shift (CLS < 0.05).
- **Edge Cache Headers for Public Routes:**
  - Static Pages (`/`, `/terms`, `/privacy`): Cached globally across all CDN points of presence.
  - Revalidation (`stale-while-revalidate`): 60 seconds on semi-dynamic public showcases.

---

## 4. Production Environment Variables Reference

Below is the definitive configuration for a high-concurrency production deployment:

```bash
# Server Runtime
NODE_ENV=production
PORT=5000
WEB_CONCURRENCY=1
UV_THREADPOOL_SIZE=8
NODE_OPTIONS="--max-old-space-size=1536"
SHUTDOWN_TIMEOUT_MS=15000

# Client Application URL
CLIENT_URL=https://project-hive.vercel.app

# Database (Supabase PostgreSQL via PgBouncer Pooler)
# IMPORTANT: Use port 6543 with pgbouncer=true for production Express runtime!
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

# Distributed State & Cache (Redis)
REDIS_URL=rediss://default:[password]@[endpoint].upstash.io:6379

# LiveKit WebRTC Infrastructure
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_HOST=https://project-hive.livekit.cloud

# Background Email Queue (Brevo SMTP)
BREVO_API_KEY=your_brevo_api_key
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_account_email
SMTP_PASS=your_brevo_smtp_key

# AI Gateway Keys
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Security & Tokens
JWT_SECRET=your_super_strong_production_jwt_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_super_strong_refresh_token_secret_min_32_chars
COOKIE_SECRET=your_secure_cookie_signing_secret
```

---

## 5. Step-by-Step Production Scaling Checklist

### Phase 1: Pre-Scale Verification (Zero Downtime)
1. **Apply Non-Destructive Database Indexes:**
   - Execute the 7 additive B-Tree indexes defined in `server/database/schema.sql` inside the Supabase SQL Editor.
   - Run `ANALYZE projects; ANALYZE teams; ANALYZE team_members; ANALYZE notifications;` to update PostgreSQL query planner statistics.
2. **Switch Connection String to PgBouncer:**
   - In Supabase Dashboard -> Settings -> Database -> Connection string -> URI, select **Transaction Mode (Port 6543)**.
   - Update `DATABASE_URL` in Render Environment Variables.
3. **Provision Upstash Redis:**
   - Create a free or pay-as-you-go Upstash Redis database.
   - Copy the `rediss://` URL into Render under `REDIS_URL`.

### Phase 2: Deploy Backend Hardening
1. Commit and push the scalability services (`cache.service.js`, `queue.service.js`, `circuitBreaker.js`, `rateLimiter.js`, `shutdownManager.js`).
2. Verify Render zero-downtime deployment completes:
   - Monitor `GET /api/health/live` -> Returns `200 OK` (`"status": "alive"`).
   - Monitor `GET /api/health/ready` -> Returns `200 OK` (`"database": "connected"`).
   - Check startup logs for `[Redis Cache] Redis client connected successfully.`

### Phase 3: Scaling Node Count on Render
1. If scaling to > 1 node, navigate to Render Dashboard -> Web Service -> Scaling.
2. Change instance count from `1` to `2` or `3` (or enable Auto-Scaling between 2 and 5 instances based on 70% CPU threshold).
3. The Render load balancer will automatically distribute incoming HTTPS and WebSocket connections across instances.
4. Verify cross-node Socket.IO communication: Users connected to Node A successfully receive messages sent by users connected to Node B via Redis Pub/Sub.

---

## 6. Disaster Recovery & Failure Playbooks

### Playbook A: Redis Service Goes Down
- **Symptom:** Upstash/Redis connection timeout or connection refused error.
- **Automatic System Behavior:**
  - `cache.service.js` detects disconnection, logs warning `[Redis Cache] Connection error, falling back to local LRU`, and shifts all caching to process RAM.
  - `socket.service.js` falls back to Node.js memory adapter.
  - The application remains fully online for users without crashing.
- **Recovery Action:** Verify Redis provider status; once Redis recovers, the client reconnects automatically.

### Playbook B: Database Connection Exhaustion (HTTP 503 / Timeout)
- **Symptom:** `/api/health/ready` returns 503 with `"database": "disconnected"`.
- **Mitigation:**
  - Readiness probe automatically fails, instructing the load balancer to halt routing new traffic to saturated nodes.
  - Ensure the connection string uses port `6543` with `pgbouncer=true`.
  - Check Supabase Dashboard for long-running unindexed queries; kill blocking PIDs using `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';`.

### Playbook C: External AI Provider Outage (Groq/Gemini Down)
- **Symptom:** AI endpoints throw 500 errors or timeout after 15 seconds.
- **Automatic System Behavior:**
  - `circuitBreakers.ai` trips to `OPEN` state after 5 consecutive failures.
  - Subsequent AI calls immediately fail fast with a polite response: `"AI services are temporarily experiencing high demand. Please try again in a few moments."`
  - Rest of ProjectHive (chat, projects, login, teams) operates with zero latency penalty.
- **Recovery Action:** Circuit breaker automatically probes upstream every 30 seconds (`HALF_OPEN`) and closes once the upstream recovers.

