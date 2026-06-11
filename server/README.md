# ProjectHive Backend - Phase 1

Complete Node.js/Express API server for ProjectHive student collaboration platform with real-time Socket.IO chat, JWT authentication, and NVIDIA NIM AI integration.

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB Atlas account (free M0 tier or paid M10)
- Redis (optional, for production scaling)
- NVIDIA NIM API key (optional, add later)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/projecthive
   REDIS_URL=redis://localhost:6379  # Optional
   JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
   JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
   NVIDIA_NIM_API_KEY=your_key_here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Generate JWT Keys:**
   ```bash
   # Generate private key
   openssl genrsa 2048 > private.pem
   
   # Generate public key
   openssl rsa -in private.pem -pubout > public.pem
   
   # Copy contents into .env (replace newlines with \n)
   ```

5. **Start server:**
   ```bash
   npm run dev    # Development with --watch
   npm start      # Production
   ```

Server runs on `http://localhost:5000`

## Project Structure

```
server/
├── config/              # Configuration files
│   ├── db.js           # MongoDB connection
│   ├── redis.js        # Redis adapter setup
│   └── nvidia.js       # NVIDIA NIM client
├── middleware/          # Express middleware
│   ├── auth.js         # JWT verification
│   ├── socketAuth.js   # Socket.IO auth
│   ├── errorHandler.js # Global error handler
│   └── validate.js     # Input validation
├── models/             # MongoDB schemas
│   ├── User.js
│   ├── Team.js
│   ├── Project.js
│   ├── Message.js
│   ├── JoinRequest.js
│   └── Notification.js
├── controllers/        # Business logic
│   ├── auth.controller.js
│   ├── users.controller.js
│   ├── teams.controller.js
│   ├── projects.controller.js
│   ├── messages.controller.js
│   ├── notifications.controller.js
│   └── ai.controller.js
├── routes/            # API route handlers
├── services/          # Socket.IO & helper services
├── utils/             # Utility functions
├── app.js            # Express app factory
└── server.js         # Entry point
```

## API Endpoints

### Authentication
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login user
POST /api/auth/refresh      - Refresh token pair
POST /api/auth/logout       - Logout (requires auth)
```

### Users
```
GET  /api/users/me          - Get current user profile
GET  /api/users/:id         - Get user profile
PUT  /api/users/me          - Update profile
GET  /api/users/search      - Search users
POST /api/users/me/skills   - Add skill
PUT  /api/users/me/skills   - Update skills
```

### Teams
```
POST /api/teams                              - Create team
GET  /api/teams                              - List teams
GET  /api/teams/:id                          - Get team details
PUT  /api/teams/:id                          - Update team
POST /api/teams/:id/join                     - Post join request
GET  /api/teams/:id/requests                 - Get join requests
POST /api/teams/:id/requests/:requestId/accept
POST /api/teams/:id/requests/:requestId/reject
```

### Projects
```
POST /api/projects                 - Submit project
GET  /api/projects                 - List projects
GET  /api/projects/:id             - Get project details
PUT  /api/projects/:id             - Update project
DELETE /api/projects/:id           - Delete project
POST /api/projects/:id/like        - Like project
POST /api/projects/:id/save        - Save project
```

### Messages
```
GET /api/messages/teams/:teamId    - Get team chat history
POST /api/messages                 - Save message
```

### Notifications
```
GET  /api/notifications            - Get notifications
PUT  /api/notifications/:id/read   - Mark as read
PUT  /api/notifications/read-all   - Mark all as read
DELETE /api/notifications/:id      - Delete notification
```

### AI
```
POST /api/ai/generate-ideas        - Generate project ideas (rate limited 10/hour)
```

## Socket.IO Events

### Client → Server
```javascript
// Join a chat room
socket.emit('join:room', roomId);

// Leave room
socket.emit('leave:room');

// Send message
socket.emit('message:send', { content: 'Hello', roomId });

// Typing indicators
socket.emit('typing:start', { roomId });
socket.emit('typing:stop', { roomId });
```

### Server → Client
```javascript
// User came online
socket.on('user:online', { userId, timestamp });

// User went offline
socket.on('user:offline', { userId, timestamp });

// New message in room
socket.on('message:received', { id, content, sender, roomId, createdAt });

// User typing
socket.on('user:typing', { userId });
socket.on('user:stop-typing', { userId });

// New notification
socket.on('notification:new', notification);

