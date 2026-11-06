# PROJECTHIVE: EXISTING INTEGRATION INVENTORY

| Integration | Provider | Purpose | Status in Codebase |
| :--- | :--- | :--- | :--- |
| **Database & Auth** | Supabase Singapore | User auth, PostgreSQL DB, Storage | `VERIFIED` via `supabaseAdmin` |
| **WebRTC Calling** | LiveKit Cloud SFU | High-definition audio & video calls | `VERIFIED` via `livekit-server-sdk` |
| **AI LLM Cascade** | Groq LPU / Gemini Flash | Project generation, code reviews | `VERIFIED` with multi-tier fallback |
| **Email SMTP** | Brevo (Sendinblue) | OTP verification & password reset | `VERIFIED` in `email.service.js` |
| **Realtime Sockets**| Socket.IO 4.7.2 | Instant messaging, typing, reactions | `VERIFIED` in `server.js` |
