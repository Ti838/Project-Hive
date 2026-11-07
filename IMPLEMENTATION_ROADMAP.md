# ProjectHive — Master Implementation Roadmap (P0 to P3)

**Document Version:** 1.0.0  
**Execution Target:** ProjectHive Existing Stack Integration  
**Status:** Approved Roadmap  

---

## 1. Phased Execution Roadmap

### Phase P0: Critical Security & Database Foundations (Immediate)
- [x] **Schema Additions:** Create non-destructive `user_sessions` table in `server/database/schema.sql`.
- [x] **Location Privacy Additions:** Add `location_privacy`, `campus_name`, `campus_city` columns to `user_settings` and `users`.
- [x] **Audit Log Resilience:** Verify audit log integrity and ensure administrative actions are immutably captured.

### Phase P1: Device Intelligence & Session Management
- [x] **Session Tracking Backend:** Update `auth.controller.js` to create/refresh `user_sessions` record on every login/token refresh with client device metadata.
- [x] **User Sessions API:** Implement `GET /api/users/me/sessions`, `DELETE /api/users/me/sessions/:id`, and `POST /api/users/me/sessions/revoke-others`.
- [x] **Admin Session Governance API:** Implement `GET /api/admin/users/:id/sessions`, `DELETE /api/admin/users/:id/sessions/:id`, and aggregate `GET /api/admin/devices`.
- [x] **User Settings Integration:** Replace mock sessions in `frontend/src/app/(app)/settings/page.tsx` with live sessions from backend, with one-click revocation.
- [x] **Admin Device & Inspection Drawer:** Build slide-out user inspector in `/admin/users` displaying active sessions, devices, and disciplinary controls.

### Phase P2: Location Intelligence & Campus Discovery
- [x] **Consent-Driven Geolocation Hook:** Create `useLocationIntelligence` with pre-permission explanation dialog, browser geolocation wrapper, and manual campus/city fallback.
- [x] **Location Privacy Controls:** Integrate location privacy settings (`'private' | 'campus' | 'city'`) in `frontend/src/app/(app)/settings/page.tsx` (Privacy Tab).
- [x] **Campus Peer & Squad Discovery:** Add campus-aware filtering to `/api/teams` and `/api/projects`, allowing students to find collaborators at their own university.
- [x] **Admin Campus Distribution Overview:** Expose aggregated campus counts in `GET /api/admin/stats` and render in Admin Overview.

### Phase P3: System Polish, Telemetry Authenticity & Responsive Design
- [x] **Telemetry Cleanup:** Remove synthetic `Math.random()` jitter in `frontend/src/app/admin/layout.tsx`. Connect directly to `/api/health/metrics` or render "Unavailable".
- [x] **Responsive Breakpoint Verification:** Verify all admin tables, drawers, settings tabs, and user dashboards on Mobile (375px), Tablet (768px), and Desktop (1440px).
- [x] **End-to-End Build & Test Validation:** Full TypeScript check, Next.js build compilation, and backend route validation.

