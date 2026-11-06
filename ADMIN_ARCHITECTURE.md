# PROJECTHIVE: ADMIN ARCHITECTURE & SERVICE ISOLATION

---

## 1. Domain Separation & Routing
- Subdomain Routing: Proposed admin.projecthive.com or isolated Next.js subroute /admin/*
- Dedicated Layout: frontend/src/app/admin/layout.tsx enforces DesktopGate and isolates admin CSS tokens from normal student views.
- Dedicated Auth Guard: server/middleware/adminAuth.js verifies cryptographic JWT AND live database role (role === 'admin') on every API request.

## 2. Admin Modules Topology
1. Command Center (/admin/dashboard)
2. User Management & Strikes (/admin/users)
3. Moderation Queue (/admin/moderation)
4. Squads & Projects Oversight (/admin/teams)
5. System Flags & Feature Toggles (/admin/system)
6. Audit Ledger (/admin/audit)
7. AI Operations & Telemetry
8. Realtime & LiveKit Operations
9. Security & Access Center
