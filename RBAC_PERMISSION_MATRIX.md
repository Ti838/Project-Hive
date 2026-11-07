# ProjectHive — Role-Based Access Control (RBAC) & Permission Matrix

**Document Version:** 1.0.0  
**Target Environment:** ProjectHive API & Next.js Client Routing  
**Status:** Validated Forensic RBAC Matrix  

---

## 1. Role Hierarchy Specification

ProjectHive enforces a 4-tier hierarchical permission model:

```
┌──────────────────────────────────────────────────────────┐
│ Super Admin                                              │
│  └─ Primary root owner; can promote/demote admins        │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ Admin                                                    │
│  └─ Full platform telemetry, bans, strikes, flags        │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ Moderator                                                │
│  └─ Content report queue, ticket resolution, warnings    │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ Authenticated Student / User                             │
│  ├─ Team Leader (Scoped to owned squad)                  │
│  └─ Team Member (Scoped to joined squad)                 │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Granular Operations & Permission Matrix

| Capability / API Operation | Super Admin | Admin | Moderator | Team Leader | Team Member | Student (General) | Guest / Public |
|---|---|---|---|---|---|---|---|
| **View Landing & Showcase** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Search Projects & Squads** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Public) |
| **Register / Sign In** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Update Own Profile** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Manage Own Sessions** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Create Squad / Team** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Manage Squad Settings** | ✅ (Override) | ✅ (Override) | ❌ | ✅ (Owned) | ❌ | ❌ | ❌ |
| **Review Squad Join Requests** | ✅ | ✅ | ❌ | ✅ (Owned) | ❌ | ❌ | ❌ |
| **Remove Squad Member** | ✅ | ✅ | ❌ | ✅ (Owned) | ❌ | ❌ | ❌ |
| **Create & Edit Own Project**| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Send Direct Message** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Initiate Video Call** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Access Admin Console** | ✅ | ✅ | ✅ (Scoped) | ❌ | ❌ | ❌ | ❌ |
| **View Platform Telemetry** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Inspect User Sessions** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Revoke User Session** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Issue Disciplinary Strike**| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Ban / Unban User Account** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Promote User to Admin** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Update System Flags** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Audit Ledger** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Enforcement Layers

1. **Frontend Route Guards (`admin/layout.tsx`):**
   - Redirects non-admin users to `/admin/login` or `/(app)/dashboard`.
   - Never exposes administrative navigation pills to unauthorized accounts.
2. **API Authorization Middleware (`adminAuth.js` & `auth.js`):**
   - Cryptographically unpacks JWT.
   - Queries `users.role` from the database.
   - Throws `401 Unauthorized` or `403 Forbidden` for role discrepancies.
3. **Database Row Level Security (RLS) in `schema.sql`:**
   - Enforces user-ownership policies on `projects`, `teams`, `messages`, and `user_settings`.
   - Admin operations bypass RLS strictly on the backend using `supabaseAdmin` (`service_role` credentials) within audited controllers.

