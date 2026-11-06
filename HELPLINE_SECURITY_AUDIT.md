# PROJECTHIVE: HELPLINE SECURITY AUDIT & ACCESS CONTROL

---

## 1. Zero Trust Access Boundaries
- **User Authorization:** Normal users can only view tickets where `ticket.user_id === req.user.id`. Cross-user access returns 404/403.
- **Private Note Filtering:** The controller explicitly filters out any message with `is_internal === true` when accessed by non-admin roles.
- **Admin Clearance:** Admin support endpoints enforce `adminAuthMiddleware` requiring live database role verification (`role === 'admin'`).
