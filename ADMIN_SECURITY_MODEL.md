# PROJECTHIVE: ADMIN SECURITY MODEL & ACCESS CONTROL

---

## 1. Zero Trust Principles
- No Client-Side Only Guards: Hiding a sidebar button does not grant security. Every single endpoint in server/routes/admin.routes.js passes through adminAuthMiddleware.
- Live Role Invalidation: If an administrator's account is revoked or downgraded in PostgreSQL, their session is invalidated on their very next API call.
- Hardware & Pointer Gate: Mobile touch environments are actively blocked from mounting the administrative DOM tree.
- Immutable Audit Logging: All sensitive administrative actions (bans, strikes, deletions, flag updates) are recorded in audit_logs with IP address and timestamp.
