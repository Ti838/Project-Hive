# ProjectHive — Complete Tech Stack & Service Reference 🐝

> This document contains every service, technology, URL, and configuration detail used in ProjectHive.
> **Keep the Environment Variables section private — contains sensitive credentials.**

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        USER / ADMIN                          │
└─────────────────────────────┬────────────────────────────────┘
                              │  HTTPS
┌─────────────────────────────▼────────────────────────────────┐
│            FRONTEND — Vercel (Static Site)                   │
│         https://projecthive-bd.vercel.app                   │
│   Pure HTML + CSS + Vanilla JavaScript (no build step)      │
└─────────────────────────────┬────────────────────────────────┘
                              │  REST API + WebSocket (WSS)
┌─────────────────────────────▼────────────────────────────────┐
│            BACKEND — Render (Node.js)                        │
│        https://projecthive-backend.onrender.com             │
│           Express.js + Socket.IO + JWT Auth                 │
└──────────┬──────────────────┬──────────────────┬────────────┘
           │                  │                  │
      Supabase           Brevo SMTP         Google Gemini
   (PostgreSQL DB)         (Email)           (AI / LLM)
```

---

## 🌐 FRONTEND — Vercel

| Item | Value |
|------|-------|
| **Platform** | Vercel |
| **Plan** | Free (Hobby) |
| **Live URL** | https://projecthive-bd.vercel.app |
| **Dashboard** | https://vercel.com/aloneboy0022ti-gmailcoms-projects/projecthive |
| **GitHub Repo** | https://github.com/Ti838/Project-Hive |
| **Output Directory** | `public/` |
| **Build Command** | `echo 'Static site — no build needed'` |
| **Framework** | None (pure HTML/CSS/JS) |
| **Auto Deploy** | ✅ On every `git push origin main` |
| **Deploy Time** | ~30 seconds |

### Frontend Tech Stack

| Technology | Version | Usage / Purpose |
|-----------|---------|-----------------|
| **HTML5** | — | Provides structural semantic foundation for the application. |
| **CSS3 + CSS Variables** | — | Powers the design system (`ph-design.css`, `ph-system.css`) and responsive grids without external heavy CSS frame dependencies. |
| **Vanilla JavaScript** | ES2020+ | Handles DOM manipulation, routing triggers, media resizing, API coordination, and Socket event listening. |
| **Socket.IO Client** | v4 CDN | Drives all real-time communication events (chat, notifications, typing indicators, active status, Jitsi room syncing). |
| **Jitsi Meet External API** | v2 CDN | Connects users in peer-to-peer secure audio/video calling within the chat window. |
| **Google Fonts (Inter)** | — | Primary typography stylesheet for a clean, premium font aesthetic. |
| **Google Material Symbols** | — | Flexible modern icon system used across all interface components. |
| **Cloudflare Turnstile** | — | Lightweight CAPTCHA validation verifying users are human during login and sign-up. |

### Key Frontend Files & Features

| File | Purpose / Role |
|------|----------------|
| `public/assets/js/core/api.js` | **Global API Client:** Centralizes requests, manages bearer JWT injection, auto-detects dev/prod endpoints, and handles automatic 401 token refresh loops. |
| `public/assets/js/core/layout.js` | **Layout Coordinator:** Handles theme (dark/light) states and triggers sidebar styling. |
| `public/assets/js/core/ph-sidebar.js` | **Premium Portal Shell:** Builds the collapsible sidebar, mobile bottom navigation, Ctrl+K global search modal, and intercepts clicks for SPA-style page transitions. |
| `public/assets/js/core/ph-toast.js` | **Notification Toast:** Lightweight, non-intrusive popup helper for success, warning, or error alerts. |
| `public/assets/css/ph-design.css` | **Design Token Dictionary:** Standardizes semantic HSL color variables, dark theme variables, and border tokens. |
| `public/assets/css/ph-system.css` | **Grid & Layout Rules:** Houses custom layout specifications, responsive glassmorphic cards, and hover micro-animations. |
| `public/pages/admin/dashboard.html` | **Admin Dashboard:** Standalone, high-fidelity console for university moderators to control system flags, ban users, moderate posts, and analyze metrics. |
| `public/pages/admin/login.html` | **Admin Entrance:** Form allowing admin-only login validated against secure environment configuration variables. |

### 🛠️ Custom Frontend Features & Optimizations

#### 1. SPA-style Page Transition Engine
Static Multi-Page Applications (MPAs) typically suffer from browser screen reloads (white flashes). To solve this:
* **Top Progress Bar:** An animated, linear-gradient progress bar (`#ph-progress-bar`) is injected on click, moving quickly to 75% width to give instant feedback.
* **Opacity Fade Interceptor:** Navigation links are intercepted. A `.ph-page-fadeout` transition triggers a `0.22s` fade-out of the page container. Once complete, the browser updates `location.href`. The new page fades in from `opacity: 0` to `1` instantly.

