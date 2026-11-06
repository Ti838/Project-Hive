# PROJECTHIVE: HELPLINE EXISTING SYSTEM AUDIT

---

## 1. Existing Foundation & Reusability
- **Database:** Supabase PostgreSQL `support_tickets` table with `user_id`, `ticket_number`, `status`, `messages` (JSONB array).
- **Socket Infrastructure:** Server `io.emit` hooks broadcasting real-time ticket creation and updates.
- **Admin Layout:** Integrated directly into `frontend/src/app/admin/layout.tsx` sidebar under "Support & Helpline".
