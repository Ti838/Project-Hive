# PROJECTHIVE: HELPLINE EXISTING FEATURE INVENTORY

| Feature Component | Route / Endpoint | Backend Controller | Status |
| :--- | :--- | :--- | :--- |
| **User Help Center** | `/help` | `getUserTickets`, `createTicket`, `replyToTicket` | `VERIFIED` |
| **Admin Support Center** | `/admin/support` | `getAdminTickets`, `getSupportStats`, `replyAdminTicket` | `VERIFIED` |
| **Two-Way Messaging** | `POST /api/support/tickets/:id/reply` | Persistent JSONB append + Socket.IO broadcast | `VERIFIED` |
| **Private Notes** | `POST /api/support/admin/tickets/:id/reply` | `is_internal: true`, excluded from user endpoints | `VERIFIED` |