#### 2. HTML5 Canvas Resizing & Compression Pipeline
To avoid Supabase storage payload constraints (base64 size limit errors) and optimize user bandwidth:
* **Image Compression:** Profile avatars and banners are loaded client-side into an offscreen HTML5 Canvas.
* **Dimensions & Quality:** Avatars are scaled and cropped to `400x400` pixels (1:1 ratio); banners are scaled to `1200x675` pixels. The image is exported at `0.85` JPEG quality, reducing image sizes from 5MB–10MB down to `<150KB` before uploading.

#### 3. Persisted Collapsible Sidebars
* **User Sidebar:** Compresses from a detailed `260px` sidebar into an icon-only `70px` tray using cubic-bezier transitions.
* **Admin Sidebar:** Compresses from `248px` to `70px` and reflows administrative panels smoothly.
* **Persistence:** The collapsible state is saved under `ph-sidebar-collapsed` in `localStorage` to ensure consistency as users traverse pages.

---

## ⚙️ BACKEND — Render

| Item | Value |
|------|-------|
| **Platform** | Render |
| **Plan** | Free |
| **Service Name** | `projecthive-backend` |
| **Service ID** | `srv-d8mhi8rtqb8s73c3n5qg` |
| **Live URL** | https://projecthive-backend.onrender.com |
| **API Base** | https://projecthive-backend.onrender.com/api |
| **Dashboard** | https://dashboard.render.com/web/srv-d8mhi8rtqb8s73c3n5qg |
| **GitHub Repo** | https://github.com/Ti838/Project-Hive (branch: `main`) |
| **Root Directory** | `server/` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Auto Deploy** | ✅ On every `git push origin main` |
| **Deploy Time** | ~2–3 minutes |
| **Cold Start** | ~50 seconds (free tier sleeps after 15 min inactivity) |

### Backend Tech Stack

| Technology | Version | Usage |
|-----------|---------|-------|
| Node.js | 18+ | Runtime |
| Express.js | 4.x | HTTP server + REST API routing |
| Socket.IO | 4.x | Real-time WebSocket server |
| @supabase/supabase-js | 2.x | PostgreSQL database client |
| bcryptjs | — | Password hashing (12 rounds) |
| jsonwebtoken | — | JWT access + refresh tokens (HS256) |
| nodemailer | — | SMTP email sending via Brevo |
| @google/generative-ai | — | Google Gemini 2.0 Flash integration |
| express-rate-limit | — | Layered API rate limiting (global + auth-specific) |
| helmet | — | HTTP security headers + CSP |
| cors | — | CORS configuration |
| morgan | — | HTTP request logging |

### Backend File Structure

