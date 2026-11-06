# PROJECTHIVE: HELPLINE DATABASE AUDIT & SCHEMA

---

## 1. `support_tickets` Entity Schema
- `id` (UUID, primary key)
- `ticket_number` (VARCHAR, e.g. "PH-2026-849201")
- `user_id` (UUID, foreign key references `users.id`)
- `subject` (TEXT)
- `category` (VARCHAR)
- `priority` (VARCHAR: `low`, `normal`, `urgent`)
- `status` (VARCHAR: `Open`, `Waiting for Admin`, `Waiting for User`, `Resolved`, `Closed`)
- `messages` (JSONB array containing `id`, `sender_id`, `sender_role`, `content`, `created_at`, `is_internal`)
- `created_at`, `updated_at` (TIMESTAMPTZ)
