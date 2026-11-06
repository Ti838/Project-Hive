# PROJECTHIVE: HELPLINE DATABASE DESIGN SPECIFICATION

- Uses document-in-row JSONB strategy for messages inside `support_tickets` to ensure atomic message appending and zero join overhead.
- Includes foreign key relationships to `users` table to display real-time student avatars, names, and university departments.