```
server/
├── server.js                    # Entry: starts HTTP + Socket.IO
├── app.js                       # Express config, CORS, route registration
├── config/
│   ├── supabase.js              # Supabase anon + service-role clients
│   └── gemini.js                # Gemini AI client setup
├── controllers/
│   ├── auth.controller.js       # Register, login, verify, refresh, reset password
│   ├── admin.auth.controller.js # Admin login (env-based, no DB lookup)
│   ├── users.controller.js      # Profile CRUD, search, settings
│   ├── teams.controller.js      # Teams CRUD, join requests, membership
│   ├── projects.controller.js   # Project showcase CRUD, likes
│   ├── messages.controller.js   # Chat message history
│   ├── notifications.controller.js # Notification management
│   ├── friends.controller.js    # Friend requests, DM history
│   ├── ai.controller.js         # Gemini idea generation
│   └── admin.controller.js      # Admin: users, teams, projects, system flags
├── routes/
│   ├── auth.routes.js           # /api/auth/*
│   ├── users.routes.js          # /api/users/*
│   ├── teams.routes.js          # /api/teams/*
│   ├── projects.routes.js       # /api/projects/*
│   ├── messages.routes.js       # /api/messages/*
│   ├── notifications.routes.js  # /api/notifications/*
│   ├── friends.routes.js        # /api/friends/*
│   ├── ai.routes.js             # /api/ai/*
│   └── admin.routes.js          # /api/admin/* (admin JWT guard)
├── middleware/
│   ├── auth.js                  # JWT verify, sets req.user
│   ├── socketAuth.js            # Socket.IO JWT handshake auth
│   ├── turnstile.js             # Cloudflare Turnstile CAPTCHA verification
│   ├── sanitize.js              # XSS input sanitization (global)
│   └── errorHandler.js          # Global Express error handler
├── services/
│   ├── email.service.js         # Brevo SMTP: verify, welcome, reset emails
│   └── socket.service.js        # Socket.IO event handlers (rooms, typing, online)
├── database/
│   └── schema.sql               # Full PostgreSQL schema — run once in Supabase
└── utils/
    └── jwt.utils.js             # generateAccessToken, generateRefreshToken, verify
```

---

## 🗄️ DATABASE — Supabase (PostgreSQL)

| Item | Value |
|------|-------|
| **Platform** | Supabase |
| **Plan** | Free |
| **Project Name** | ProjectHive |
| **Project ID** | `iekfvgjxkmgduxdvkuxf` |
| **Region** | Southeast Asia (Singapore) |
| **Dashboard** | https://supabase.com/dashboard/project/iekfvgjxkmgduxdvkuxf |
| **SQL Editor** | https://supabase.com/dashboard/project/iekfvgjxkmgduxdvkuxf/editor |
| **Database URL** | `https://iekfvgjxkmgduxdvkuxf.supabase.co` |

### Database Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts, profile data, role, verification status, ban status |
| `teams` | Team details, category, status, member list (JSONB array) |
| `team_members` | Team membership junction table |
| `join_requests` | Team join request workflow (pending / accepted / rejected) |
| `projects` | Project showcase submissions, likes, featured flag |
| `messages` | Chat messages (DM + team channels) |
| `notifications` | User notifications with type and read status |
| `friends` | Accepted friendships |
| `friend_requests` | Pending friend requests |
| `posts` | Social feed updates & achievements posted by students |
| `post_reactions` | Student reactions (like, celebrate, support) to feed posts |
| `post_comments` | Discussion comments on feed posts |

### Setup

```
1. Open: https://supabase.com/dashboard/project/iekfvgjxkmgduxdvkuxf/editor
2. Copy the contents of: server/database/schema.sql
3. Paste into the SQL editor and click RUN
```

---

## 🔌 REAL-TIME MESSAGING — Socket.IO

| Item | Value |
|------|-------|
| **Server** | Hosted on Render (same process as REST API) |
| **WebSocket URL** | `wss://projecthive-backend.onrender.com` |
| **Client Library** | Socket.IO v4 (CDN) |
| **Auth Method** | JWT token in `socket.handshake.auth.token` |

### Room Naming Convention

| Room Type | Room ID Format | Example |
|-----------|---------------|---------| 
| Direct Message | `dm_[userId1]_[userId2]` (IDs sorted ascending) | `dm_abc123_xyz789` |
| Team Chat | `team_[teamId]` | `team_team456` |

### Socket Events

**Client → Server:**
```javascript
socket.emit('join_room',    { roomId: 'team_xxx' });
socket.emit('leave_room',   { roomId: 'team_xxx' });
socket.emit('send_message', { roomId: 'team_xxx', content: 'Hello!' });
socket.emit('typing',       { roomId: 'team_xxx', isTyping: true });
socket.emit('call:initiate',{ roomId, peerId }); // Triggers Jitsi call
socket.emit('call:accept',  { roomId });         // Accepts incoming call
socket.emit('call:decline', { roomId });         // Rejects incoming call
socket.emit('call:hangup',  { roomId });         // Ends active call
socket.emit('whiteboard:draw',  { x0, y0, x1, y1, color, size, isEraser }); // Live drawing coords
socket.emit('whiteboard:clear', {}); // Request board clear
```

