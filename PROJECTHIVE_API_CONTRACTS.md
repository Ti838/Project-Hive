# ProjectHive — API Contracts & Interface Specification

**Document Version:** 1.0.0  
**Phase:** Phase 1 Foundation  
**Execution Lead:** AGENT 9 (Backend Architect) & AGENT 4 (Frontend Architect)  
**Standard:** OpenAPI 3.0-Aligned RESTful Contracts + Socket.IO Event Schema  

---

## 1. Authentication & Session Endpoints (`/api/auth`)

| Endpoint | Method | Auth | Request Body | Success Response (200/201) | Error Codes |
|---|---|:---:|---|---|:---:|
| `/api/auth/register` | `POST` | None | `{ firstName, lastName, email, password, department, semester, skills }` | `{ message, requiresVerification, user }` | 400, 429, 500 |
| `/api/auth/login` | `POST` | None | `{ email, password, rememberMe }` | `{ user, accessToken, refreshToken }` | 400, 401, 403, 429 |
| `/api/auth/verify-email` | `POST` | None | `{ token }` or `{ email, code }` | `{ message: "Email verified successfully." }` | 400, 410 |
| `/api/auth/refresh` | `POST` | Cookie/Body | `{ refreshToken }` | `{ accessToken, user }` | 401, 403 |
| `/api/auth/logout` | `POST` | Bearer | `{}` | `{ message: "Logged out successfully." }` | 200 |
| `/api/auth/forgot-password` | `POST` | None | `{ email }` | `{ message: "Password reset link sent." }` | 400, 429 |
| `/api/auth/reset-password` | `POST` | None | `{ token, newPassword }` | `{ message: "Password updated." }` | 400, 410 |
| `/api/auth/me` | `GET` | Bearer | None | `{ user }` | 401 |

---

## 2. User & Device Intelligence Endpoints (`/api/users`)

| Endpoint | Method | Auth | Description | Payload / Response |
|---|---|:---:|---|---|
| `/api/users/profile` | `PUT` | Bearer | Updates student bio, skills, campus, links. | `Body: { bio, skills, campus, githubUrl }` |
| `/api/users/me/sessions` | `GET` | Bearer | Lists all active hardware login sessions for current user. | `Response: { sessions: [{ id, os, browser, ip, city, isCurrent, lastActiveAt }] }` |
| `/api/users/me/sessions/:id` | `DELETE` | Bearer | Remote kill switch: revokes specific login session. | `Response: { success: true, message: "Session revoked." }` |
| `/api/users/me/sessions/revoke-others` | `POST` | Bearer | Terminates all other active sessions except current. | `Response: { success: true, revokedCount: 2 }` |
| `/api/users/location` | `PUT` | Bearer | Updates student GPS coordinates and location privacy. | `Body: { lat, lng, city, country, privacy: "campus" \| "city" \| "private" }` |

---

## 3. Squad & Teammate Discovery Endpoints (`/api/teams`)

| Endpoint | Method | Auth | Description | Payload / Response |
|---|---|:---:|---|---|
| `/api/teams` | `GET` | Optional | Search squads with category, skill, and campus filters. | `Query: ?search=&category=&skill=&campus=` |
| `/api/teams` | `POST` | Bearer | Create new project squad with role specifications. | `Body: { name, description, category, openRoles, maxMembers }` |
| `/api/teams/:id` | `GET` | Bearer | Retrieve squad details, member roster, and active tabs. | `Response: { team, members, joinRequests }` |
| `/api/teams/:id/join` | `POST` | Bearer | Submit application pitch note to join squad. | `Body: { pitch: "Hey, I know Next.js..." }` |
| `/api/teams/:id/requests/:requestId` | `PUT` | Leader | Accept or decline applicant. | `Body: { action: "accept" \| "reject" }` |
| `/api/teams/:id/members/:userId` | `DELETE` | Leader | Remove member or leave squad. | `Response: { success: true }` |

---

## 4. Project Workspace & Kanban Tasks (`/api/projects`, `/api/tasks`)

| Endpoint | Method | Auth | Description |
|---|---|:---:|---|
| `/api/projects/:id` | `GET` | Bearer | Retrieves project details, team ID, and Markdown wiki text. |
| `/api/projects/:id/wiki` | `PUT` | Bearer | Saves collaborative Markdown wiki documentation. |
| `/api/tasks/:projectId` | `GET` | Bearer | Lists all Kanban tasks partitioned by status (`todo`, `in_progress`, `review`, `done`). |
| `/api/tasks` | `POST` | Bearer | Creates new task card with assignee, priority, and deadline. |
| `/api/tasks/:id/status` | `PUT` | Bearer | Drag-and-drop state update (`status: "done"`). |
| `/api/tasks/:id/assign` | `PUT` | Bearer | Reassigns task to another squad member. |

---

## 5. LiveKit SFU Calling & Real-Time Messaging (`/api/calls`, `/api/messages`)

| Endpoint | Method | Auth | Description |
|---|---|:---:|---|
| `/api/calls/token` | `POST` | Bearer | Generates cryptographically signed LiveKit Access Token (`KeySigner`). |
| `/api/messages/conversations` | `GET` | Bearer | Lists active direct and team chat threads with unread counters. |
| `/api/messages/conversations/:id` | `GET` | Bearer | Fetches paginated message history with delivery statuses. |
| `/api/messages` | `POST` | Bearer | Sends message (text, code snippet, image attachment URL). |

---

## 6. Admin Governance Endpoints (`/api/admin`)

| Endpoint | Method | Auth | Description |
|---|---|:---:|---|
| `/api/admin/stats` | `GET` | Admin | Real-time platform KPI telemetry (Users, Squads, Projects, Health). |
| `/api/admin/users` | `GET` | Admin | Paginated student user directory with status filters. |
| `/api/admin/users/:id/sessions` | `GET` | Admin | Deep inspection: retrieves all active hardware sessions for user. |
| `/api/admin/users/:id/sessions/:sessionId` | `DELETE` | Admin | Force-terminates user session from administrative drawer. |
| `/api/admin/reports` | `GET` | Admin | Review flagged student content, spam, and abuse reports. |
| `/api/admin/reports/:id` | `PUT` | Admin | Action content report (`status: "action_taken" \| "dismissed"`). |
| `/api/admin/support/tickets` | `GET` | Admin | Manage student support tickets with resolution notes. |
| `/api/admin/audit-logs` | `GET` | Admin | Immutable security audit logs with actor IP tracking. |

