PROJECTHIVE: KNOWN LIMITATIONS & FUTURE CONSIDERATIONS

# 22: KNOWN ISSUES, DEFECTS & TECHNICAL LIMITATIONS

> **Document Classification:** Engineering Defect Catalog & Technical Debt Analysis  
> **Extraction Evidence Level:** `[VERIFIED]` Direct Source Code, Build Logs & Runtime Warnings  

---

## 1. Verified Defects & Runtime Warnings

### Defect 1: Permissive Reverse Proxy Rate-Limiting Warning
- **Severity:** Low (Security Configuration)
- **File Reference:** `server/app.js:33`
- **Observed Behavior:**
  During backend boot, Express Rate Limit outputs:
  ```
  code: 'ERR_ERL_PERMISSIVE_TRUST_PROXY',
  help: 'https://express-rate-limit.github.io/ERR_ERL_PERMISSIVE_TRUST_PROXY/'
  ```
- **Root Cause:** `app.set('trust proxy', true)` instructs the application to blindly trust all hops in the `X-Forwarded-For` header.
- **Remediation:** Configure `trust proxy` to trust only specific Render load balancer IP ranges or define a fixed hop count (e.g. `app.set('trust proxy', 1)`).

### Defect 2: Dual Lockfile Root Discrepancy in Turbopack
- **Severity:** Informational (Build Tooling)
- **File Reference:** `frontend/build_output4.log:8–19`
- **Observed Behavior:**
  Next.js Turbopack logs a build warning:
  ```
  Warning: Next.js inferred your workspace root, but it may not be correct.
  We detected multiple lockfiles and selected the directory of C:\Users\TIMON\Desktop\Project-Hive\package-lock.json.
  Detected additional lockfiles: C:\Users\TIMON\Desktop\Project-Hive\frontend\package-lock.json
  ```
- **Root Cause:** Both the root repository directory and `frontend/` contain independent `package-lock.json` manifests.
- **Remediation:** Configure `turbopack.root: '.'` explicitly in `frontend/next.config.ts`, or consolidate root scripts into a unified npm workspace.

---

## 2. Partial Implementations & Functional Gaps

### Limitation 1: Two-Factor Authentication (TOTP) UI Only
- **File Reference:** `frontend/src/app/(app)/settings/page.tsx:lines 50–70`
- **Description:** A "Two-Factor Authentication" toggle switch exists within student settings, and the database schema contains `twoFactorPrompt` in the `settings` JSONB column. However, no backend TOTP QR code generator, secret seed storage, or RFC 6238 token verification endpoint is implemented in `auth.controller.js`.
- **Status:** `UI ONLY`.

### Limitation 2: Real-Time Poll Percentage Broadcasts
- **File Reference:** `server/controllers/posts.controller.js:votePoll`
- **Description:** When a student casts a vote on a feed poll via `POST /api/posts/:id/poll/vote`, the vote is persisted to `posts.poll_data` in PostgreSQL and returned to the voting client. However, a real-time Socket.IO event is not broadcast to peer clients browsing the feed, requiring other users to refresh or re-fetch the feed to see updated vote percentages.
- **Status:** `PARTIALLY WORKING`.

### Limitation 3: Video Size Constraints on 24-Hour Stories
- **File Reference:** `server/controllers/stories.controller.js`
- **Description:** While image stories function smoothly via HTML5 canvas compression, video story uploads are bounded by Express’s 15MB body parser limit (`server/app.js:160`). Direct multipart chunked S3 streaming is not implemented, restricting video stories to brief, highly compressed clips.
- **Status:** `PARTIALLY WORKING`.

---

## 3. Architectural Limitations & Scaling Bottlenecks

### Bottleneck 1: Database RLS Application-Proxy Dependency
- **File Reference:** `server/config/supabase.js:15`
- **Description:** The Express backend uses `SUPABASE_SERVICE_ROLE_KEY` to query Supabase PostgreSQL. This bypasses Row Level Security (`BYPASSRLS`). While tenant isolation is enforced through controller-level `WHERE` clauses, any logic omission in a new controller endpoint could risk data leakage if not strictly guarded.
- **Remediation:** Implement Supabase native GoTrue token generation or inject local transaction variables (`SET LOCAL request.jwt.claims`) to enforce database-native RLS.

### Bottleneck 2: Single-Tenant Render Free-Tier Sleeping
- **File Reference:** `server/server.js:192–204`
- **Description:** Deployed on Render's free tier, the backend sleeps after 15 minutes of inactivity, introducing a 50-second cold start delay.
- **Current Workaround:** The server executes an autonomous self-ping interval every 14 minutes. If network drops prevent this self-ping, the instance may sleep until the next student request wakes it.

