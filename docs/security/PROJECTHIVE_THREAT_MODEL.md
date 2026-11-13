# PROJECTHIVE 🐝 — STRIDE THREAT MODEL & MITIGATION MATRIX

> **Methodology:** Microsoft STRIDE & OWASP Top 10 API Security  
> **Target Scope:** Entire ProjectHive Platform (Web Client, Express Server, WebSocket Engine, Supabase PostgreSQL, Cloud Storage)

---

## 1. THREAT CATEGORIZATION (STRIDE)

| Threat Category | Potential Attack Vector | ProjectHive Production Mitigation | Verification Status |
| :--- | :--- | :--- | :--- |
| **Spoofing Identity** | Fake admin identity or JWT forgery | Cryptographic key signature verification via `KeySigner` + live database role check in `adminAuthMiddleware.js`. | ✅ **Tested & Verified** (Test Suite #2, #3) |
| **Tampering with Data** | SQL Injection, XSS payloads in bios or chat messages | Parameterized Supabase queries, input sanitization (`sanitize.js`), and strict React JSX HTML escaping. | ✅ **Tested & Verified** (Test Suite #6) |
| **Repudiation** | Administrator denies performing destructive user deletion or ban | Append-only `admin_audit_logs` ledger recording caller ID, email, IP address, user-agent, target, and before/after diff. | ✅ **Tested & Verified** (Test Suite #7) |
| **Information Disclosure** | IDOR on private squad files, chats, or unmasked user IPs | PostgreSQL Row-Level Security (RLS) policies scoped to verified membership. User session IPs masked to `xxx.xxx.***.***`. | ✅ **Tested & Verified** (Test Suite #4, #5) |
| **Denial of Service** | Volumetric brute-force on login or API flooding | Distributed rate limiting via `express-rate-limit` (`authLimiter`, `globalLimiter`, `aiLimiter`), reverse proxy IP tracking. | ✅ **Tested & Verified** (Rate Limiter Middleware) |
| **Elevation of Privilege** | Student calls privileged role change or promote endpoints | Hardened `/api/admin/promote-me` blocked permanently on non-dev environments. Role modification restricted strictly to super admins. | ✅ **Tested & Verified** (Test Suite #3) |

---

## 2. HIGH-RISK ATTACK PATHS & DEFENSIVE BARRIERS

### Attack Path 1: Credential Stuffing & Brute-Force Password Cracking
- **Attack Path:** Attacker uses a dictionary list of stolen credentials against `/api/auth/login`.
- **Defensive Barrier:**
  1. `authLimiter` limits attempts to 10 requests per 15 minutes per IP.
  2. Bcrypt 12 rounds introduces deliberate computational cost (approx. 100ms per check), crippling automated parallel cracking.
  3. Real-time User Security Center alerts user to new or unknown device sessions.

### Attack Path 2: Insecure Direct Object Reference (IDOR) on User Account Deletion
- **Attack Path:** Malicious authenticated student crafts `DELETE /api/users/{targetUserId}` to delete a peer.
- **Defensive Barrier:**
  1. Express controller `deleteOwnAccount` strictly asserts `req.user.id === req.params.id`.
  2. Any mismatch triggers immediate HTTP 403 Forbidden without database query execution.
  3. Automated integration test confirms IDOR attempts are rejected (Test Suite #5).

### Attack Path 3: Stale Admin Privilege Exploitation
- **Attack Path:** Suspended or demoted administrator uses a previously issued 24-hour access token to access admin routes.
- **Defensive Barrier:**
  1. `adminAuthMiddleware.js` queries `users` table live on every single administrative request.
  2. If `role !== 'admin'` or `is_banned === true`, request is denied with HTTP 403 regardless of token expiry.

