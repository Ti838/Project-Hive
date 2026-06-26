# ProjectHive 🐝

> A premium full-stack social platform for university students to discover teammates, showcase projects, and collaborate in real-time.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://projecthive-bd.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://projecthive-backend.onrender.com)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socketdotio)](https://socket.io)
[![AI](https://img.shields.io/badge/AI-Groq%20+%20Gemini-F55036?logo=groq)](https://groq.com)
[![Calling](https://img.shields.io/badge/Calling-WebRTC%20+%20Jitsi-97C100?logo=webrtc)](https://webrtc.org)
[![Email](https://img.shields.io/badge/Email-Brevo%20SMTP-0092FF)](https://app.brevo.com)

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| 🌐 **Frontend** | <https://projecthive-bd.vercel.app> |
| ⚙️ **Backend API** | <https://projecthive-backend.onrender.com/api> |
| 🔌 **Socket.IO** | `wss://projecthive-backend.onrender.com` |
| 🔑 **Admin Panel** | <https://projecthive-bd.vercel.app/pages/admin/login.html> |

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🔐 **Auth + Google OAuth** | JWT tokens, bcrypt hashing, Google OAuth, Brevo SMTP email verification & password reset |
| 👤 **Profile** | Avatar, banner, skills, social links, completion percentage |
| ⚙️ **Settings** | Account info, password change, notification preferences, theme, privacy |
| 👥 **Find People** | Discover students, send/accept friend requests, filter by skill |
| 🔔 **Notifications** | Real-time Socket.IO push notifications |
| 🏷️ **Teams** | Create/join teams, join-request workflow, team chat |
| 💬 **Messages** | Real-time DMs + team channels, voice messages, replies, reactions, read receipts |
| 📞 **Voice & Video Calling** | 1:1 WebRTC calls + group Jitsi Meet, TURN relay for any network |
| 🚀 **Showcase** | Submit and browse student projects |
| 📰 **Social Feed** | Posts, achievements, polls, @mentions, reactions, comments |
| 🤖 **AI Generator** | Groq (primary) + Gemini (fallback) — chat, idea generation, image analysis |
| 🛡️ **CAPTCHA** | Cloudflare Turnstile bot protection on auth pages |
| 👑 **Admin Panel** | Industrial-grade control center — user/team/project management, maintenance mode, system flags |

---

## 🗂️ Project Structure

```
Project-Hive/
├── public/                              # Frontend (static — served by Vercel)
│   ├── index.html                       # Landing page
│   ├── assets/
│   │   ├── css/
│   │   │   ├── ph-design.css            # CSS variable design tokens (light/dark)
│   │   │   └── ph-system.css            # Sidebar, topbar, layout system
│   │   ├── js/core/
│   │   │   ├── api.js                   # Global API client (auto-detects prod/dev)
│   │   │   ├── layout.js                # Sidebar + theme initialization
│   │   │   ├── ph-sidebar.js            # Centralized navigation sidebar
│   │   │   └── ph-toast.js              # Toast notification system
│   │   └── svg/logo.png                 # Brand logo
│   └── pages/
│       ├── auth/
│       │   ├── login.html               # User login
│       │   ├── register.html            # User registration (+ Turnstile CAPTCHA)
│       │   ├── verify-email.html        # Email verification landing
│       │   ├── forgot-password.html     # Forgot password form
│       │   └── reset-password.html      # Password reset form
│       ├── user/
│       │   ├── dashboard.html           # Main student dashboard
│       │   ├── profile/edit.html        # Profile editor
│       │   ├── settings.html            # Account settings
│       │   ├── people.html              # Find people / friend requests
│       │   ├── notifications.html       # Notification center
│       │   ├── messages.html            # Real-time Socket.IO chat
│       │   ├── teams.html               # Browse & join teams
│       │   ├── teams-create.html        # Create new team
│       │   └── projects/
│       │       ├── showcase.html        # Project showcase gallery
│       │       └── generator.html       # Gemini AI idea generator
│       └── admin/
│           ├── login.html               # Admin-only login portal
│           └── dashboard.html           # Industrial admin control center
│
├── server/                              # Backend (Node.js + Express — hosted on Render)
│   ├── server.js                        # Entry point + Socket.IO setup
│   ├── app.js                           # Express app + route registration + CORS
│   ├── config/
│   │   ├── supabase.js                  # Supabase client (anon + service role)
│   │   └── gemini.js                    # Google Gemini AI setup
│   ├── controllers/
│   │   ├── auth.controller.js           # Register, login, verify email, refresh, reset
│   │   ├── admin.auth.controller.js     # Admin-only login + JWT guard
│   │   ├── users.controller.js          # Profile CRUD + search
│   │   ├── teams.controller.js          # Team management + join requests
│   │   ├── projects.controller.js       # Project showcase CRUD
│   │   ├── messages.controller.js       # Chat message history
│   │   ├── notifications.controller.js  # Notification CRUD
│   │   ├── friends.controller.js        # Friend requests + DM history
│   │   ├── ai.controller.js             # Gemini AI idea generation
│   │   └── admin.controller.js          # Admin operations (users, teams, projects, flags)
│   ├── routes/
│   │   ├── auth.routes.js               # /api/auth/*
│   │   ├── users.routes.js              # /api/users/*
│   │   ├── teams.routes.js              # /api/teams/*
│   │   ├── projects.routes.js           # /api/projects/*
│   │   ├── messages.routes.js           # /api/messages/*
│   │   ├── notifications.routes.js      # /api/notifications/*
│   │   ├── friends.routes.js            # /api/friends/*
│   │   ├── ai.routes.js                 # /api/ai/*
│   │   └── admin.routes.js              # /api/admin/* (admin JWT guard)
│   ├── middleware/
│   │   ├── auth.js                      # JWT verify middleware
│   │   ├── socketAuth.js                # Socket.IO JWT auth
│   │   ├── turnstile.js                 # Cloudflare Turnstile CAPTCHA verification
│   │   ├── sanitize.js                  # XSS input sanitization (global)
│   │   └── errorHandler.js             # Global error handler
│   ├── services/
│   │   ├── email.service.js             # Brevo SMTP (verify, welcome, reset)
│   │   └── socket.service.js            # Socket.IO real-time event handlers
│   ├── database/
│   │   └── schema.sql                   # PostgreSQL schema (run in Supabase SQL editor)
│   └── utils/
│       └── jwt.utils.js                 # JWT sign / verify helpers
│
├── vercel.json                          # Vercel deployment config
├── render.yaml                          # Render Blueprint config
├── README.md                            # This file
├── QUICKSTART.md                        # Local dev quick-start
├── STACK.md                             # Full tech stack & service reference
└── .gitignore
```

---

## 🚀 Quick Start (Local Dev)

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment variables

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000

# Supabase
SUPABASE_URL=https://iekfvgjxkmgduxdvkuxf.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your-secret-here

# Email (Brevo)
BREVO_SMTP_LOGIN=your_smtp_login
BREVO_SMTP_KEY=your_smtp_key
BREVO_FROM_EMAIL=noreply@yourdomain.com

# AI (Google Gemini)
GEMINI_API_KEY=your_gemini_key

# Admin credentials (for /pages/admin/login.html)
ADMIN_EMAIL=admin@projecthive.com
ADMIN_PASSWORD=YourAdminPassword

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5000
```

### 3. Run the server

```bash
cd server
npm run dev
```

### 4. Open in browser

```
http://localhost:5000
```

---

## 🔌 API Reference

### Auth  `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user — sends verification email |
| POST | `/login` | ❌ | Login (email must be verified) |
| POST | `/refresh` | ❌ | Refresh access token |
| POST | `/logout` | ✅ | Invalidate refresh token |
| GET | `/verify-email?token=` | ❌ | Verify email address |
| POST | `/resend-verification` | ❌ | Resend verification email |
| POST | `/forgot-password` | ❌ | Send password reset email |
| POST | `/reset-password` | ❌ | Reset password with token |
| GET | `/google` | ❌ | Initiate Google OAuth → returns Supabase OAuth URL |
| POST | `/google/callback` | ❌ | Exchange Supabase OAuth token for platform JWT |

### Users  `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | ✅ | Get current user profile |
| PUT | `/me` | ✅ | Update profile |
| PATCH | `/me/password` | ✅ | Change password |
| GET | `/search?q=` | ✅ | Search users |
| GET | `/:id` | ✅ | Get user by ID |

### Friends  `/api/friends`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/request/:userId` | ✅ | Send friend request |
| POST | `/accept/:requestId` | ✅ | Accept friend request |
| POST | `/reject/:requestId` | ✅ | Reject friend request |
| GET | `/` | ✅ | My friends list |
| GET | `/requests` | ✅ | Pending requests |
| GET | `/dm/:friendId` | ✅ | DM message history |

### Teams  `/api/teams`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create team |
| GET | `/` | ✅ | Browse teams |
| GET | `/my-teams` | ✅ | My teams |
| GET | `/:id` | ✅ | Team details |
| PUT | `/:id` | ✅ | Update team |
| POST | `/:teamId/join` | ✅ | Send join request |
| POST | `/:teamId/requests/:userId/accept` | ✅ | Accept join request |
| POST | `/:teamId/requests/:userId/reject` | ✅ | Reject join request |
| POST | `/:teamId/leave` | ✅ | Leave team |

### Projects  `/api/projects`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Submit project |
| GET | `/` | ❌ | Browse projects |
| GET | `/:id` | ❌ | Project details |
| PUT | `/:id` | ✅ | Update project |
| DELETE | `/:id` | ✅ | Delete own project |
| POST | `/:id/like` | ✅ | Like / unlike project |

### Messages  `/api/messages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/teams/:teamId` | ✅ | Get team messages |
| POST | `/` | ✅ | Send message (REST fallback) |

### Notifications  `/api/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get all notifications |
| PUT | `/:id/read` | ✅ | Mark single as read |
| PUT | `/read-all` | ✅ | Mark all as read |
| DELETE | `/:id` | ✅ | Delete notification |

### AI  `/api/ai`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/generate-ideas` | ✅ | Generate project ideas (Gemini 2.0 Flash) |
| POST | `/generate-ideas-public` | ❌ | Demo endpoint (no auth) |

### Admin  `/api/admin` *(admin JWT required)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Admin login (credentials from `.env`) |
| GET | `/stats` | Platform-wide statistics |
| GET | `/users` | List all users |
| PATCH | `/users/:id/ban` | Ban / unban user |
| PATCH | `/users/:id/role` | Change user role |
| DELETE | `/users/:id` | Delete user permanently |
| GET | `/teams` | List all teams |
| DELETE | `/teams/:id` | Delete team permanently |
| GET | `/projects` | List all projects |
| DELETE | `/projects/:id` | Delete project permanently |
| PATCH | `/projects/:id/feature` | Feature / unfeature project |
| GET | `/flags` | Get system flags (maintenance, registration) |
| PATCH | `/flags` | Update system flags |

---

## 🔌 Real-time Messaging (Socket.IO)

### Connection

```javascript
const socket = io('https://projecthive-backend.onrender.com', {
  auth: { token: localStorage.getItem('access_token') }
});
```

### Events (Client → Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomId }` | Join a chat room (DM or team) |
| `leave_room` | `{ roomId }` | Leave a chat room |
| `send_message` | `{ roomId, content }` | Send a message |
| `typing` | `{ roomId, isTyping }` | Typing indicator |

### Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ id, content, sender, roomId, createdAt }` | Incoming message |
| `user_typing` | `{ userId, roomId, isTyping }` | Typing indicator |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |
| `notification` | `{ type, message, data }` | Real-time notification |

### Call Events (Client → Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `call:initiate` | `{ roomId, targetId, callerName, isWebRTC, isVoiceOnly }` | Start a call |
| `call:accept` | `{ roomId, targetId }` | Accept incoming call |
| `call:decline` | `{ roomId, targetId }` | Decline incoming call |
| `call:hangup` | `{ roomId, targetId }` | End active call |
| `call:group` | `{ roomId, teamId, callerName }` | Initiate group call |
| `webrtc:signal` | `{ targetId, signal }` | WebRTC SDP/ICE signaling |

### Call Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `call:incoming` | `{ roomId, callerName, callerId, isWebRTC, isVoiceOnly }` | Incoming call alert |
| `call:accepted` | `{ roomId }` | Call was accepted |
| `call:declined` | `{ roomId }` | Call was declined |
| `call:ended` | `{ roomId }` | Call ended |
| `call:error` | `{ message }` | Call error (offline, not friends) |
| `webrtc:signal` | `{ senderId, signal }` | WebRTC signal relay |

---

## 👑 Admin Panel

The admin panel is a fully separate, secure control center.

### Accessing Admin

1. Go to: `https://projecthive-bd.vercel.app/pages/admin/login.html`
2. Enter credentials (configured in server `.env` via `ADMIN_EMAIL` + `ADMIN_PASSWORD`)
3. Access the industrial dashboard

### Admin Capabilities

| Section | Actions |
|---------|---------|
| **Overview** | Platform-wide stats, recent members |
| **Users** | List, search, ban/unban, promote/demote, delete |
| **Teams** | List, search, filter by status, delete |
| **Projects** | List, search, feature/unfeature, delete |
| **Analytics** | Role distribution charts, team status breakdown |
| **System** | Maintenance mode toggle, registration on/off, health check |

---

## 🎨 Design System

### CSS Variables (`ph-design.css`)

```css
--bg, --sf, --sf2      /* Page + surface backgrounds */
--bd, --bd2            /* Borders */
--tx, --tx2, --sub     /* Primary, secondary, muted text */
--ac, --ac-light       /* Accent colour (indigo #6366f1) */
--shadow               /* Card shadow */
/* Dark mode applied via html.dark class */
/* Admin panel uses its own isolated CSS token set */
```

### JS Components

| Component | Usage |
|-----------|-------|
| `api.js` | Global API client with auto token refresh |
| `ph-sidebar.js` | Centralized nav sidebar (user pages only) |
| `ph-toast.js` | `PHToast.success()` / `.error()` / `.info()` |

---

## 🔒 Security

> 21 vulnerabilities identified and resolved — see [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md) for full OWASP-classified report.

### Authentication & Access Control
- Passwords hashed with **bcrypt** (12 rounds)
- JWT access tokens expire in **24h**, refresh tokens in **7 days**
- **Token type validation** — access and refresh tokens cannot be confused
- Email must be verified before first login
- All user routes protected by `authMiddleware`
- Admin routes protected by dedicated `requireAdminToken` guard (4h expiry)
- Admin credentials stored **only** in server environment variables (never in DB)
- **No hardcoded fallback secrets** — server fails fast if `JWT_SECRET` is missing
- Admin login uses **timing-safe comparison** (prevents timing attacks)

### Input Validation & Injection Prevention
- **XSS sanitization middleware** strips `<script>`, event handlers, `javascript:` URIs from all inputs
- **SQL/PostgREST filter injection** prevented via `sanitizeSearch()` across all 7 search endpoints
- **SSRF protection** blocks internal/private IPs on URL metadata scraper

### Infrastructure Security
- **Content Security Policy (CSP)** with strict allowlist via Helmet
- **HSTS**, **Referrer-Policy**, **Permissions-Policy** headers
- `X-Frame-Options: SAMEORIGIN` prevents clickjacking
- **Cloudflare Turnstile** CAPTCHA verification on auth endpoints
- **Layered rate limiting**: 500 req/15min global + 20 req/15min on auth endpoints
- **Admin brute-force protection**: 5 attempts per 15-minute lockout
- Body size limit capped at **2MB** (prevents DoS)
- Dev privilege escalation endpoint disabled at route level in production

---

## 🚀 Deployment

```bash
# Auto-deploy on every push
git add .
git commit -m "your change"
git push origin main
# → Vercel deploys frontend in ~30 seconds
# → Render deploys backend in ~2 minutes
```

---

*Built with ❤️ for university students — ProjectHive © 2026 🐝*
