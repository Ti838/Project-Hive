# ProjectHive — Backend API

Node.js + Express + Socket.IO backend for the ProjectHive student collaboration platform.

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| AI | Google Gemini 2.0 Flash (FREE) |
| Database | Supabase (PostgreSQL) |
| Real-time | Socket.IO 4 |
| Auth | JWT + bcrypt |
| Security | Helmet, CORS, express-rate-limit, Joi |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Create your `.env` file
```bash
cp .env.example .env
```

### 3. Fill in `.env`
```env
NODE_ENV=development
PORT=5000

# Supabase (https://supabase.com — free tier)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI (FREE — https://aistudio.google.com/apikey)
GEMINI_API_KEY=your_gemini_key_here

# JWT
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=24h

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_PROD=https://your-app.vercel.app
```

### 4. Start the server
```bash
npm run dev     # Development (auto-restarts on change)
npm start       # Production
```

Server runs on **http://localhost:5000**

---

## 📁 Project Structure

```
server/
├── config/
│   ├── db.js              # Database connection
│   ├── gemini.js          # Google Gemini AI client
│   └── redis.js           # Redis adapter (optional)
├── controllers/           # Business logic
│   ├── ai.controller.js   # AI idea generator (Gemini)
│   ├── auth.controller.js
│   ├── users.controller.js
│   ├── teams.controller.js
│   ├── projects.controller.js
│   ├── messages.controller.js
│   └── notifications.controller.js
├── middleware/
│   ├── auth.js            # JWT verification
│   ├── socketAuth.js      # Socket.IO auth
│   └── errorHandler.js    # Global error handler
├── models/                # Data schemas
│   ├── User.js
│   ├── Team.js
│   ├── Project.js
│   ├── Message.js
│   ├── JoinRequest.js
│   └── Notification.js
├── routes/                # API routes
├── services/              # Socket.IO service
├── utils/                 # JWT utilities
├── app.js                 # Express app setup
├── server.js              # Entry point
└── .env.example           # Environment template
```

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/register     Register new user
POST /api/auth/login        Login
POST /api/auth/refresh      Refresh token
POST /api/auth/logout       Logout
```

### Users
```
GET  /api/users/me          Get current user
GET  /api/users/:id         Get user profile
PUT  /api/users/me          Update profile
GET  /api/users/search      Search users
```

### Teams
```
POST /api/teams             Create team
GET  /api/teams             List teams
GET  /api/teams/:id         Get team
POST /api/teams/:id/join    Request to join
GET  /api/teams/my-teams    My teams
```

### Projects
```
POST /api/projects          Submit project
GET  /api/projects          List projects
GET  /api/projects/:id      Get project
POST /api/projects/:id/like Like project
```

### AI (Gemini)
```
POST /api/ai/generate-ideas         Generate ideas (auth, 10/hr/user)
POST /api/ai/generate-ideas-public  Generate ideas (public, 5/hr/IP)
```

### Messages
```
GET  /api/messages/teams/:teamId    Get chat history
POST /api/messages                  Save message
```

### Notifications
```
GET  /api/notifications             Get notifications
PUT  /api/notifications/:id/read    Mark as read
PUT  /api/notifications/read-all    Mark all read
```

---

## 🔴 Socket.IO Events

### Client → Server
```javascript
socket.emit('join:room',    roomId);
socket.emit('leave:room');
socket.emit('message:send', { content, roomId });
socket.emit('typing:start', { roomId });
socket.emit('typing:stop',  { roomId });
```

### Server → Client
```javascript
socket.on('user:online',       ({ userId, timestamp }));
socket.on('user:offline',      ({ userId, timestamp }));
socket.on('message:received',  { id, content, sender, roomId, createdAt });
socket.on('user:typing',       { userId });
socket.on('user:stop-typing',  { userId });
socket.on('notification:new',  notification);
```

---

## 🤖 AI — Google Gemini

- **Model**: `gemini-2.0-flash`
- **Free limit**: 1,500 requests/day, 15 req/min
- **Get key**: [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (any Gmail, no credit card)
- **Rate limit**: 10 req/hr per authenticated user, 5 req/hr per IP (public)

---

## 🔐 Security

| Feature | Implementation |
|---|---|
| Auth | JWT (HS256) with bcrypt |
| Headers | Helmet.js |
| CORS | Whitelisted origins only |
| Rate Limiting | express-rate-limit |
| Validation | Joi schemas |
| Password | bcrypt |

---

## 🧪 Test the API

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@uni.edu","password":"Pass123!"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@uni.edu","password":"Pass123!"}'

# Test AI (public, no auth needed)
curl -X POST http://localhost:5000/api/ai/generate-ideas-public \
  -H "Content-Type: application/json" \
  -d '{"domain":"Healthcare AI","skills":"Python, React","teamSize":3,"timelineWeeks":8}'
```

---

## 🌐 Deployment (Render.com)

1. Connect GitHub repo
2. New Web Service → `server/` directory
3. Build: `npm install` | Start: `npm start`
4. Add environment variables from `.env.example`

### Production env vars needed:
```
NODE_ENV=production
PORT=5000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
JWT_SECRET=
FRONTEND_URL_PROD=
```

---

## 🐛 Troubleshooting

**AI not working?**
- Check `GEMINI_API_KEY` is set in `.env`
- Get free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Check server console for `[ProjectHive] ✅ Google Gemini AI initialized`

**Socket.IO not connecting?**
- Check CORS origins in `server.js`
- Verify JWT token in handshake

**Auth errors?**
- Check `JWT_SECRET` is set
- Verify token not expired
