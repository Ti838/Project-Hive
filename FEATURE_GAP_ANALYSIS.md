# ProjectHive — Feature Gap Analysis & Action Plan

**Document Version:** 1.0.0  
**Target Environment:** ProjectHive Complete Application Stack  
**Status:** Validated Forensic Gap Analysis  

---

## 1. Feature Gap Inventory

| Module | Expected Production Standard | Current State | Root Cause Gap | Required Action |
|---|---|---|---|---|
| **Active Sessions (User)** | Users view real active devices, IPs, and can revoke sessions individually or globally. | Hardcoded state in `settings/page.tsx` (`MacBook Pro`, `iPhone 15 Pro`). | No `user_sessions` table or backend sessions API. | Implement `user_sessions` table, `GET/DELETE /api/users/me/sessions`, and connect React state. |
| **Session Control (Admin)**| Admins inspect real user sessions, devices, and revoke compromised logins. | Only single `last_login_*` fields on `users` table. | Missing admin session endpoints and user session drawer. | Implement `GET /api/admin/users/:id/sessions` and administrative revocation with audit logging. |
| **Device Intelligence (Admin)** | Aggregate breakdown of campus devices (Mobile vs Desktop, OS, Browser). | Dispersed fields without aggregated reporting. | Missing device aggregation API in `admin.controller.js`. | Implement `GET /api/admin/devices` and dashboard widgets. |
| **Location Geolocation** | Browser Geolocation API with pre-permission explanation dialog and manual fallback. | University is plain text string; IP country/city on login. | No client Geolocation hook, no location privacy selector. | Build `useLocation` hook, pre-prompt dialog, and manual campus/city selector. |
| **Location Privacy** | Users control whether location is Private, Campus-Only, or Public. | No privacy toggle for location. | `user_settings` lacks `location_privacy` field. | Add `location_privacy` to `user_settings` and UI in `settings/page.tsx`. |
| **Campus & Nearby Discovery** | Filter teams and projects by campus or geographical proximity. | Only category text filtering. | Query filters do not support `university` or `campus` matching. | Add campus filter in `/api/teams` and `/api/projects` endpoints and UI. |
| **Telemetry Authenticity** | Real instrumentation metrics or explicit "Unavailable" indicators. | Jitter fallbacks using `Math.random()` in `admin/layout.tsx`. | Synthetic simulation code written as placeholder. | Replace jitter with real metrics from `/api/health/metrics` or `"Unavailable"`. |
| **User Deep Inspection** | Slide-out drawer in `/admin/users` to view full user profile, devices, and teams. | Only modal for strikes exists in `/admin/users`. | Missing detailed user drawer component in Admin UI. | Build User Inspection Drawer in `/admin/users/page.tsx`. |

---

## 2. Risk Mitigation & Integrity Assurance

1. **Zero Database Data Loss:** All new tables and columns (`user_sessions`, `user_settings.location_privacy`) are non-destructive and additive (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
2. **Backward Compatibility:** If `user_sessions` lookup yields zero historical sessions for a legacy account, the system synthesizes a valid fallback session record from `users.last_login_*` and current JWT rather than failing.
3. **Privacy Compliance:** GPS coordinates are never obtained without an explicit user-initiated click and consent dialog. Approximate IP geolocation is never conflated with GPS accuracy.

