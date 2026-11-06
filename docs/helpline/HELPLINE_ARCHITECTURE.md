# PROJECTHIVE: HELPLINE ARCHITECTURE SPECIFICATION

---

## 1. Connected Architecture
```
   [Student User]                                         [Designated Admin]
  (/help, /help/tickets)                                 (/admin/support)
          │                                                       │
          ▼                                                       ▼
  [User Support Controller]                               [Admin Support Controller]
  (authMiddleware)                                        (adminAuthMiddleware)
          │                                                       │
          └───────────────────────────┬───────────────────────────┘
                                      ▼
                        [Supabase PostgreSQL Singapore]
                         Table: support_tickets (JSONB)
                                      │
                                      ▼
                        [Socket.IO Realtime Gateway]
                         Event: support:ticket:{id}
```
