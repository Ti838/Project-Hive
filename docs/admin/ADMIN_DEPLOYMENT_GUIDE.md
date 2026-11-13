# ProjectHive Admin Portal — Architecture & Deployment Guide

## 1. System Overview & Security Boundary

The ProjectHive Admin Portal (`/admin`) is an enterprise-grade administrative security and operations center (SecOps) designed for campus community governance, user moderation, squad oversight, audit compliance, and runtime telemetry.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PROJECTHIVE ADMIN ARCHITECTURE                         │
├─────────────────────────┬─────────────────────────┬─────────────────────────────┤
│ Frontend (Next.js 16)   │ Gateway (Express + WS)  │ Data & Subsystems           │
│ • DesktopGate.tsx       │ • adminAuthMiddleware   │ • Supabase Singapore (RLS)  │
│ • Responsive Drawer Nav │ • Live DB Role Lookup   │ • Brevo SMTP Email Relay    │
│ • Live KPI Telemetry    │ • Strict Rate Limiting  │ • LiveKit Cloud Media SFU   │
│ • User Inspection Drawer│ • Edge Redis Cache Purge│ • Google Gemini / Groq AI   │
└─────────────────────────┴─────────────────────────┴─────────────────────────────┘
```

---

## 2. Authentication & Authorization Security

1. **Dual-Layer Admin Guard (`server/middleware/adminAuth.js`)**:
   - **Layer 1: Cryptographic JWT Signature Check**: Verifies that the bearer token or HTTP-only cookie was issued by ProjectHive with valid signature and has not expired.
   - **Layer 2: Real-Time Database Verification**: Looks up the user record directly in Supabase using `supabaseAdmin` to ensure `role === 'admin'` and `is_banned === false`. This prevents privilege desynchronization or stolen tokens from accessing admin routes even if the JWT payload claims admin status.
2. **Dedicated SecOps Gate (`/admin/login`)**:
   - Distinct dark SecOps aesthetic (`#07090e`).
   - Rate-limited admin login endpoint (`/api/admin/login`).
   - Audit trail recorded in `admin_audit_logs` on every login attempt.

---

## 3. Responsive Console & Mobile Access

- **Legacy 1024px Gate Removal**: The historical blocking wall that prevented mobile devices from viewing admin pages has been eliminated.
- **`DesktopGate.tsx` Telemetry Boundary**:
  - Automatically senses viewport dimensions and device hardware without blocking.
  - On mobile/tablet viewports (< 1024px), it renders a dismissible security advisory:
    `SEC-OPS MOBILE CONSOLE: Responsive mode active (390px) • Encrypted channel`.
- **Slide-Over Navigation Drawer (`admin/layout.tsx`)**:
  - Full-screen touch sidebar with frosted glass backdrop blur and touch hamburger button.
  - Supports quick one-tap routing across Dashboard, Users, Squads, Moderation, Support, Audit, and System.

---

## 4. Key Administrative Modules

| Route | Capabilities | Backend Endpoint |
| :--- | :--- | :--- |
| **`/admin`** | Real-time telemetry, latency probes (API, DB, Redis), active incident count, verified student ratios, RAF counters. | `GET /api/admin/health`, `GET /api/admin/stats` |
| **`/admin/users`** | Student user directory, deep inspection drawer, strike issuance (1–3 strikes), account ban/unban, password reset dispatch. | `GET /api/admin/users`, `POST /api/admin/users/:id/strike`, `POST /api/admin/users/:id/ban` |
| **`/admin/teams`** | Campus squad hubs oversight, member count auditing, open roles inspection, squad disbanding. | `GET /api/admin/teams`, `DELETE /api/admin/teams/:id` |
| **`/admin/moderation`**| Flagged posts and comments queue, violation review, one-click content deletion, report resolution notes. | `GET /api/admin/reports`, `POST /api/admin/reports/:id/resolve` |
| **`/admin/support`** | Real-time help ticket triage, multi-agent reply composer, internal staff notes, status transitions. | `GET /api/support/admin/tickets`, `POST /api/support/admin/:id/reply` |
| **`/admin/audit`** | Searchable system activity ledger, action filtering, copy raw JSON drawer, pagination. | `GET /api/admin/audit-logs` |
| **`/admin/system`** | Runtime feature flags (maintenance mode, registration, strict rate limiting), edge cache flush. | `GET /api/admin/system/flags`, `PATCH /api/admin/system/flags` |

---

## 5. Production Environment Variables

Ensure these keys are configured in your hosting dashboard:

### Backend (Render / Node.js)
```ini
PORT=5000
NODE_ENV=production
CLIENT_URL=https://projecthive-bd.vercel.app
FRONTEND_URL=https://projecthive-bd.vercel.app
SUPABASE_URL=https://iekfvgjxkmgduxdvkuxf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
JWT_SECRET=your_production_jwt_secret
BREVO_SMTP_KEY=your_brevo_smtp_key
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (Vercel)
```ini
NEXT_PUBLIC_API_URL=https://projecthive-backend.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://projecthive-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://iekfvgjxkmgduxdvkuxf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
NEXT_PUBLIC_LIVEKIT_WS_URL=wss://projecthive.livekit.cloud
```

---

## 6. Verification & Health Probes

Run these commands to verify administrative subsystems:
```powershell
# 1. Check system readiness
Invoke-RestMethod -Uri "http://localhost:5000/api/health/ready"

# 2. Check database and storage buckets
Invoke-RestMethod -Uri "http://localhost:5000/api/health/db"

# 3. Check system telemetry metrics
Invoke-RestMethod -Uri "http://localhost:5000/api/health/metrics"
```