// Errors
socket.on('error', { message });
```

## Authentication

Uses **RS256 asymmetric JWT** with public/private keys:

1. **Register:** Create account → Receive `accessToken` + `refreshToken`
2. **Login:** Email + password → Receive token pair
3. **Protected Routes:** Include token in `Authorization: Bearer <token>` header
4. **Token Refresh:** Send `refreshToken` → Get new token pair
5. **Token Rotation:** Old refresh tokens are invalidated on refresh

**Token Structure:**
```json
{
  "id": "userId",
  "email": "user@university.edu",
  "type": "access|refresh",
  "iat": 1706000000,
  "exp": 1706900000
}
```

## Database Models

### User
- Email (unique), password hash, name
- Profile: university, major, year, avatar, bio
- Skills: array of {name, level, endorsements}
- Availability: status, hoursPerWeek
- Social: github, linkedin, portfolio URLs
- Stats: teamsCreated, teamsJoined, projectsPosted

### Team
- Creator, members (array with roles)
- Name, description, requiredSkills
- Configuration: maxMembers, status, visibility
- Metrics: viewCount, requestCount
- Socket.IO: chatRoomId (unique)

### Project
- Creator, title, description, techStack
- Status: draft/submitted/approved
- Engagement: likes, saves, comments count

### Message
- Content, sender, roomId, type (text/system)
- readBy: array of user IDs
- TTL index (auto-delete after 30 days)

### JoinRequest
- User, team, status (pending/accepted/rejected)
- Message from applicant

### Notification
- Type: join_request/message/mention/team_update
- References: user, team, message
- Auto-delete after 30 days

## Rate Limiting

- **Global:** 100 requests per 15 minutes (configurable)
- **AI Endpoint:** 10 requests per hour per user

## Error Handling

All errors return standardized JSON:
```json
{
  "error": "Error message",
  "details": [...]  // Validation errors
}
```

HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

## Deployment

### Render.com (Recommended)

1. **Connect GitHub repository**
2. **Create new Web Service**
3. **Configure:**
   - Build: `npm install`
   - Start: `npm start`
   - Environment: Add all `.env` variables
4. **Deploy**

### Environment Variables on Render
```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your_mongodb_uri>
REDIS_URL=<your_redis_url>  # Optional
JWT_PRIVATE_KEY=<key>
JWT_PUBLIC_KEY=<key>
NVIDIA_NIM_API_KEY=<key>
FRONTEND_URL=https://projecthive.vercel.app
FRONTEND_URL_PROD=https://projecthive.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Development

### Testing Endpoints
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@university.edu",
    "password": "Password123",
    "university": "MIT",
    "major": "Computer Science",
    "yearOfStudy": 2
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@university.edu",
    "password": "Password123"
  }'

# Protected route (with token)
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <accessToken>"
```

### Debugging
- Check console logs with `[v0]` prefix
- MongoDB: Use MongoDB Compass to inspect collections
- Socket.IO: Open DevTools console in browser

## Performance Targets

- API responses: < 200ms (p95)
- Socket.IO connection: < 1s
- Message delivery: < 500ms
- 100 concurrent connections supported (with Redis adapter)

## Security

- **CORS:** Whitelist frontend URL
- **HTTPS:** Always use HTTPS in production
- **Helmet:** Security headers enabled
- **Rate Limiting:** Prevent abuse
- **JWT:** RS256 with key rotation
- **Input Validation:** Via Joi schemas
- **Password:** bcrypt with 12 rounds

## Future Enhancements (Phase 2+)

- Email verification
- OAuth/Social login
- Advanced search/filters
- File uploads (Cloudinary)
- Monitoring (Sentry)
- GraphQL API
- WebRTC video chat
- Advanced notifications

## Troubleshooting

**MongoDB Connection Error:**
- Check MONGODB_URI format
- Verify IP whitelist in MongoDB Atlas
- Ensure network connection

**Socket.IO Connection Error:**
- Check CORS origins
- Verify token in handshake
- Check Redis connection

**NVIDIA NIM Error:**
- Verify API key
- Check rate limits
- Test with manual curl request

**JWT Errors:**
- Regenerate private/public keys
- Verify key format (with \n line breaks)
- Check token expiration

## Support

- Check logs: `npm run dev` shows all console output
- MongoDB: Use MongoDB Compass
- Socket.IO: Browser DevTools Console
- API: Use Postman or curl for testing

