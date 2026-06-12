# 🐝 ProjectHive

> A premium full-stack social platform for university students to discover teammates, showcase projects, and collaborate.

![Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20MongoDB-green)
![AI](https://img.shields.io/badge/AI-Google%20Gemini%202.0%20Flash-blue)
![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-orange)

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🔐 **Authentication** | JWT access + refresh tokens, bcrypt password hashing |
| 👤 **Profile** | Photo upload (base64), banner upload, skills, social links, completion % |
| ⚙️ **Settings** | Account, password change, notifications, theme, accent color, privacy |
| 👥 **Find People** | Discover students, send/accept friend requests, filter by skill/availability |
| 🔔 **Notifications** | Real-time updates for team invites, messages, friend requests |
| 🏷️ **Teams** | Create/join teams, join request workflow, team chat |
| 💬 **Messages** | Real-time Socket.IO messaging (DMs + team channels) |
| 🚀 **Showcase** | Submit and browse student projects |
| 🤖 **AI Generator** | Google Gemini 2.0 Flash — generate project ideas by skill/category |
| 🛡️ **Admin Panel** | User management, ban/unban, role change, team deletion |

---

## 🗂️ Project Structure

```
Project-Hive/
├── public/                         # Frontend (served as static files)
│   ├── index.html                  # Landing page
│   ├── assets/
│   │   ├── css/
│   │   │   ├── ph-design.css       # CSS variable design tokens (light/dark)
│   │   │   └── ph-system.css       # Sidebar, topbar, layout system
│   │   ├── js/core/
│   │   │   ├── ph-sidebar.js       # Centralized navigation sidebar
│   │   │   └── ph-toast.js         # Toast notification system
│   │   └── svg/logo.png            # Brand logo
│   └── pages/
│       ├── auth/
│       │   ├── login.html
│       │   ├── register.html
│       │   └── forgot-password.html
│       ├── user/
│       │   ├── dashboard.html      # Main user dashboard
│       │   ├── profile/edit.html   # Profile editor (photo, banner, skills)
│       │   ├── settings.html       # Account/security/appearance settings
│       │   ├── people.html         # Find People + friend requests
│       │   ├── notifications.html  # Notification center
│       │   ├── messages.html       # Real-time messaging
│       │   ├── teams.html          # Browse & join teams
│       │   ├── teams-create.html   # Create a new team
│       │   └── projects/
│       │       ├── showcase.html   # Project showcase gallery
│       │       └── generator.html  # AI project idea generator
│       └── admin/
│           └── dashboard.html      # Admin control panel
│
└── server/                         # Backend (Node.js + Express)
    ├── server.js                   # Entry point + Socket.IO setup
    ├── app.js                      # Express app + route registration
    ├── models/
    │   ├── User.js                 # User schema (avatar, banner, skills, isBanned)
    │   ├── Team.js                 # Team schema
    │   ├── Project.js              # Project schema
    │   ├── Message.js              # Chat message schema
    │   ├── Notification.js         # Notification schema
    │   ├── FriendRequest.js        # Friend request schema
    │   └── JoinRequest.js          # Team join request schema
    ├── routes/
    │   ├── auth.routes.js          # /api/auth/*
    │   ├── users.routes.js         # /api/users/*
    │   ├── teams.routes.js         # /api/teams/*
    │   ├── projects.routes.js      # /api/projects/*
    │   ├── messages.routes.js      # /api/messages/*
    │   ├── notifications.routes.js # /api/notifications/*
    │   ├── friends.routes.js       # /api/friends/*
    │   ├── ai.routes.js            # /api/ai/*
    │   └── admin.routes.js         # /api/admin/* (auth guard)
    ├── controllers/                # Business logic
    ├── middleware/
    │   ├── auth.js                 # JWT verify middleware
    │   └── errorHandler.js
    ├── config/
    │   ├── db.js                   # MongoDB connection (in-memory fallback)
    │   └── gemini.js               # Google Gemini AI setup
    └── services/
        └── socket.service.js       # Socket.IO event handlers
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Set up environment variables
Create `server/.env`:
```env
# Required for AI features
GEMINI_API_KEY=your_key_here   # Free at https://aistudio.google.com/apikey

# Optional — uses in-memory MongoDB if not set
MONGODB_URI=mongodb://localhost:27017/projecthive

# Optional
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret
PORT=5000
NODE_ENV=development
```

### 3. Start the server
```bash
cd server
npm start
```

### 4. Open in browser
```
http://localhost:5000
```

---

## 🔌 API Reference

### Auth  `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login → access + refresh tokens |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Invalidate refresh token |

### Users  `/api/users`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile (name, bio, avatar, banner, skills…) |
| PATCH | `/me/password` | Change password |
| PATCH | `/me/skills` | Update skills array |
| POST | `/me/skills` | Add single skill |
| DELETE | `/me/skills` | Remove skill |
| GET | `/search?q=&limit=` | Search users |
| GET | `/:id` | Get user by ID |

### Friends  `/api/friends`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/request/:userId` | Send friend request |
| POST | `/accept/:requestId` | Accept request |
| POST | `/reject/:requestId` | Reject request |
| GET | `/` | Get my friends list |
| GET | `/requests` | Get pending requests |
| GET | `/dm/:friendId` | Get DM history |

### Teams  `/api/teams`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create team |
| GET | `/` | Browse teams |
| GET | `/:id` | Team details |
| PUT | `/:id` | Update team |
| POST | `/:teamId/join` | Send join request |
| GET | `/:teamId/requests` | List join requests |
| POST | `/:teamId/requests/:id/accept` | Accept join request |
| POST | `/:teamId/requests/:id/reject` | Reject join request |

### Projects  `/api/projects`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Submit project |
| GET | `/` | Browse projects |
| GET | `/:id` | Project details |
| PUT | `/:id` | Update project |
| DELETE | `/:id` | Delete project |
| POST | `/:id/like` | Like project |
| POST | `/:id/save` | Save project |

### Notifications  `/api/notifications`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get notifications |
| PUT | `/:id/read` | Mark single as read |
| PUT | `/read-all` | Mark all as read |
| DELETE | `/:id` | Delete notification |

### AI  `/api/ai`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Chat with Gemini AI |
| POST | `/generate-ideas` | Generate project ideas (auth) |
| POST | `/generate-ideas-public` | Generate ideas (no auth) |

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

## 🎨 Design System

### CSS Variables (`ph-design.css`)
```css
/* Light mode */
--bg, --sf, --sf2    /* Backgrounds */
--bd, --bd2          /* Borders */
--tx, --sub          /* Text */
--ac, --ac-light     /* Accent (purple #6366f1) */
--shadow             /* Card shadow */

/* Dark mode auto-applies when html.dark class is present */
```

### Components
- **ph-sidebar.js** — Centralized nav (all pages share one sidebar definition)
- **ph-toast.js** — `PHToast.success()` / `.error()` / `.info()`
- **`.ph-page`** — Main content area (auto margin-left for sidebar)
- **`.ph-topbar`** — Sticky page header bar

---

## 🧑‍💻 Make Yourself Admin (Dev)

While logged in, open browser console and run:
```javascript
fetch('/api/admin/promote-me', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
}).then(r => r.json()).then(d => { alert(d.message); })
```
Then **logout and log back in** to get the new admin token.

---

## 🔒 Security Notes

- Passwords hashed with **bcrypt** (12 rounds)
- JWT access tokens expire in **15 minutes**, refresh tokens in **7 days**  
- All sensitive routes protected by `authMiddleware`
- Admin routes additionally protected by `requireAdmin` role check
- `promote-me` endpoint disabled in `NODE_ENV=production`

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS (CSS Variables), JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) + in-memory fallback for dev |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Realtime | Socket.IO |
| AI | Google Gemini 2.0 Flash |
| Icons | Google Material Symbols |
| Fonts | Inter (Google Fonts) |

---

*Built with ❤️ — ProjectHive © 2026*
