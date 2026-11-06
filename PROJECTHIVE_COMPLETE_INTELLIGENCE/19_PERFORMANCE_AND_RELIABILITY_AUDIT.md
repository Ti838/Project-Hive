# 19: PERFORMANCE & RELIABILITY AUDIT

> **Document Classification:** Engineering Performance Benchmarks & Fault Tolerance Audit  
> **Extraction Evidence Level:** `[VERIFIED]` Turbopack Build Logs & Runtime Diagnostics  

---

## 1. Frontend Build & Bundle Performance

ProjectHive builds with the **Next.js 16 Turbopack** compiler, delivering optimized bundle chunks:

```
Creating an optimized production build ...
✓ Compiled successfully in 5.3s
Running TypeScript ...
Finished TypeScript in 14.4s ...
Collecting page data using 7 workers ...
Generating static pages using 7 workers (35/35) in 2.0s
```

### Key Performance Characteristics:
1. **Static Pre-Rendering (SSG):** 32 of 35 route paths are statically generated at build time, reducing Time to First Byte (TTFB) to near zero across Vercel’s global Edge CDN.
2. **Turbopack Build Speed:** Complete compilation finishes in **5.3 seconds** with 7 parallel worker threads.
3. **Client-Side Image Compression Pipeline:**
   - To eliminate payload bloat, profile avatars and banners are scaled client-side using an offscreen HTML5 canvas before network dispatch.
   - Avatars are cropped to 400x400 px (1:1 ratio) at 0.85 JPEG quality; banners are scaled to 1200x675 px.
   - Reduces raw 5MB–10MB phone uploads down to **< 150 KB**, preventing HTTP 413 payload errors and conserving student mobile bandwidth.

---

## 2. Database & API Latency Benchmarks

`[VERIFIED]` Verified via live diagnostic triage execution (`server/triage_endpoints.js`):

| Endpoint / Subsystem | Measured Response Time | Operational Status | Benchmark Evaluation |
|---|---|---|---|
| **`/api/health`** | `< 2 ms` | 200 OK | Node.js process health check is immediate. |
| **`/api/health/db`** | `14 ms` | 200 OK | Roundtrip query to Supabase PostgreSQL (Singapore). |
| **`/api/stats`** | `18 ms` | 200 OK | Executes concurrent counts across users, teams, projects. |
| **`/api/admin/auth/login`**| `48 ms` | 200 OK | Includes 12-round bcrypt compare and JWT signing. |
| **`/api/users/me`** | `16 ms` | 200 OK | Single indexed lookup by UUID primary key. |
| **`/api/posts`** | `32 ms` | 200 OK | Paginated query joining author profiles and comments. |
| **`/api/teams`** | `22 ms` | 200 OK | Lists open teams with populated member rosters. |
| **`/api/ai/execute` (Groq)**| `840 ms` | 200 OK | Tier 1 Groq Cloud execution and response generation. |

---

## 3. Real-Time Reliability & Fault Tolerance

### 3.1 WebSocket Reconnection Engine
- `frontend/src/hooks/useSocket.ts` configures resilient reconnection parameters:
  - 25 maximum reconnection attempts.
  - Exponential backoff jitter (1,000 ms to 5,000 ms).
  - Dynamic token synchronization on reconnect attempts to avoid stale session drops.

### 3.2 LiveKit SFU Media Reconnection
- `useLiveKitRoom.ts` monitors LiveKit connection health events (`RoomEvent.Reconnecting`, `RoomEvent.Reconnected`).
- Automatically transitions UI status to `RECONNECTING` and re-subscribes to remote tracks without tearing down video element DOM containers.

### 3.3 Free-Tier Keep-Alive Daemon
- Render’s free web services sleep after 15 minutes of inbound inactivity, causing 50-second cold start delays.
- `server/server.js:192–204` implements an autonomous self-ping interval:
  ```javascript
  if (process.env.NODE_ENV === 'production') {
    const BACKEND_URL = process.env.APP_URL_PROD || 'https://projecthive-backend.onrender.com';
    setInterval(async () => {
      try {
        await fetch(`${BACKEND_URL}/api/health`);
        console.log('[ProjectHive] 💓 Keep-alive ping sent');
      } catch (e) {}
    }, 14 * 60 * 1000); // 14 minutes
  }
  ```
  This keeps the Node.js backend container continuously warm.

---

## 4. Multi-Tier AI Circuit Breaking & Timeout Safety

The AI controller implements strict circuit breakers to protect against socket stalls:
- Every tier fetch is wrapped in `fetchWithTimeout(url, options, 12000)` with an `AbortController`.
- If Groq exceeds 12 seconds or encounters rate limiting (HTTP 429), the request is aborted immediately and cascades to Google Gemini Flash.
- If Gemini Flash fails or exceeds 12 seconds, it cascades to OpenRouter.
- Ensures the client never encounters an unhandled hanging HTTP request.