**Server → Client:**
```javascript
socket.on('new_message',  ({ id, content, sender, roomId, createdAt }) => {});
socket.on('user_typing',  ({ userId, roomId, isTyping }) => {});
socket.on('user_online',  ({ userId }) => {});
socket.on('user_offline', ({ userId }) => {});
socket.on('notification', ({ type, message, data }) => {});
socket.on('call:incoming',({ roomId, callerId, callerName }) => {});
socket.on('call:accepted',({ roomId }) => {});
socket.on('call:declined',({ roomId }) => {});
socket.on('call:hungup',  ({ roomId }) => {});
socket.on('whiteboard:draw',  ({ x0, y0, x1, y1, color, size, isEraser }) => {}); // Sync drawing coords
socket.on('whiteboard:clear', () => {}); // Sync board clear
```

### Frontend Connection

```javascript
const socket = io('https://projecthive-backend.onrender.com', {
  auth: { token: localStorage.getItem('access_token') },
  transports: ['websocket', 'polling']
});
```

---

## 📧 EMAIL — Brevo SMTP

| Item | Value |
|------|-------|
| **Platform** | Brevo (formerly Sendinblue) |
| **Plan** | Free (300 emails/day) |
| **Dashboard** | https://app.brevo.com |
| **SMTP Host** | `smtp-relay.brevo.com` |
| **SMTP Port** | `587` |
| **SMTP Login** | `ae95e5001@smtp-brevo.com` |
| **From Email** | `timonbiswas33@gmail.com` |
| **From Name** | `ProjectHive` |

### Email Types

| Type | Trigger | Function |
|------|---------|----------|
| Email Verification | User registers | `sendVerificationEmail()` |
| Welcome | Email verified | `sendWelcomeEmail()` |
| Password Reset | Forgot password | `sendPasswordResetEmail()` |

### Email Verification Flow

```
1. User registers → account created (is_verified: false)
2. Brevo sends verification email with token link
3. User clicks → /pages/auth/verify-email.html?token=xxx
4. Page calls: GET /api/auth/verify-email?token=xxx
5. Backend sets is_verified = true in Supabase
6. Welcome email sent, user redirected to login
7. User can now log in ✅
```

---

## 🤖 AI — Google Gemini

| Item | Value |
|------|-------|
| **Service** | Google AI Studio |
| **Model** | `gemini-2.0-flash` |
| **Plan** | Free tier (1M tokens/day) |
| **API Key Page** | https://aistudio.google.com/apikey |
| **Usage** | Generate tailored project ideas from user input |
| **Endpoints** | `/api/ai/generate-ideas` (auth), `/api/ai/generate-ideas-public` (demo) |

---

## 🛡️ CAPTCHA — Cloudflare Turnstile

| Item | Value |
|------|-------|
| **Service** | Cloudflare Turnstile |
| **Plan** | Free (unlimited) |
| **Dashboard** | https://dash.cloudflare.com/turnstile |
| **Pages Protected** | Register, Login |
| **Site Key** | Configured in HTML (`data-sitekey`) |
| **Secret Key** | `TURNSTILE_SECRET_KEY` in server `.env` |

> ⚠️ Currently using **test keys** (always pass). Replace with real Cloudflare keys for stricter production enforcement.

---

## 🔐 AUTHENTICATION

| Item | Value |
|------|-------|
| **Method** | JWT (JSON Web Tokens) |
| **Algorithm** | HS256 (HMAC SHA-256) |
| **Access Token Expiry** | 24 hours |
| **Refresh Token Expiry** | 7 days |
| **Password Hashing** | bcrypt (12 rounds) |
| **Email Verification** | Required before first login |

### JWT Flow

```
User logs in
   → accessToken (24h) + refreshToken (7d) issued
   → Each API request: Authorization: Bearer <accessToken>
   → If 401 received → POST /api/auth/refresh → new accessToken
   → Logout → refreshToken invalidated in Supabase users table
```

