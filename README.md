# ProjectHive

> A premium full-stack social platform for university students to discover teammates, showcase projects, and collaborate in real-time.

![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)
![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)
![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)
![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socketdotio)
![AI](https://img.shields.io/badge/AI-Google%20Gemini%202.0-4285F4?logo=google)
![Email](https://img.shields.io/badge/Email-Brevo%20SMTP-0092FF)

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| 🌐 **Frontend** | <https://projecthive-bd.vercel.app> |
| ⚙️ **Backend API** | <https://projecthive-backend.onrender.com/api> |
| 🔌 **Socket.IO** | wss://projecthive-backend.onrender.com |
| 🗄️ **Supabase** | <https://supabase.com/dashboard/project/iekfvgjxkmgduxdvkuxf> |
| 📧 **Brevo Dashboard** | <https://app.brevo.com> |
| 🚀 **Render Dashboard** | <https://dashboard.render.com/web/srv-d8mhi8rtqb8s73c3n5qg> |
| 🟣 **Vercel Dashboard** | <https://vercel.com/aloneboy0022ti-gmailcoms-projects/projecthive> |

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🔐 **Auth + Email Verification** | JWT tokens, bcrypt, Brevo email verification |
| 👤 **Profile** | Photo, banner, skills, social links, completion % |
| ⚙️ **Settings** | Account, password, notifications, theme, privacy |
| 👥 **Find People** | Discover students, friend requests, filter by skill |
| 🔔 **Notifications** | Real-time Socket.IO updates |
| 🏷️ **Teams** | Create/join teams, join request workflow, team chat |
| 💬 **Messages** | Real-time DMs + team channels via Socket.IO |
| 🚀 **Showcase** | Submit and browse student projects |
| 🤖 **AI Generator** | Google Gemini 2.0 Flash — generate project ideas |
| 🛡️ **Admin Panel** | User management, ban/unban, role change |
| 🛡️ **CAPTCHA** | Cloudflare Turnstile bot protection on auth pages |

---

## 🗂️ Project Structure

```
Project-Hive/
├── public/                         # Frontend (static — served by Vercel)
│   ├── index.html                  # Landing page
│   ├── assets/
│   │   ├── css/
│   │   │   ├── ph-design.css       # CSS variable design tokens (light/dark)
│   │   │   └── ph-system.css       # Sidebar, topbar, layout system
│   │   ├── js/core/
│   │   │   ├── api.js              # Global API client (auto-detects prod/dev)
│   │   │   ├── layout.js           # Sidebar + theme initialization
│   │   │   ├── ph-sidebar.js       # Centralized navigation sidebar
│   │   │   └── ph-toast.js         # Toast notification system
│   │   └── svg/logo.png            # Brand logo
│   └── pages/
│       ├── auth/
│       │   ├── login.html
│       │   ├── register.html
│       │   ├── verify-email.html   # Email verification landing page
│       │   └── forgot-password.html
│       ├── user/
│       │   ├── dashboard.html
│       │   ├── profile/edit.html
│       │   ├── settings.html
│       │   ├── people.html
│       │   ├── notifications.html
│       │   ├── messages.html       # Real-time Socket.IO chat
│       │   ├── teams.html
│       │   ├── teams-create.html
│       │   └── projects/
│       │       ├── showcase.html
│       │       └── generator.html  # Gemini AI idea generator
│       └── admin/
│           └── dashboard.html
│
├── server/                         # Backend (Node.js + Express — hosted on Render)
│   ├── server.js                   # Entry point + Socket.IO setup
│   ├── app.js                      # Express app + route registration + CORS
│   ├── config/
│   │   ├── supabase.js             # Supabase client (anon + admin)
│   │   └── gemini.js               # Google Gemini AI setup
│   ├── controllers/
│   │   ├── auth.controller.js      # Register, login, verify email, refresh token
│   │   ├── users.controller.js     # Profile CRUD
│   │   ├── teams.controller.js     # Team management
│   │   ├── projects.controller.js  # Project showcase
│   │   ├── messages.controller.js  # Message history
│   │   ├── notifications.controller.js
│   │   ├── friends.controller.js   # Friend requests
│   │   └── admin.controller.js     # Admin operations
│   ├── routes/
│   │   ├── auth.routes.js          # /api/auth/*
│   │   ├── users.routes.js         # /api/users/*
│   │   ├── teams.routes.js         # /api/teams/*
│   │   ├── projects.routes.js      # /api/projects/*
│   │   ├── messages.routes.js      # /api/messages/*
│   │   ├── notifications.routes.js # /api/notifications/*
│   │   ├── friends.routes.js       # /api/friends/*
│   │   ├── ai.routes.js            # /api/ai/*
│   │   └── admin.routes.js         # /api/admin/* (admin guard)
│   ├── middleware/
│   │   ├── auth.js                 # JWT verify middleware
│   │   ├── socketAuth.js           # Socket.IO JWT auth
│   │   ├── turnstile.js            # Cloudflare Turnstile CAPTCHA
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── email.service.js        # Brevo SMTP email (verify, welcome, reset)
│   │   └── socket.service.js       # Socket.IO real-time event handlers
│   ├── database/
│   │   └── schema.sql              # PostgreSQL schema (run in Supabase SQL editor)
│   └── utils/
│       └── jwt.utils.js
│
├── vercel.json                     # Vercel deployment config
├── render.yaml                     # Render Blueprint config
└── .gitignore
```

---

## 🚀 Quick Start (Local Dev)

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Set up environment variables

Create `server/.env` (see full list below):

```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=https://iekfvgjxkmgduxdvkuxf.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=your-secret-here
BREVO_SMTP_LOGIN=...
BREVO_SMTP_KEY=...
BREVO_FROM_EMAIL=timonbiswas33@gmail.com
GEMINI_API_KEY=...
```

### 3. Start the server

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
| POST | `/register` | ❌ | Register — sends verification email |
| POST | `/login` | ❌ | Login (must be email-verified) |
| POST | `/refresh` | ❌ | Refresh access token |
| POST | `/logout` | ✅ | Invalidate refresh token |
| GET | `/verify-email?token=` | ❌ | Verify email address |
| POST | `/resend-verification` | ❌ | Resend verification email |
| POST | `/forgot-password` | ❌ | Send password reset email |
| POST | `/reset-password` | ❌ | Reset password with token |

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
| POST | `/accept/:requestId` | ✅ | Accept request |
| POST | `/reject/:requestId` | ✅ | Reject request |
| GET | `/` | ✅ | My friends list |
| GET | `/requests` | ✅ | Pending requests |
| GET | `/dm/:friendId` | ✅ | DM history |

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
| DELETE | `/:id` | ✅ | Delete project |
| POST | `/:id/like` | ✅ | Like project |

### Messages  `/api/messages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/teams/:teamId` | ✅ | Get team messages |
| POST | `/` | ✅ | Send message (REST fallback) |

### Notifications  `/api/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get notifications |
| PUT | `/:id/read` | ✅ | Mark single as read |
| PUT | `/read-all` | ✅ | Mark all as read |
| DELETE | `/:id` | ✅ | Delete notification |

### AI  `/api/ai`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/generate-ideas` | ✅ | Generate project ideas (Gemini) |
| POST | `/generate-ideas-public` | ❌ | Demo (no auth) |

### Admin  `/api/admin` *(admin role required)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Platform statistics |
| GET | `/users` | List all users |
| PATCH | `/users/:id/ban` | Ban/unban user |
| PATCH | `/users/:id/role` | Change user role |
| DELETE | `/users/:id` | Delete user |
| GET | `/teams` | List all teams |
| DELETE | `/teams/:id` | Delete team |
| POST | `/promote-me` | *(dev only)* Promote self to admin |

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

---

## 🧑‍💻 Make Yourself Admin (Dev)

While logged in, open browser console:

```javascript
fetch('/api/admin/promote-me', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
}).then(r => r.json()).then(d => alert(d.message));
```

Then **logout and log back in**.

---

## 🎨 Design System

### CSS Variables (`ph-design.css`)

```css
--bg, --sf, --sf2    /* Backgrounds */
--bd, --bd2          /* Borders */
--tx, --sub          /* Text */
--ac, --ac-light     /* Accent (indigo #6366f1) */
--shadow             /* Card shadow */
/* Dark mode auto-applies via html.dark class */
```

### JS Components

- **`api.js`** — Global API client with auto token refresh
- **`ph-sidebar.js`** — Centralized nav sidebar
- **`ph-toast.js`** — `PHToast.success()` / `.error()` / `.info()`

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT access tokens expire in **24h**, refresh in **7 days**
- Email must be verified before login
- All sensitive routes protected by `authMiddleware`
- Admin routes protected by `requireAdmin` role check
- **Cloudflare Turnstile** CAPTCHA on register/login
- `promote-me` endpoint disabled in production

---

*Built with ❤️ for university students — ProjectHive © 2026 🐝*
