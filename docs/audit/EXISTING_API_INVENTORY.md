# PROJECTHIVE: EXISTING API INVENTORY & ENDPOINT CONTRACTS

---

## 1. Administrative Endpoints (`/api/admin`)
- `GET /api/admin/stats`: Real-time system metrics (total users, active squads, reports, system load).
- `GET /api/admin/health`: Database, memory, and uptime diagnostics.
- `GET /api/admin/client-telemetry`: Client IP and workstation resolution.
- `GET /api/admin/users`: Paginated directory with strike counts and search.
- `PATCH /api/admin/users/:id/ban`: Ban/Unban user with audit log entry.
- `PATCH /api/admin/users/:id/role`: Modify role (`user` <-> `moderator` <-> `admin`).
- `DELETE /api/admin/users/:id`: Soft/hard delete user record.
- `POST /api/admin/users/:id/strikes`: Issue disciplinary strike with rationale.
- `GET /api/admin/reports`: Fetch pending content moderation reports.
- `PATCH /api/admin/reports/:id/resolve`: Resolve moderation incident.
- `GET /api/admin/teams`: List all teams and capstone squads.
- `DELETE /api/admin/teams/:id`: Disband team and archive records.
- `GET /api/admin/flags`: Retrieve platform operational feature flags.
- `PATCH /api/admin/flags`: Update global feature flags.
- `GET /api/admin/audit-logs`: Paginated administrative audit logs.

---

## 2. Core User Endpoints
- Auth: `/api/auth/login`, `/api/auth/register`, `/api/auth/verify-email`, `/api/auth/refresh`.
- Teams: `/api/teams`, `/api/teams/:id`, `/api/teams/:id/join`.
- Calls: `/api/calls/token`, `/api/calls/end`, `/api/calls/history`.
- Messages: `/api/messages/conversations`, `/api/messages/send`.
