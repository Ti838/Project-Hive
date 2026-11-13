# PROJECTHIVE 🐝 — ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION MATRIX

> **Standard:** NIST SP 800-162 & Least-Privilege Separation of Duties  
> **Status:** Production Verified

---

## 1. HIERARCHICAL ROLES SPECIFICATION

| Role Identifier | Intended Actor | Administrative Scope | MFA Required |
| :--- | :--- | :--- | :--- |
| **`super_admin`** | Platform Founder / Lead SecOps Officer | Full platform jurisdiction, emergency break-glass, RBAC assignment, audit ledger | ✅ **Enforced** |
| **`admin`** | Platform Operations Engineer | User governance, disciplinary strikes, team management, telemetry review | ✅ **Enforced** |
| **`moderator`** | Content Compliance Officer | Content reports queue, post removal, user warning flags | Optional |
| **`faculty`** | Verified University Professor | Course squads creation, project endorsements, student mentoring | Optional |
| **`student` / `user`** | University Student Developer | Feed posting, team creation, peer messaging, WebRTC calling | Optional |

---

## 2. GRANULAR PERMISSION MATRIX

| Permission Scope | `student` | `faculty` | `moderator` | `admin` | `super_admin` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `feed.read` / `feed.post` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `teams.create` / `teams.join` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `messages.direct` / `calls.join` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `reports.submit` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `account.security.manage` | ✅ (Own) | ✅ (Own) | ✅ (Own) | ✅ (Own) | ✅ (Own) |
| `moderation.reports.read` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `moderation.reports.resolve` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `moderation.posts.delete` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `users.strikes.issue` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `users.account.ban` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `users.sessions.revoke` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `admin.telemetry.view` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `admin.system_flags.update` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `admin.audit_logs.read` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `admin.roles.assign` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `security.break_glass` | ❌ | ❌ | ❌ | ❌ | ✅ |
