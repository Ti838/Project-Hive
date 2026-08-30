# ProjectHive 🐝

> **A high-performance full-stack collaboration, teammate discovery, and incubator platform for university students.** Built with Next.js 16 App Router, React 19, TypeScript, Node.js, Express, Supabase (PostgreSQL), Socket.IO, Groq & Gemini AI, and WebRTC.

---

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20App%20Router-black?logo=nextdotjs)](https://projecthive-bd.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-46E3B7?logo=render)](https://projecthive-backend.onrender.com)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socketdotio)](https://socket.io)
[![AI Engine](https://img.shields.io/badge/AI-Groq%20Llama%203.3%20%2B%20Gemini%202.5-F55036?logo=groq)](https://groq.com)
[![Calling](https://img.shields.io/badge/Calling-WebRTC%20%2B%20Jitsi-97C100?logo=webrtc)](https://webrtc.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌐 Live Production Deployments

| Service | Endpoint | Description |
|---|---|---|
| 🌐 **Student Web Platform** | [https://projecthive-bd.vercel.app](https://projecthive-bd.vercel.app) | Production Next.js 16 frontend |
| 👑 **Enterprise Admin Portal** | [https://projecthive-bd.vercel.app/admin/login](https://projecthive-bd.vercel.app/admin/login) | Role-gated administration console |
| ⚙️ **Backend API Gateway** | [https://projecthive-backend.onrender.com/api](https://projecthive-backend.onrender.com/api) | Express REST API Engine |
| 🔌 **Real-time WebSocket** | `wss://projecthive-backend.onrender.com` | Socket.IO bi-directional cluster |

---

## 🚀 Key Feature Modules

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ProjectHive Core Modules                        │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 👥 Team Discovery │ 💬 Real-Time Chat │ 🤖 AI Project Studio           │
│ • Skill filters   │ • Socket.IO DMs   │ • Groq Llama 3.3 70B (Primary) │
│ • Join requests   │ • Typing indicators│ • Gemini 2.5 Flash (Fallback) │
│ • Role management │ • WebRTC 1:1 Call │ • Structured proposal gen      │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ 🚀 Showcase Hub   │ 📰 Social Feed    │ 👑 Enterprise Admin Console    │
│ • Student demos   │ • Reactions       │ • Telemetry & node health      │
│ • GitHub repos    │ • Interactive Poll│ • Ban / Role governance        │
│ • Peer reviews    │ • Infinite scroll │ • Real-time audit stream       │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 1. 👥 Teammate & Squad Discovery
- Find collaborators based on technical skillset (React, Python, Flutter, AI, etc.) and university.
- One-click join requests with applicant approval workflows for squad leaders.

### 2. 💬 Real-Time Messaging & Calling
- Low-latency direct messaging & team channel communication powered by **Socket.IO**.
- 1-on-1 **WebRTC audio/video calling** with STUN/TURN relay and Jitsi Meet group calling fallback.
- Live typing indicators, message reply threads, and online presence indicators.

### 3. 🤖 AI Project Idea Studio
- Ultra-fast project proposal synthesis powered by **Groq Llama-3.3-70B** with automatic **Google Gemini 2.5 Flash** fallback.
- Generates structured project proposals with difficulty rating, estimated timeline, feature list, and tech stack tags.

### 4. 👑 Enterprise Admin Control Center (`/admin/dashboard`)
- **Real-Time Telemetry**: Live active user count, message volume, database cluster ping, and API health.
- **User Governance**: Searchable user directory, instant account ban/unban toggles, role elevation (`student` ↔ `admin`), and account deletion.
- **Showcase Curation**: Feature student capstones on the front page and moderate submissions.
- **System Kill-Switches**: One-click toggles for Maintenance Mode, Student Registration Gateway, and Institutional Email Verification.
- **Live Audit Trail**: Terminal-style live stream of administrative actions.

---

## 🗂️ Production Repository Architecture

```text
Project-Hive/
├── frontend/                            # Modern Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/                         # 21 Prerendered Routes
│   │   │   ├── (app)/                   # Protected Shell (Dashboard, Feed, Chat, Teams, Profile)
│   │   │   ├── admin/                   # /admin/login & /admin/dashboard
│   │   │   ├── page.tsx                 # High-conversion Landing Page
│   │   │   └── globals.css              # TailwindCSS v4 @theme tokens & glassmorphism
│   │   ├── components/layout/           # AppShell, Sidebar, Topbar, MobileNav
│   │   ├── hooks/                       # useSocket (Real-time), useAuth (Guard)
│   │   └── lib/                         # Typed API client, Zustand stores, Utilities
│   └── package.json
│
├── server/                              # Node.js + Express 4.x Backend Engine
│   ├── server.js                        # HTTP + Socket.IO Server initialization
│   ├── app.js                           # Express routing, CORS, Rate limits, Security CSP
│   ├── config/                          # Supabase, Groq & Gemini AI connectors
│   ├── controllers/                     # Business logic (Auth, Users, Teams, Chat, AI, Admin)
│   ├── middleware/                      # JWT auth, PostgreSQL error handler, Turnstile
│   ├── routes/                          # REST API route endpoints
│   ├── services/                        # Socket.IO event handlers & Brevo SMTP email service
│   └── database/
│       └── schema.sql                   # PostgreSQL schema definition
│
├── ARCHITECTURE.md                      # Comprehensive Mermaid diagrams & technical specs
├── STACK.md                             # Service credentials & Socket.IO event reference
├── QUICKSTART.md                        # Local development quick-start guide
└── LICENSE                              # MIT Open-Source License
```

---

## ⚡ Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Ti838/Project-Hive.git
cd Project-Hive
```

### 2. Configure Environment Variables
Create `server/.env` with your API keys:
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your-secure-jwt-secret

GROQ_API_KEY=gsk_your_groq_key
GEMINI_API_KEY=your_gemini_key

ADMIN_EMAIL=admin@projecthive.com
ADMIN_PASSWORD=YourSecurePassword123
FRONTEND_URL=http://localhost:3000
```

### 3. Launch Both Backend & Frontend
Run via the Windows batch script:
```powershell
.\start-project.bat
```
Or start manually in two terminals:
```bash
# Terminal 1 — Backend API (Port 5000)
cd server
npm run dev

# Terminal 2 — Next.js 16 Frontend (Port 3000)
cd frontend
npm run dev
```

Visit:
* 🌐 **Student Application**: `http://localhost:3000`
* 👑 **Admin Console**: `http://localhost:3000/admin/login`

---

## 🔒 Security & Standards Compliance

- **Authentication**: Double-layer JWT with access tokens (15m expiration) + database-persisted refresh token rotation.
- **Database Error Resilience**: Native PostgreSQL / Supabase error codes (`23505` duplicate, `23503` FK constraint, `PGRST116` not found).
- **Sanitization**: OWASP Top 10 XSS input sanitization applied to all user-generated content.
- **Accessibility**: WCAG 2.1 AA compliant color contrast ratios across dark & light modes.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
