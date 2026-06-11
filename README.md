<p align="center">
  <img src="public/assets/svg/logo.svg" alt="ProjectHive Bee Logo" width="90" height="90" />
</p>

<h1 align="center">🐝 ProjectHive</h1>
<p align="center"><strong>The Home of Student Innovation</strong></p>

<p align="center">
  <a href="https://github.com/Ti838/Project-Hive"><img src="https://img.shields.io/badge/GitHub-Ti838%2FProject--Hive-181717?logo=github" alt="GitHub"></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase" alt="Supabase"></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel" alt="Vercel"></a>
  <a href="https://socket.io"><img src="https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io" alt="Socket.IO"></a>
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License">
</p>

---

ProjectHive is an AI-powered university collaboration platform. Students can form high-performance teams, generate innovative project ideas using NVIDIA NIM AI, and showcase their completed work — all in one place.

---

## 📋 Phase 1 Features

### 🔐 Authentication & Onboarding
- ✅ JWT-based registration and login with university email validation
- ✅ Secure password hashing with bcrypt
- ✅ Token refresh mechanism for persistent sessions
- ✅ Profile setup wizard on first login

### 👤 User Profiles
- ✅ Comprehensive profile — skills, bio, university, availability
- ✅ Avatar upload with preview
- ✅ Profile completion tracking
- ✅ Skill management (add/remove skills)

### 🤝 Team Building
- ✅ Browse and search for teams
- ✅ Create new teams with skill requirements
- ✅ Join request workflow
- ✅ Team member management
- ✅ Real-time team status via Socket.IO

### 💬 Real-Time Communication
- ✅ Socket.IO team chat with message persistence
- ✅ Typing indicators and online presence
- ✅ Message history retrieval
- ✅ Real-time notifications

### 🤖 AI Features (NVIDIA NIM)
- ✅ Generate 5 unique project ideas from domain, skills & timeline
- ✅ Innovation scoring for each idea
- ✅ Save ideas to your profile

### 🚀 Project Showcase
- ✅ Browse published student projects
- ✅ Filter by category, university, and tech stack
- ✅ Like and comment on projects
- ✅ Project submission interface

---

## 🏗️ Architecture

```
ProjectHive
├── Frontend        HTML5 + Tailwind CSS CDN + Vanilla JS  →  Vercel
├── Backend         Node.js + Express.js + Socket.IO       →  Render (or local)
└── Database        Supabase (PostgreSQL)                  →  Supabase Cloud
```

### Frontend (Vercel)
- Pure HTML5 + Tailwind CSS (CDN) + Vanilla JavaScript
- Multi-page application (MPA) with observable state pattern
- JWT token management with auto-refresh
- Socket.IO client integration
- Glassmorphic dark/light theme, fully responsive

### Backend (`/server`)
- **Runtime**: Node.js + Express.js
- **Real-time**: Socket.IO
- **Auth**: JWT with bcrypt
- **Security**: Helmet.js, CORS whitelist, `express-rate-limit`, Joi validation

