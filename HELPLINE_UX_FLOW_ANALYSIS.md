# PROJECTHIVE: HELPLINE UX FLOW ANALYSIS

---

## 1. End-to-End User Support Flow
```
[Student User] ──> [/help] ──> Browse FAQ / Search Topics
       │
       └──> [+ Submit Request] ──> Select Category & Priority
                 │
                 ▼
          Ticket Created (PH-2026-XXXXXX)
                 │
                 ▼
          Live Conversation Timeline (Send message / attachments)
```

## 2. End-to-End Admin Support Flow
```
[Admin Console] ──> [/admin/support] ──> Filter Queue (All, Open, Waiting for Admin)
        │
        ▼
   Select Ticket ──> Inspect User Profile & Telemetry
        │
        ├──> Toggle: [x] Private Internal Note ──> Logs strictly for admin audit
        │
        └──> Direct Admin Reply ──> Emits Socket.IO event & shifts status to 'Waiting for User'
```
