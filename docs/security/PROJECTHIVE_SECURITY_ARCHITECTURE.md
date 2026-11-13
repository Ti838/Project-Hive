# PROJECTHIVE 🐝 — PRODUCTION ZERO-TRUST SECURITY ARCHITECTURE

> **Standard Compliance:** OWASP ASVS 5.0.0 (Level 2 Verified) & NIST SP 800-207  
> **Classification:** Production Security Standard  
> **Status:** Fully Implemented & Live Tested

---

## 1. ZERO-TRUST ARCHITECTURAL FOUNDATION

ProjectHive implements the **NIST SP 800-207 Zero-Trust Architecture** based on the principle of *"Never Trust, Always Verify"*:

```mermaid
flowchart TD
    subgraph PERIMETER["1. Perimeter & Transport Defense"]
        TLS["HTTPS / TLS 1.3 Strict Transport Security (HSTS)"]
        WAF["Cloudflare Edge & Reverse Proxy Protection"]
        CORS["Strict Origin Verification (Whitelisted Origins)"]
        HELMET["Helmet Security Headers & Strict CSP"]
        RL["Distributed Express Rate Limiter (IP + Route Scoped)"]
    end

    subgraph IDENTITY["2. Identity & Access Gateway"]
        JWT["Cryptographic JWT Access Tokens (HS256 / RS256 KeySigner)"]
        BREVO["Brevo SMTP 32-Byte Cryptographic Email Verification"]
        BCRYPT["Bcrypt Password Hashing (12 Salt Cost Rounds)"]
        MFA["Time-based One-Time Password (TOTP) 2FA Framework"]
        SESSIONS["Active Session Intelligence with Remote Kill-Switch"]
    end

    subgraph ENFORCEMENT["3. Live Enforcement & Least-Privilege RBAC"]
        USER_GUARD["auth.js (JWT Claims + Revocation Check)"]
        ADMIN_GUARD["adminAuth.js (Dual-Layer: Token + Live DB Role === 'admin')"]
        ESCALATION["Self-Escalation Hard Block (Zero Privilege Hijacking)"]
    end

    subgraph DATA_PLANE["4. Storage & Persistence Security"]
        PG[(Supabase PostgreSQL 15 - Singapore Cluster)]
        RLS["PostgreSQL Row-Level Security (RLS across 35 tables)"]
        STORAGE_SEC["Private S3 Buckets with Signed URLs & UUID Directory Scoping"]
        AUDIT["Immutable Append-Only Audit Ledger (admin_audit_logs)"]
    end

    TLS --> WAF --> CORS --> HELMET --> RL
    RL --> USER_GUARD & ADMIN_GUARD
    USER_GUARD --> JWT & SESSIONS
    ADMIN_GUARD --> ESCALATION
    USER_GUARD --> PG & RLS
    ADMIN_GUARD --> PG & AUDIT
```

---

## 2. DUAL-LAYER AUTHENTICATION & DEFENSE-IN-DEPTH

### A. Regular User Authentication
1. **Password Security:** All student and faculty passwords are encrypted using `bcryptjs` with **12 salt cost rounds**. Timing attack mitigations are active on comparison.
2. **Session Token Lifecycle:**
   - **Access Token:** Short-lived cryptographic JSON Web Token (15-minute default) minted by the `KeySigner` service.
   - **Refresh Token:** Cryptographically random 32-byte string stored in `user_sessions` with IP, device category, browser, and revocation timestamp.
3. **Session Revocation:** Users can view all active hardware sessions from their **User Security Center** (`/settings` -> Security) and terminate individual or all other remote sessions immediately.

### B. Privileged Admin Authentication (SecOps)
Admin endpoints under `/api/admin/*` are shielded by the dual-layer guard `adminAuthMiddleware.js`:
- **Layer 1 (Cryptographic Signature):** Validates the Bearer token signature and expiration.
- **Layer 2 (Live Database Authority):** Queries Supabase PostgreSQL directly to verify that `role === 'admin'` or `'super_admin'` and that `is_banned === false`.
- **Stale Claim Elimination:** If an admin is demoted or suspended in the database, existing JWT tokens become invalid immediately without waiting for token expiration.

---

## 3. USER SECURITY CENTER CAPABILITIES

Implemented in `frontend/src/components/settings/UserSecurityCenter.tsx` and connected to live APIs:

1. **Account Protection:**
   - Real-time Email Verification status badge with instant resend trigger.
   - Password strength meter (0-100% entropy score calculating length, character variety, numbers, and symbols).
   - Authenticator App (TOTP) two-factor authentication setup dialog.
2. **Device & Session Hygiene:**
   - Displays device category (Laptop, Smartphone, Tablet), browser, operating system, masked IP (`192.168.***.***`), campus location, and last active timestamp.
   - Immediate remote revocation of untrusted sessions.
3. **Data Governance & Portability (GDPR):**
   - Single-click **Personal Data Export (JSON)** delivering complete profile, enrolled squad, and post metadata.
   - Irreversible **Account Deletion** protected by confirmation text validation.

---

## 4. ADMIN SECOPS OPERATIONS CENTER

Implemented in `frontend/src/app/admin/security/page.tsx`:

1. **Security Posture Telemetry:**
   - Live compliance score (0-100) reflecting banned user ratios, unverified counts, rate limiter status, and report queues.
   - Live database latency ping and region indicator (`ap-southeast-1`).
2. **Granular RBAC Directory:**
   - Comprehensive roster of privileged accounts (`Super Admin`, `Admin`, `Moderator`).
   - Least-privilege clearance scopes enforced server-side.
3. **System Security Policies (Live Toggle):**
   - Mandatory Email Verification enforcement.
   - Strict Distributed Rate Limiting.
   - Maintenance Lockdown.
4. **Emergency Break-Glass Protocol:**
   - Instant termination of all active sessions across the entire system.
   - Mandatory operational justification (8+ chars) recorded immutably in `admin_audit_logs`.
   - Real-time WebSocket emergency alert dispatched to all connected clients.

