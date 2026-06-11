# 🐝 ProjectHive — Phase 1 MVP

> **The Home of Student Innovation**

ProjectHive is an AI-powered university collaboration platform that helps students form high-performance teams, generate innovative project ideas using NVIDIA NIM, and showcase their completed work.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Ti838%2FProject--Hive-181717?logo=github)](https://github.com/Ti838/Project-Hive)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Phase 1 Features

### 🔐 Authentication & Onboarding
- ✅ JWT-based registration and login with university email validation
- ✅ Secure password hashing with bcrypt
- ✅ Token refresh mechanism for persistent sessions
- ✅ Profile setup wizard on first login

### 👤 User Profiles
- ✅ Comprehensive profile with skills, bio, university, and availability
- ✅ Avatar upload with preview
- ✅ Profile completion tracking
- ✅ Skill management (add/remove skills)

### 🤝 Team Building
- ✅ Browse and search for teams
- ✅ Create new teams with requirements
- ✅ Join request workflow
- ✅ Team member management
- ✅ Real-time team status via Socket.IO

### 💬 Real-Time Communication
- ✅ Socket.IO team chat with message persistence
- ✅ Typing indicators and online presence
- ✅ Message history retrieval
- ✅ Real-time notifications

### 🤖 AI Features
- ✅ NVIDIA NIM-powered project idea generator
- ✅ Generate 5 unique ideas based on domain, skills, and timeline
- ✅ Innovation scoring for each idea
- ✅ Save ideas to profile

### 🚀 Project Showcase
- ✅ Browse published student projects
- ✅ Filter by category, university, and tech stack
- ✅ Like and comment on projects
- ✅ Project submission interface

---

## 🏗️ Architecture

```
ProjectHive
├── Frontend        Pure HTML5 + CSS + Vanilla JavaScript  (served via Vercel)
├── Backend         Node.js + Express.js + Socket.IO       (hosted on Render)
└── Database        MongoDB Atlas (M10 cluster)
```

### Frontend
- **Technology**: Pure HTML5 + Vanilla CSS + Vanilla JavaScript
- **State Management**: Observable pattern for reactive updates
- **Auth**: JWT token management with auto-refresh
- **Real-time**: Socket.IO client integration
- **Design**: Glassmorphic dark/light theme, fully responsive

### Backend (`/server`)
- **Technology**: Node.js + Express.js
- **Real-time**: Socket.IO with Redis adapter
- **Authentication**: JWT with HS256 (development) / RS256 (production)
- **Rate Limiting**: `express-rate-limit` (100 req/min global)
- **Security**: Helmet.js, CORS whitelist, input validation with Joi

### Database (MongoDB Atlas)
- **Collections**: `users`, `teams`, `messages`, `projects`, `notifications`
- **ORM**: Mongoose

### AI Integration (NVIDIA NIM)
- **Model**: `meta/llama-3.1-405b-instruct`
- **Endpoint**: `https://integrate.api.nvidia.com/v1/chat/completions`
- **Server-side only** — API keys never exposed to frontend
- **Rate Limit**: 10 requests per user per hour

---

## 📁 Project Structure

```
Project-Hive/
├── public/                         # Frontend static files
│   ├── index.html                  # Landing page
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   └── register.html
│   │   ├── profile/
│   │   │   └── edit.html
│   │   ├── teams/
│   │   │   ├── index.html          # Team finder
│   │   │   ├── create.html
│   │   │   └── [id].html           # Team detail
│   │   ├── projects/
│   │   │   ├── showcase.html
│   │   │   └── generator.html      # AI idea generator
│   │   ├── dashboard.html
│   │   ├── messages.html
│   │   ├── notifications.html
│   │   └── settings.html
│   └── assets/
│       ├── css/
│       │   └── custom.css
│       └── js/
│           └── core/
│               ├── api.js          # Fetch wrapper
│               ├── auth.js         # Auth utilities
│               ├── store.js        # State management
│               └── socket.js       # Socket.IO client
│
├── server/                         # Backend Node.js app
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── .env.example                # ← Copy to .env and fill in values
│   └── package.json
│
├── vercel.json                     # Vercel deployment config
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas connection string)
- **NVIDIA NIM** API key (for AI features)

### 1. Clone the Repository

```bash
git clone https://github.com/Ti838/Project-Hive.git
cd Project-Hive
```

### 2. Set Up the Backend

```bash
cd server
cp .env.example .env        # Fill in your secrets
npm install
npm run dev                 # Starts on http://localhost:5000
```

### 3. Serve the Frontend

From the project root:

```bash
npm install
npm run dev                 # Serves public/ on http://localhost:3000
```

Or use any static server:

```bash
npx serve public -p 3000
```

Then navigate to **http://localhost:3000**

---

## 🔌 API Quick Reference

All frontend API calls go through `assets/js/core/api.js`:

```javascript
// Authentication
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

## 🔐 Security Features

| Layer | Mechanism |
|---|---|
| Authentication | JWT (HS256 dev / RS256 prod) with refresh tokens |
| Password Storage | bcrypt hashing |
| Transport | HTTPS enforced (TLS 1.3) |
| Headers | Helmet.js (CSP, XSS, HSTS, etc.) |
| CORS | Whitelisted origins only |
| Rate Limiting | 100 req/min global, 10 req/min on auth |
| Input Validation | Joi (server-side) + client-side checks |

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

- [ ] OAuth2 social login (Google, GitHub)
- [ ] Advanced search and filtering
- [ ] AI team compatibility scoring
- [ ] File upload for projects (Cloudinary)
- [ ] Email notifications (SendGrid)
- [ ] PWA support for offline viewing
- [ ] Mobile-responsive refinements

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

**Built with ❤️ by [Ti838](https://github.com/Ti838)**

*Making university collaboration effortless, one team at a time.*
