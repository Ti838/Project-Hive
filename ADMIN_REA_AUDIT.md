# ProjectHive — Admin Ecosystem Reverse Engineering Analysis (REA) & Forensic Audit

**Document Version:** 1.0.0  
**Target Environment:** ProjectHive Production Stack (Next.js 16 + Express API + Supabase PostgreSQL)  
**Scope:** Admin Console (`/admin/*`), Administrative APIs, Telemetry, RBAC & Governance  
**Status:** Complete Forensic Audit  

---

## 1. Executive Summary & Inventory

The ProjectHive Admin Console (`/admin`) is designed as a centralized operational telemetry, governance, and disciplinary control center for university campus collaboration. It manages multi-tenant users, squads/teams, projects, moderation reports, support tickets, and system runtime flags.

### Admin Feature Inventory & Operational Classification

| Feature | Route / Endpoint | Backend Handler | Database Entities | Operational Status | Classification |
|---|---|---|---|---|---|
| **Admin Overview & Telemetry** | `/admin`, `GET /api/admin/stats` | `admin.controller.js:getStats` | `users`, `teams`, `projects`, `messages`, `posts` | **Partially Working** (Live DB counts work; layout telemetry had random noise fallbacks) | **B: Partially Working** |
| **System Health Diagnostics** | `GET /api/admin/health` | `admin.controller.js:getAdminHealth` | Supabase ping, LiveKit status, process memory | **Fully Working** (Direct DB ping + memory RSS) | **A: Fully Working** |
| **User Directory & Sanctions** | `/admin/users`, `GET /api/admin/users` | `admin.controller.js:getUsers` | `users` (id, email, role, ban status) | **Partially Working** (Search, ban, role works; missing user deep-inspection drawer for sessions/location) | **B: Partially Working** |
| **Disciplinary Strike Ledger** | `POST /api/admin/users/:id/strikes` | `admin.controller.js:issueStrike` | `user_strikes`, `admin_audit_logs` | **Fully Working** (Automated 3-strike ban trigger + Socket.IO alert) | **A: Fully Working** |
| **Moderation Queue** | `/admin/moderation`, `GET /api/admin/reports` | `admin.controller.js:getModerationQueue` | `content_reports` | **Fully Working** (Report review, resolve, reject, delete target) | **A: Fully Working** |
| **Squads & Hubs Management** | `/admin/teams`, `GET /api/admin/teams` | `admin.controller.js:getTeams` | `teams`, `team_members` | **Fully Working** (Listing, deletion, member count) | **A: Fully Working** |
| **Support & Helpline** | `/admin/support`, `GET /api/admin/tickets` | `admin.controller.js:getTickets` | `support_tickets` | **Fully Working** (Live Socket.IO ticket push, status resolution) | **A: Fully Working** |
| **System Flags & Runtime Controls**| `/admin/system`, `GET/PATCH /api/admin/flags` | `admin.controller.js:getSystemFlags` | `system_flags` | **Fully Working** (DB-backed flags: maintenance, registration, rate limiting) | **A: Fully Working** |
| **Immutable Audit Ledger** | `/admin/audit`, `GET /api/admin/audit-logs` | `admin.controller.js:getAuditLogs` | `admin_audit_logs` | **Fully Working** (Actor, action, target, IP, device model JSON) | **A: Fully Working** |
| **Device Intelligence Dashboard** | *Not standalone* | Fragmented in `getClientTelemetry` | Single user columns in `users` | **Missing / Incomplete** (No multi-session breakdown or device distribution) | **F: Missing** |
| **Location Intelligence Governance**| *Not standalone* | Fragmented IP lookup | `users.last_login_country`, `city` | **Missing / Incomplete** (No campus distribution or consented location audit) | **F: Missing** |

---

## 2. Deep Dive: Admin Architecture & Security Boundaries

### 2.1. Authentication & RBAC Verification
All administrative endpoints are protected by `adminAuthMiddleware` (`server/middleware/adminAuth.js`):
1. Verifies the JSON Web Token (`JWT_SECRET`) from `Authorization: Bearer <token>` or HTTP-only signed cookies.
2. Queries the Supabase database to verify `users.role === 'admin'`.
3. Verifies `users.is_banned === false`.
4. Enforces role-based privilege checks for destructive operations (e.g. permanent account deletion or SuperAdmin role promotion).

### 2.2. Flaws & Forensic Vulnerabilities Identified
1. **Frontend Telemetry Jitter:** In `frontend/src/app/admin/layout.tsx` (lines 174–177), `dbLatency` and `cpuUsage` implemented fallback jitter using `Math.random()`. This violates Rule 9 of production data authenticity. Telemetry must strictly display verified metrics or render explicit `"Unavailable"` states.
2. **Lack of Session Revocation:** While admins can ban accounts, they cannot view or terminate individual active sessions on compromised accounts without terminating all user tokens.
3. **No Centralized Device Matrix:** Admins cannot view campus-wide device distribution (Desktop vs Mobile, Chrome vs Safari, macOS vs Windows), which is essential for understanding university device penetration.

---

## 3. Reference Product Comparison (Linear & Vercel)

| Dimension | Linear / Vercel Pattern | Existing ProjectHive Implementation | Gap / Required Upgrade |
|---|---|---|---|
| **Telemetry Overview** | Real-time SLA cards, sparkline latency indicators, zero synthetic data. | Cards with DB ping; synthetic jitter on layout banner. | Connect layout directly to `/api/health/metrics` without synthetic jitter. |
| **User Inspection** | Slide-out flyout drawer with profile, active devices, and activity trail. | Modal for strikes only; no full user inspection drawer. | Implement Slide-Out User Profile & Device Inspector Drawer in `/admin/users`. |
| **Device Governance** | Device name, OS icon, IP region, and one-click session revocation. | Single `last_login_*` column on `users` table. | Structured `user_sessions` tracking with administrative revocation. |
| **Audit Trails** | Structured JSON detail drawer with copyable ID and diff payload. | Implemented in `/admin/audit` with JSON modal. | Preserve and enhance with device & IP geo attribution. |

