# ProjectHive — Role-Based Access Control (RBAC) Permission Matrix

**Document Version:** 1.0.0  
**Phase:** Phase 1 Foundation  
**Execution Lead:** AGENT 11 (Security Specialist) & AGENT 10 (Admin & Moderation Specialist)  

---

## 1. System Roles Definition

1. **Guest / Anonymous User (`guest`):** Public visitor browsing landing page, public project showcase, and documentation.
2. **Student Member (`student`):** Authenticated student with verified university email. Can browse directory, create/join squads, send messages, make calls, and track tasks.
3. **Squad Leader (`leader`):** Student who created a squad or was delegated leadership. Inherits student capabilities plus applicant evaluation, member removal, and squad settings.
4. **Faculty Evaluator / Mentor (`mentor`):** Academic instructor reviewing milestones and grading rubrics.
5. **System Moderator (`moderator`):** Staff managing student content reports, reviewing flagged posts, and issuing warnings.
6. **Super Administrator (`admin`):** Full system governance, user inspection drawer, remote session kill switches, feature flags, and tamper-proof audit trails.

---

## 2. Granular Permissions Matrix

| Feature / Action | Guest | Student | Squad Leader | Mentor | Moderator | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **View Landing Page & Showcase** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Register & Verify Account** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Search Teammates & Squads** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create New Project Squad** | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Apply to Join Squad (Pitch)** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Accept / Decline Squad Applicants** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Remove Member from Squad** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Delegate Squad Leadership** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Send Direct & Squad Messages** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Initiate LiveKit Video Meeting** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Drag-and-Drop Kanban Tasks** | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Use HiveMind AI Generator** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Revoke Own Remote Sessions** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Access `/admin` Console** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Inspect Student Login Devices** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Force-Revoke Remote User Session** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Suspend / Ban Student Account** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Resolve Flagged Content Reports** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Toggle System Feature Flags** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **View Immutable Audit Logs** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Enforcement Layers

- **Frontend Navigation Guard:** Route middleware (`authMiddleware.tsx`, `adminGuard.tsx`) blocks unauthorized client navigation.
- **Backend API Gateway Guard:** Express middleware (`authMiddleware.js`, `adminMiddleware.js`) validates JWT claims and compares against active `user_sessions`.
- **Database Row Level Security:** Supabase PostgreSQL RLS policies enforce isolation directly at the database engine level.