### Admin Auth (Separate System)

```
Admin logs in at /pages/admin/login.html
   → Credentials checked against ADMIN_EMAIL + ADMIN_PASSWORD in .env (never DB)
   → Timing-safe comparison via crypto.timingSafeEqual (prevents timing attacks)
   → Brute-force protection: 5 attempts per 15-minute window
   → Short-lived admin JWT issued (4h), stored as admin_token in localStorage
   → All /api/admin/* routes protected by requireAdminToken middleware
   → Admin JWT has { id: 'admin', role: 'admin', type: 'admin_access' }
```

---

## ⚙️ ENVIRONMENT VARIABLES

### Render (Backend) — Required

```env
# Server
NODE_ENV=production
PORT=10000

# Supabase (PostgreSQL)
SUPABASE_URL=https://iekfvgjxkmgduxdvkuxf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=ph-jwt-prod-2026-projecthive-super-secure-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Email (Brevo SMTP)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_LOGIN=ae95e5001@smtp-brevo.com
BREVO_SMTP_KEY=xsmtpsib-...
BREVO_FROM_EMAIL=timonbiswas33@gmail.com

# Frontend URL (for CORS + email verification links)
FRONTEND_URL_PROD=https://projecthive-bd.vercel.app

# Admin credentials (used by /pages/admin/login.html)
ADMIN_EMAIL=timonbiswas33@gmail.com
ADMIN_PASSWORD=ProjectHive@Admin2026!

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=0x4AAAAAAADkFwZHZ-...

# Google Gemini AI
GEMINI_API_KEY=AIza...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Vercel (Frontend) — None Required

> The frontend is 100% static HTML/CSS/JS. No environment variables needed.
> The backend API URL is auto-detected in `public/assets/js/core/api.js`.

---

## 📄 DEPLOYMENT WORKFLOW

### Automated (Recommended)

```bash
git add .
git commit -m "feat: your change description"
git push origin main
# → Vercel: frontend live in ~30 seconds
# → Render: backend live in ~2-3 minutes
```

### Manual Deploy

| Platform | Steps |
|----------|-------|
| **Vercel** | Dashboard → Deployments → Redeploy latest |
| **Render** | Dashboard → Manual Deploy → Deploy latest commit |

---

## 🧪 LOCAL DEVELOPMENT

```bash
# 1. Clone the repository
git clone https://github.com/Ti838/Project-Hive.git
cd Project-Hive

# 2. Install backend dependencies
cd server
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your credentials

# 4. Start the backend server
npm run dev
# → http://localhost:5000

# Frontend is served automatically by Express as static files
# Admin panel: http://localhost:5000/pages/admin/login.html
```

---

## 📊 FREE TIER LIMITS

| Service | Free Limit | Notes |
|---------|-----------|-------|
| **Vercel** | Unlimited static deployments | No serverless functions used |
| **Render** | 750 hrs/month | Sleeps after 15 min inactivity (~50s cold start) |
| **Supabase** | 500 MB DB, 50K rows/table | More than enough for a university project |
| **Brevo** | 300 emails/day | Plenty for normal registration volume |
| **Google Gemini** | 1M tokens/day | Extremely generous free tier |
| **Cloudflare Turnstile** | Unlimited | Always free |

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| Live Site | https://projecthive-bd.vercel.app |
| Admin Panel | https://projecthive-bd.vercel.app/pages/admin/login.html |
| Backend API | https://projecthive-backend.onrender.com/api |
| GitHub Repo | https://github.com/Ti838/Project-Hive |
| Vercel Dashboard | https://vercel.com/aloneboy0022ti-gmailcoms-projects/projecthive |
| Render Dashboard | https://dashboard.render.com/web/srv-d8mhi8rtqb8s73c3n5qg |
| Supabase Dashboard | https://supabase.com/dashboard/project/iekfvgjxkmgduxdvkuxf |
| Brevo Dashboard | https://app.brevo.com |
| Gemini API Keys | https://aistudio.google.com/apikey |
| Cloudflare Turnstile | https://dash.cloudflare.com/turnstile |

---

*ProjectHive © 2026 🐝 — Built for university students*
