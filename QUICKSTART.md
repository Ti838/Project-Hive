# ProjectHive — Quick Start Guide 🐝

## 🚀 Start in 3 Steps

**Step 1 — Install backend dependencies**
```bash
cd server
npm install
```

**Step 2 — Configure environment variables**

Create `server/.env` (copy from `.env.example`):
```env
NODE_ENV=development
PORT=5000

SUPABASE_URL=https://iekfvgjxkmgduxdvkuxf.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

JWT_SECRET=your-jwt-secret

BREVO_SMTP_LOGIN=your_smtp_login
BREVO_SMTP_KEY=your_smtp_key
BREVO_FROM_EMAIL=noreply@yourdomain.com

GEMINI_API_KEY=your_gemini_key_from_https://aistudio.google.com/apikey

ADMIN_EMAIL=admin@projecthive.com
ADMIN_PASSWORD=YourSecureAdminPassword

FRONTEND_URL=http://localhost:5000
```
> **Minimum required:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

**Step 3 — Run the server**
```bash
npm run dev
```
Open: **http://localhost:5000**

---

## 👑 Admin Panel

The admin panel has its **own dedicated login** — separate from the regular user login.

1. Go to: `http://localhost:5000/pages/admin/login.html`
2. Enter your `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`
3. You are redirected to the industrial admin dashboard

### What admin can do:
| Section | Actions |
|---------|---------|
| **Users** | View all, search, ban/unban, change role, delete |
| **Teams** | View all, filter by status, delete |
| **Projects** | View all, feature/unfeature, delete |
| **Analytics** | Charts for user roles & team status |
| **System** | Toggle maintenance mode, enable/disable registration |
| **Health** | Live backend API & database status check |

---

## 📄 All Pages

| URL | Page |
|-----|------|
| `/` | Landing page |
| `/pages/auth/login.html` | User login |
| `/pages/auth/register.html` | User registration |
| `/pages/auth/verify-email.html` | Email verification |
| `/pages/auth/forgot-password.html` | Forgot password |
| `/pages/auth/reset-password.html` | Reset password |
| `/pages/auth/callback.html` | OAuth callback |
| `/pages/user/dashboard.html` | Student dashboard |
| `/pages/user/feed.html` | Social feed |
| `/pages/user/profile/view.html` | View profile |
| `/pages/user/profile/edit.html` | Edit profile |
| `/pages/user/settings.html` | Account settings |
| `/pages/user/people.html` | Find people |
| `/pages/user/notifications.html` | Notifications |
| `/pages/user/messages.html` | Real-time chat |
| `/pages/user/saved.html` | Saved posts & projects |
| `/pages/user/teams.html` | Browse teams |
| `/pages/user/teams-create.html` | Create team |
| `/pages/user/projects/showcase.html` | Project showcase |
| `/pages/user/projects/generator.html` | AI project generator |
| `/pages/admin/login.html` | Admin login portal |
| `/pages/admin/dashboard.html` | Admin control center |
| `/pages/info/about.html` | About ProjectHive |
| `/pages/info/help.html` | Help & FAQ |
| `/pages/info/privacy.html` | Privacy policy |
| `/pages/info/terms.html` | Terms of service |

---

## 🎨 Theme

Click the 🌙 toggle in the sidebar to switch Dark / Light mode. Preference is saved to `localStorage`.

To change accent colour → **Settings → Appearance → Accent Color**

The admin panel has its own independent dark/light toggle.

---

## 🔌 Key API Endpoints (Quick Reference)

```bash
# Auth
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh

# Users
GET  /api/users/me
PUT  /api/users/me

# Teams
GET  /api/teams
POST /api/teams

# Projects
GET  /api/projects
POST /api/projects

# AI
POST /api/ai/generate-ideas

# Admin (requires admin JWT)
POST /api/admin/auth/login
GET  /api/admin/stats
GET  /api/admin/flags
PATCH /api/admin/flags
```

---

## 🗄️ Database

All tables are in **Supabase PostgreSQL**. Run the schema once:

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/iekfvgjxkmgduxdvkuxf/editor)
2. Copy & paste contents of `server/database/schema.sql`
3. Click **Run**

---

## 📦 Deploy to Production

```bash
git add .
git commit -m "your message"
git push origin main
# Vercel auto-deploys frontend (~30s)
# Render auto-deploys backend (~2 min)
```

Live URL: **https://projecthive-bd.vercel.app**

---

*ProjectHive © 2026 🐝*
