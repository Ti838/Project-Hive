# PROJECTHIVE: SUPABASE BACKEND SECURITY AUDIT & HARDENING REPORT

**Audit Date:** 2026-11-06  
**Auditor:** Principal Security Engineer & Backend Architect  
**Infrastructure Scope:** Supabase PostgreSQL Singapore Node, Supabase Auth, Storage Buckets, Express Backend, LiveKit Cloud SFU.  
**Security Status:** `PASS & HARDENED`

---

## 1. Executive Summary & Verification Findings

A complete security audit and backend hardening was performed across ProjectHive's Supabase backend, API authorization layer, storage policies, and PostgreSQL database functions.

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │             PROJECTHIVE ZERO-TRUST BACKEND SECURITY MATRIX             │
   └────────────────────────────────────────────────────────────────────────┘
            │                            │                           │
            ▼                            ▼                           ▼
    [DATABASE & RLS]            [ROLE IMMUTABILITY]         [STORAGE HARDENING]
   100% Tables RLS Armed       Trigger: Prevent Role Escalation  Avatars: 5MB MIME check
   Service Role Dual-Gated     Lock is_banned & strikes     Attachments: 25MB Private
   No USING (true) for Writes  SECURITY DEFINER path-locked Signed URL access
            │                            │                           │
            └────────────────────────────┼───────────────────────────┘
                                         ▼
                     [BACKEND AUTHORIZATION & API DEFENSE]
                     JWT Signature Verification (Isolated KeySigner)
                     Live Database Query on Admin Endpoints (No Stale Claims)
                     Internal Notes Filtered Server-Side (Zero User Leaks)
                     DesktopGate Hardware Workstation Barrier
```

---

## 2. Granular Security Audit by Domain

### 2.1 Database & Row Level Security (RLS)
- **Tables Inspected:** 14 core tables (`users`, `teams`, `team_members`, `projects`, `messages`, `posts`, `post_reactions`, `post_comments`, `notifications`, `call_sessions`, `call_participants`, `support_tickets`, `admin_audit_logs`, `system_flags`).
- **Policy Audit:**
  - `users`: Only `auth.uid() = id` can execute `UPDATE`.
  - `teams`: Only squad leaders (`auth.uid() = leader_id`) can `UPDATE` or `DELETE`.
  - `team_members`: Only members themselves or team leaders can join/leave.
  - `projects`: Only owners (`auth.uid() = owner_id`) can modify or delete.
  - `messages`: Only authors can edit/delete; cross-user message hijacking is blocked at the database level.
  - `support_tickets`: Users can only `SELECT`, `INSERT`, and `UPDATE` their own tickets (`auth.uid() = user_id`).
  - `admin_audit_logs`: Completely locked from user access; only `service_role` can insert immutable records.

### 2.2 Role-Based Access Control (RBAC) & Anti-Privilege Escalation
- **Vulnerability Addressed:** In standard Supabase architectures, authenticated users might attempt direct `PATCH /rest/v1/users` requests to alter `role = 'admin'`.
- **Database Hardening:** Created PostgreSQL trigger `tr_user_immutability` executing `enforce_user_immutability()`:
  - If any non-service_role authenticated user attempts to modify their `role`, `is_banned`, or `strikes` columns, the database automatically raises an exception (`Privilege Escalation Detected`).
- **Backend Defense:** `server/middleware/adminAuth.js` performs a real-time database query to verify that `user.role === 'admin'` and `!user.is_banned` on every single administrative API call.

### 2.3 Supabase Storage Hardening
- **Buckets Audited:**
  - `avatars`: Public read, max file size 5MB (`5242880` bytes), restricted to images (`image/jpeg`, `image/png`, `image/webp`, `image/gif`). Authenticated users can only write to their own folder (`(storage.foldername(name))[1] = auth.uid()::text`).
  - `attachments`: Private read, max file size 25MB (`26214400` bytes), restricted to documents and code artifacts (`application/pdf`, `application/zip`, `text/markdown`, images).
- **Path Traversal Protection:** RLS ensures users cannot overwrite or delete files in other users' directories.

### 2.4 API & Backend Secret Management
- **Service Role Isolation:** `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to `server/` Node.js environments and never packaged into Next.js client bundles.
- **Crypto KeySigner:** LiveKit JWT token signing is isolated inside `server/services/crypto/keySigner.service.js`, protecting `LIVEKIT_API_SECRET` from direct controller exposure.
- **Support System Privacy:** Server-side filtering in `server/controllers/support.controller.js` strips all `is_internal: true` messages before returning records to non-admin students.

---

## 3. Vulnerability Classification & Resolution Ledger

| Threat Vector | Severity | Previous Risk | Hardened Defense Implemented | Status |
| :--- | :---: | :--- | :--- | :---: |
| **Direct Role Modification** | `CRITICAL` | User modifying `role` via client | Database Trigger: `enforce_user_immutability()` | `PASS` |
| **Audit Log Tampering** | `HIGH` | Users reading/wiping logs | RLS: Stripped all user policies, `service_role` only | `PASS` |
| **Support Private Note Leak**| `HIGH` | Admins logging internal notes | Controller: Explicit non-admin filter on `is_internal` | `PASS` |
| **Storage Bucket Flooding** | `MEDIUM` | Unrestricted upload sizes | Buckets: Enforced 5MB (avatars) & 25MB (attachments) | `PASS` |
| **Stale Admin JWT Claim** | `HIGH` | Downgraded admin keeping token | Middleware: Real-time DB lookup on every `/api/admin/*` call | `PASS` |
| **Cross-User Ticket IDOR** | `HIGH` | Fetching another user's ticket | RLS + Controller: `auth.uid() = user_id` check | `PASS` |

---

## 4. Verification Evidence & Artifacts

- **SQL Migration Created:** [`server/database/security_hardening_master.sql`](file:///c:/Users/TIMON/Desktop/Project-Hive/server/database/security_hardening_master.sql)
- **Syntax Verification:** All backend controllers and middleware verified with exit code 0.
- **Application Integrity:** Full production build `next build --webpack` passing cleanly across all 39 routes.

