# ProjectHive 🐝 — RESTful API Contracts & Specification

> **Base URL:** `https://api.projecthive.app` (Production) / `http://localhost:5000` (Local)  
> **Protocol:** HTTPS / TLS 1.3  
> **Authentication:** Bearer JWT in `Authorization` Header  

---

## 1. Global Response & Error Envelope

All API endpoints return JSON conforming to the standardized ProjectHive envelope:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Human-readable error description",
  "code": "ERROR_CODE_IDENTIFIER",
  "details": []
}
```

| HTTP Status | Semantic Meaning |
| :--- | :--- |
| `200 OK` | Request succeeded |
| `201 Created` | Resource successfully created |
| `400 Bad Request` | Validation failure or malformed payload |
| `401 Unauthorized` | Missing or invalid authentication token |
| `403 Forbidden` | Authenticated, but lacks required role or permission |
| `404 Not Found` | Requested resource does not exist |
| `429 Too Many Requests` | Rate limit threshold exceeded |
| `500 Server Error` | Unhandled backend exception (masked in production) |

---

## 2. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Creates a new student account.
- **Rate Limit:** 10 requests / 15 minutes
- **Request Body:**
  ```json
  {
    "email": "student@university.edu",
    "password": "SecurePassword123!",
    "first_name": "Rahim",
    "last_name": "Chowdhury",
    "university": "BUET",
    "turnstile_token": "optional_captcha_token"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "user": { "id": "uuid", "email": "student@university.edu", "role": "student" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT.
- **Request Body:**
  ```json
  {
    "email": "student@university.edu",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "user": { "id": "uuid", "email": "student@university.edu", "role": "student" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```

---

## 3. Real-Time Media & Calls Endpoints (`/api/calls`)

### `POST /api/calls/token`
Generates an ephemeral LiveKit SFU JWT with room join permissions.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "roomName": "squad_orbit_49",
    "participantName": "Rahim Chowdhury"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "liveKitUrl": "wss://projecthive-atoyao1h.livekit.cloud"
  }
  ```

---

## 4. HiveMind AI Endpoints (`/api/ai`)

### `POST /api/ai/chat`
Invokes the multi-tier AI cascade for capstone brainstorming, task breakdown, or code review.
- **Headers:** `Authorization: Bearer <token>`
- **Rate Limit:** 20 requests / minute
- **Request Body:**
  ```json
  {
    "message": "Break down our smart campus IoT project into a 4-week sprint plan.",
    "context": {
      "team_name": "SmartHive",
      "tags": ["iot", "react", "esp32"]
    }
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "reply": "### 4-Week Sprint Plan for Smart Campus IoT\n\n...",
    "provider": "Groq (Llama-3.3-70b-versatile)"
  }
  ```

---

## 5. Team & Squad Endpoints (`/api/teams`)

### `GET /api/teams`
Lists searchable squads with tag filtering and pagination.
- **Query Params:** `?search=ai&tag=python&page=1&limit=10`
- **Response (200):**
  ```json
  {
    "success": true,
    "teams": [
      {
        "id": "uuid",
        "name": "Neural Pioneers",
        "slug": "neural-pioneers",
        "member_count": 3,
        "max_members": 5,
        "tags": ["ai", "python", "fastapi"]
      }
    ]
  }
  ```

### `POST /api/teams`
Creates a new squad. Current user automatically assigned `leader` role.
- **Request Body:**
  ```json
  {
    "name": "Quantum Solvers",
    "description": "Building algorithms for quantum optimization.",
    "tags": ["quantum", "python", "qiskit"],
    "max_members": 4
  }
  ```

---

## 6. Administrative Endpoints (`/api/admin`)

*All administrative routes require Bearer token with verified database role `admin` or `super_admin`.*

### `GET /api/admin/health`
Returns live system health telemetry, active socket count, and database latency.
- **Response (200):**
  ```json
  {
    "success": true,
    "status": "ready",
    "database": { "ok": true, "latencyMs": 12 },
    "sockets": { "activeConnections": 42 },
    "services": [
      { "name": "Supabase PostgreSQL", "status": "operational" },
      { "name": "LiveKit SFU", "status": "operational" },
      { "name": "Groq AI Gateway", "status": "operational" }
    ]
  }
  ```

### `POST /api/admin/users/:id/action`
Executes moderation actions: `warn`, `suspend`, `ban`, or `unsuspend`.
- **Request Body:**
  ```json
  {
    "action": "warn",
    "reason": "Inappropriate team recruitment post",
    "notify_email": true
  }
  ```

