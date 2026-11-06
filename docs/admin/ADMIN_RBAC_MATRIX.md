# PROJECTHIVE: ADMIN RBAC PERMISSION MATRIX

| Role | Access Level | Permitted Actions | Excluded Actions |
| :--- | :--- | :--- | :--- |
| **Admin** | Full Clearance | All modules, ban/unban, strike issuance, system flags, audit logs, role modification. | None |
| **Moderator** | Content Review | Review reports, soft-delete abusive posts, view strike history. | Cannot modify system flags, cannot change user roles. |
| **User** | None (Admin) | Normal student collaboration workspace only. | Blocked from all /admin/* routes and /api/admin/* endpoints. |