### Database (Supabase)
- **Provider**: [Supabase](https://supabase.com) — managed PostgreSQL
- **Tables**: `users`, `teams`, `messages`, `projects`, `notifications`, `join_requests`
- **Auth**: Supabase Auth (optional — can be used alongside JWT)
- **Storage**: Supabase Storage for avatars and project assets

### AI Integration (NVIDIA NIM)
- **Model**: `meta/llama-3.1-405b-instruct`
- **Endpoint**: `https://integrate.api.nvidia.com/v1/chat/completions`
- **Server-side only** — API key never exposed to frontend
- **Rate Limit**: 10 requests per user per hour

---

## 📁 Project Structure

```
Project-Hive/
├── public/                         # Frontend (deployed to Vercel)
│   ├── index.html                  # Landing page
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   └── register.html
│   │   ├── profile/edit.html
│   │   ├── teams/
│   │   │   ├── index.html          # Team finder
│   │   │   └── create.html
│   │   ├── projects/
│   │   │   ├── showcase.html
│   │   │   └── generator.html      # AI idea generator
│   │   ├── dashboard.html
│   │   ├── messages.html
│   │   ├── notifications.html
│   │   └── settings.html
│   └── assets/
│       ├── css/custom.css
│       ├── svg/logo.svg            # 🐝 Bee logo
│       └── js/core/
│           ├── api.js
│           ├── auth.js
│           ├── store.js
│           └── socket.js
│
├── server/                         # Backend API
│   ├── server.js
│   ├── app.js
│   ├── config/
│   │   ├── db.js                   # Supabase connection
│   │   └── nvidia.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── .env.example                # ← Copy to .env and fill values
│   └── package.json
│
├── vercel.json                     # Vercel routing config
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **Supabase** project (free tier works fine)
- **NVIDIA NIM** API key (for AI features)

### 1. Clone the Repository

```bash
git clone https://github.com/Ti838/Project-Hive.git
cd Project-Hive
```

### 2. Configure the Backend

```bash
cd server
cp .env.example .env
```

Fill in your `.env`:

```env
NODE_ENV=development
PORT=5000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# NVIDIA NIM
NVIDIA_NIM_API_KEY=your-nvidia-key

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_PROD=https://your-app.vercel.app
```

```bash
npm install
npm run dev       # Starts on http://localhost:5000
```

### 3. Serve the Frontend

From the project root:

```bash
npm install
npm run dev       # Serves public/ on http://localhost:3000
```

Navigate to **http://localhost:3000**

### 4. Deploy to Vercel

```bash
vercel deploy
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) for automatic deployments on every push.

---

## 🔌 API Quick Reference

```javascript
// Auth
API.auth.register(userData)
API.auth.login(email, password)
API.auth.logout()

// Users
API.users.getCurrentUser()
API.users.getProfile(userId)
API.users.updateProfile(userId, data)
API.users.searchUsers(query)

// Teams
API.teams.createTeam(data)
API.teams.listTeams(filters)
API.teams.getTeam(teamId)
API.teams.joinTeam(teamId)

// AI
API.ai.generateProjectIdeas(domain, skills, teamSize, timeline, constraints)

// Messages
API.messages.getTeamMessages(teamId, limit, offset)
API.messages.sendMessage(teamId, content)

// Projects
API.projects.listProjects(filters)
API.projects.createProject(data)
API.projects.getProject(projectId)
```

---

## 🔐 Security

| Layer | Mechanism |
|---|---|
| Authentication | JWT (HS256) with bcrypt password hashing |
| Database | Supabase Row-Level Security (RLS) policies |
| Transport | HTTPS / TLS enforced |
| Headers | Helmet.js (CSP, XSS, HSTS) |
| CORS | Whitelisted origins only |
| Rate Limiting | 100 req/min global, 10 req/min on auth endpoints |
| Validation | Joi (server-side) + client-side checks |

---

## 📊 Performance Targets

| Metric | Target |
|---|---|
| API Response (p95) | < 200ms |
| Socket.IO Latency | < 100ms LAN / < 300ms global |
| First Contentful Paint | < 1.2s on 4G |
| NVIDIA NIM API | Async streaming |

---

## 🧪 Test Accounts

```
demo1@stanford.edu  /  Demo123!
demo2@berkeley.edu  /  Demo123!
```

---

## 🔄 Phase 2 Roadmap

- [ ] OAuth2 social login (Google, GitHub) via Supabase Auth
- [ ] Advanced search and filtering
- [ ] AI team compatibility scoring
- [ ] File upload for projects (Supabase Storage)
- [ ] Email notifications (Supabase Edge Functions)
- [ ] PWA support for offline viewing

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📝 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <img src="public/assets/svg/logo.svg" width="32" height="32" />
  <br/>
  <strong>Built with ❤️ by <a href="https://github.com/Ti838">Ti838</a></strong>
  <br/>
  <em>Making university collaboration effortless, one team at a time.</em>
</p>
