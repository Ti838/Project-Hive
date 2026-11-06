# PROJECTHIVE: HELPLINE API SPECIFICATION

### User APIs
- `GET /api/support/my-tickets`: Fetch all tickets belonging to authenticated user.
- `POST /api/support/tickets`: Create a new support ticket with subject, category, and initial message.
- `GET /api/support/tickets/:id`: Fetch single ticket conversation (internal notes stripped).
- `POST /api/support/tickets/:id/reply`: Send a reply to an existing ticket.
- `PATCH /api/support/tickets/:id/close`: Mark ticket as closed.

### Admin APIs
- `GET /api/support/admin/tickets`: Filter all system tickets by status, priority, or search.
- `GET /api/support/admin/stats`: Real-time support KPI aggregates.
- `POST /api/support/admin/tickets/:id/reply`: Post admin response or private internal note.
- `PATCH /api/support/admin/tickets/:id/status`: Update ticket status, priority, or category.
