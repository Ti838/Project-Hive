# ProjectHive — Backend Server

## Quick Start

```bash
npm install
npm start        # Production
npm run dev      # Development (nodemon)
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | No | — | Google Gemini AI key (free at aistudio.google.com) |
| `MONGODB_URI` | No | in-memory | MongoDB connection string |
| `JWT_SECRET` | No | auto-generated | JWT signing secret |
| `JWT_REFRESH_SECRET` | No | auto-generated | Refresh token secret |
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | Environment |

## Architecture

```
server/
├── server.js          # HTTP + Socket.IO bootstrap
├── app.js             # Express app, middleware, route registration
├── models/            # Mongoose schemas
│   ├── User.js        # avatar, bannerImage, isBanned, completionPercentage
│   ├── Team.js
│   ├── Project.js
│   ├── Message.js
│   ├── Notification.js
│   ├── FriendRequest.js
│   └── JoinRequest.js
├── routes/            # Express routers (53 endpoints total)
├── controllers/       # Business logic
├── middleware/
│   ├── auth.js        # authMiddleware, optionalAuthMiddleware
│   └── errorHandler.js
├── config/
│   ├── db.js          # MongoDB + in-memory fallback
│   └── gemini.js      # Gemini AI initialization
└── services/
    └── socket.service.js  # Real-time Socket.IO events
```

## Key User Model Fields

```js
{
  firstName, lastName, email, passwordHash,
  avatar,       // base64 data URL or external URL
  bannerImage,  // base64 data URL or external URL  
  avatarColor,  // CSS hex fallback color
  bio, university, major, yearOfStudy,
  skills: [{ name, level, endorsements }],
  github, linkedin, portfolio,
  status,       // 'available' | 'busy' | 'not-looking'
  role,         // 'student' | 'admin' | 'user'
  isBanned,     // boolean
  isPublic,     // boolean
  completionPercentage,  // 0-100, auto-calculated
  friends: [ObjectId],
  onlineStatus  // 'online' | 'offline'
}
```

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `register` | Client→Server | Register user socket on login |
| `join_room` | Client→Server | Join team chat room |
| `send_message` | Client→Server | Send message to room |
| `new_message` | Server→Client | Broadcast message to room |
| `typing` | Client→Server | Typing indicator |
| `user_typing` | Server→Client | Broadcast typing state |
| `disconnect` | Auto | Set user offline |

## Database Notes

- **Development**: Uses `mongodb-memory-server` — no MongoDB installation needed
- **Production**: Set `MONGODB_URI` to your MongoDB Atlas or self-hosted connection string
- Data is **not persisted** between restarts in dev mode (in-memory)
