# PROJECTHIVE: EXISTING SYSTEM ARCHITECTURE & CODEBASE FORENSIC AUDIT

**Audit Date:** 2026-11-06  
**Auditor:** Principal Enterprise Systems Architect & Security Engineer  
**Codebase Root:** `c:\Users\TIMON\Desktop\Project-Hive`

---

## 1. High-Level Architecture Topology
- **Frontend Layer:** Next.js 16.3.3 App Router, React 19.2.8, Tailwind CSS v4, Webpack bundler, Lucide Icons, GSAP, Zustand store (`useAuthStore`, `useCallStore`).
- **Backend Service Layer:** Node.js v20+ / Express 4.18.2 REST API Server, Socket.IO 4.7.2 Realtime Gateway.
- **Database & Identity:** Supabase PostgreSQL (Singapore cluster), Row Level Security (RLS), Supabase Storage for avatars and attachments.
- **Realtime Media:** LiveKit Cloud SFU WebRTC audio/video calling (`livekit-server-sdk` v2.9.4 & `livekit-client` v2.8.2).
- **AI Acceleration:** Cascaded Multi-LLM provider (`server/routes/ai.routes.js`) using Groq LPU (Llama 3.3 70B), Google Gemini 2.0 Flash, and OpenRouter Ultra fallback.
- **Transactional Communication:** Brevo (Sendinblue) SMTP email dispatcher.

---

## 2. Directory Structure Breakdown
- `frontend/src/app/(app)/`: Authenticated student workspace routes (Feed, Messages, Teams, Projects, Showcase, People, Settings, Profile, Generator).
- `frontend/src/app/admin/`: Administrative control center (`/admin`, `/admin/dashboard`, `/admin/users`, `/admin/moderation`, `/admin/teams`, `/admin/system`, `/admin/audit`, `/admin/login`).
- `frontend/src/components/admin/DesktopGate.tsx`: Hardware-accelerated Desktop Workstation Gate blocking mobile viewports (<1024px) and coarse touch pointers.
- `server/routes/`: Express API route controllers with `adminAuthMiddleware`, `authMiddleware`, rate limiting, and CORS configuration.
- `server/controllers/`: Business logic implementations for `admin.controller.js`, `calls.controller.js`, `messages.controller.js`, `teams.controller.js`, etc.
