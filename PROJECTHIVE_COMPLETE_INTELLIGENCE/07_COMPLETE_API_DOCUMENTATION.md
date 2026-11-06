# 07: COMPLETE REST API & SOCKET.IO SPECIFICATION

> **Document Classification:** Comprehensive API Reference & Endpoint Catalog  
> **Total Discovered REST Endpoints:** 119 API endpoints  
> **Total Discovered Socket.IO Events:** 23 real-time WebSocket events  
> **Extraction Evidence Level:** `[VERIFIED]` Route Files & Controller Definitions  

---

## 1. Authentication & Security Conventions

All authenticated requests require the standard HTTP Bearer token authorization header:
```http
Authorization: Bearer <access_token>
```
Standard JSON response contracts follow this envelope pattern:
- **Success:** `{ "ok": true, ...data }` or `{ "success": true, ...data }`
- **Error:** `{ "ok": false, "error": "Descriptive error message", "status": <HTTP_CODE> }`

---

## 2. Master REST API Endpoint Directory

### 2.1 Authentication & Session Management (`/api/auth`)

| Method | Endpoint Path | Auth Req | Description & Body Payload | Response Structure |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register new student. Body: `{ first_name, last_name, email, password, university }` | `201 Created`: `{ ok: true, user, accessToken, refreshToken }` |
| `POST` | `/api/auth/login` | None | Authenticate student. Body: `{ email, password, deviceMeta? }` | `200 OK`: `{ ok: true, user, accessToken, refreshToken }` |
| `POST` | `/api/auth/refresh` | None | Rotate access token. Body: `{ refreshToken }` | `200 OK`: `{ ok: true, accessToken, refreshToken }` |
| `POST` | `/api/auth/logout` | Bearer | Invalidate session. Body: `{ refreshToken? }` | `200 OK`: `{ ok: true, message: "Logged out" }` |
| `GET` | `/api/auth/me` | Bearer | Fetch authenticated user profile & roles. | `200 OK`: `{ ok: true, user }` |
| `POST` | `/api/auth/forgot-password` | None | Request password reset email. Body: `{ email }` | `200 OK`: `{ ok: true, message: "Reset email dispatched" }` |
| `POST` | `/api/auth/reset-password` | None | Complete password reset. Body: `{ token, password }` | `200 OK`: `{ ok: true, message: "Password updated" }` |
| `GET` | `/api/auth/verify-email` | None | Verify account via token link. Query: `?token=xxx` | `200 OK`: `{ ok: true, message: "Email verified" }` |
| `POST` | `/api/auth/resend-verification` | None | Resend activation link. Body: `{ email }` | `200 OK`: `{ ok: true, message: "Dispatched" }` |
| `GET` | `/api/auth/google` | None | Initiate Google OAuth PKCE flow. | `200 OK`: `{ ok: true, url: "https://accounts.google.com/..." }` |
| `POST` | `/api/auth/google/code` | None | Exchange PKCE authorization code. Body: `{ code }` | `200 OK`: `{ ok: true, user, accessToken, refreshToken }` |
| `POST` | `/api/auth/google/callback` | None | Fallback client-side session bridge. Body: `{ email, googleId, ... }` | `200 OK`: `{ ok: true, user, accessToken, refreshToken }` |

---

### 2.2 User Directory & Settings (`/api/users`)

| Method | Endpoint Path | Auth Req | Description & Body Payload | Response Structure |
|---|---|---|---|---|
| `GET` | `/api/users` | Optional | Paginated student discovery. Query: `?page=1&limit=20&search=...&university=...&major=...&skill=...` | `200 OK`: `{ users: User[], total, page, pages }` |
| `GET` | `/api/users/people` | Optional | Alias for `/api/users`. | `200 OK`: `{ users: User[], total, page, pages }` |
| `GET` | `/api/users/me` | Bearer | Fetch current user’s complete profile, settings, and skills. | `200 OK`: `User` object |
| `PUT` | `/api/users/me` | Bearer | Update profile fields. Body: `{ first_name, last_name, bio, university, department, github_url, linkedin_url, portfolio_url, avatar, banner_image }` | `200 OK`: `{ ok: true, user }` |
| `PATCH` | `/api/users/me` | Bearer | Partial update profile fields. | `200 OK`: `{ ok: true, user }` |
| `GET` | `/api/users/search` | Optional | Quick prefix search across students. Query: `?q=query` | `200 OK`: `{ users: User[] }` |
| `GET` | `/api/users/global-search`| Bearer | Unified search across users, teams, and projects. Query: `?q=query` | `200 OK`: `{ users, teams, projects }` |
| `GET` | `/api/users/recommended` | Bearer | Intelligent student recommendation based on shared university and complementary skills. | `200 OK`: `{ users: Array<User & { reason: string }> }` |
| `GET` | `/api/users/:id` | Optional | Fetch public student profile by UUID. | `200 OK`: `User` object with project/post stats |
| `GET` | `/api/users/:id/friends` | Bearer | Fetch confirmed friends of specified user. | `200 OK`: `{ friends: User[] }` |
| `GET` | `/api/users/:id/followers`| Bearer | Fetch followers of specified user. | `200 OK`: `{ followers: User[] }` |
| `GET` | `/api/users/:id/following`| Bearer | Fetch accounts followed by specified user. | `200 OK`: `{ following: User[] }` |
| `PATCH` | `/api/users/me/settings` | Bearer | Update user preferences. Body: `{ emailNotifications, chatSounds, theme, twoFactorPrompt, directMessageAlerts, mentionPings }` | `200 OK`: `{ message: "Settings updated", settings, user }` |
| `PATCH` | `/api/users/me/skills` | Bearer | Update technical skills array. Body: `{ skills: string[] }` | `200 OK`: `{ ok: true, skills }` |
| `POST` | `/api/users/me/skills` | Bearer | Add single skill. Body: `{ skill: string }` | `200 OK`: `{ ok: true, skills }` |
| `DELETE` | `/api/users/me/skills` | Bearer | Remove single skill. Body: `{ skill: string }` | `200 OK`: `{ ok: true, skills }` |
| `PATCH` | `/api/users/me/password`| Bearer | Change password. Body: `{ currentPassword, newPassword }` | `200 OK`: `{ message: "Password updated successfully" }` |
| `POST` | `/api/users/:userId/skills/:skillId/endorse` | Bearer | Toggle peer skill endorsement. | `200 OK`: `{ endorsed: boolean, endorsements: number }` |
| `POST` | `/api/users/tickets` | Bearer | Create customer support ticket. Body: `{ subject, message, priority? }` | `201 Created`: `{ ok: true, ticket }` |
| `DELETE` | `/api/users/:id` | Bearer | Self-delete account (user can only delete own account). | `200 OK`: `{ message: "Account deleted" }` |

---

### 2.3 Squads & Campus Communities (`/api/teams`)

| Method | Endpoint Path | Auth Req | Description & Body Payload | Response Structure |
|---|---|---|---|---|
| `POST` | `/api/teams` | Bearer | Create new squad or community. Body: `{ name, description, category, max_members, required_skills, is_private, type? }` | `201 Created`: `{ ok: true, team: Team }` |
| `GET` | `/api/teams` | Optional | Browse squads. Query: `?type=team|community&search=...&category=...&page=1&limit=20` | `200 OK`: `Team[]` |
| `GET` | `/api/teams/my-teams` | Bearer | Retrieve teams where authenticated user is leader or member. | `200 OK`: `{ teams: Team[] }` |
| `GET` | `/api/teams/:id` | Optional | Fetch team details, members list, and join request state. | `200 OK`: `Team` with populated `team_members` |
| `PUT` | `/api/teams/:id` | Bearer | Update team metadata (leader only). Body: `{ name, description, required_skills, status, is_open }` | `200 OK`: `{ ok: true, team }` |
| `DELETE` | `/api/teams/:id` | Bearer | Disband and delete squad (leader only). | `200 OK`: `{ message: "Team deleted" }` |
| `POST` | `/api/teams/:id/leave` | Bearer | Leave a squad (members only; leaders must transfer first). | `200 OK`: `{ message: "Left team" }` |
| `POST` | `/api/teams/:id/members` | Bearer | Add member directly (leader only). Body: `{ userId, role? }` | `201 Created`: `{ ok: true, member }` |
| `DELETE` | `/api/teams/:id/members/:memberId` | Bearer | Kick member from squad (leader only). | `200 OK`: `{ ok: true, message: "Member removed" }` |
| `POST` | `/api/teams/:id/transfer-leadership` | Bearer | Transfer ownership to member. Body: `{ newLeaderId }` | `200 OK`: `{ ok: true, message: "Leadership transferred" }` |
| `POST` | `/api/teams/:teamId/join` | Bearer | Submit recruitment application. Body: `{ message?, portfolio_url? }` | `201 Created`: `{ message: "Join request submitted" }` |
| `GET` | `/api/teams/:teamId/requests` | Bearer | View recruitment queue (leader only). | `200 OK`: `{ requests: JoinRequest[] }` |
| `POST` | `/api/teams/:teamId/requests/:requestId/accept` | Bearer | Accept application and add user to squad. | `200 OK`: `{ message: "Accepted" }` |
| `POST` | `/api/teams/:teamId/requests/:requestId/reject` | Bearer | Reject application. | `200 OK`: `{ message: "Rejected" }` |

---

### 2.4 Showcase Projects (`/api/projects`)

| Method | Endpoint Path | Auth Req | Description & Body Payload | Response Structure |
|---|---|---|---|---|
| `POST` | `/api/projects` | Bearer | Submit showcase project. Body: `{ title, description, category, tech_stack, demo_url, repo_url, image_url, team_id? }` | `201 Created`: `{ project: Project }` |
| `GET` | `/api/projects` | Optional | Browse projects. Query: `?category=...&search=...&sortBy=trending|recent` | `200 OK`: `{ projects: Project[], total }` |
| `GET` | `/api/projects/saved` | Bearer | Fetch bookmarked projects. | `200 OK`: `{ projects: Project[] }` |
| `GET` | `/api/projects/:id` | Optional | Fetch detailed project view with creator profile and upvote status. | `200 OK`: `Project` |
| `PUT` | `/api/projects/:id` | Bearer | Update project details (owner only). | `200 OK`: `{ project: Project }` |
| `DELETE` | `/api/projects/:id` | Bearer | Delete project (owner only). | `200 OK`: `{ message: "Project deleted" }` |
| `POST` | `/api/projects/:id/like` | Bearer | Toggle project like. | `200 OK`: `{ liked: boolean, likes_count: number }` |
| `POST` | `/api/projects/:id/upvote`| Bearer | ProductHunt-grade upvote toggle. | `200 OK`: `{ upvoted: boolean, upvotes: number }` |
| `POST` | `/api/projects/:id/save` | Bearer | Toggle project bookmark. | `200 OK`: `{ saved: boolean, message: string }` |

---

### 2.5 Real-Time Chat & Direct Messaging (`/api/messages`)

| Method | Endpoint Path | Auth Req | Description & Body Payload | Response Structure |
|---|---|---|---|---|
| `GET` | `/api/messages/conversations` | Bearer | Fetch active DMs and squad conversation threads with unread counts and pinned status. | `200 OK`: `{ conversations: Conversation[] }` |
| `POST` | `/api/messages/conversations/:roomId/pin` | Bearer | Toggle pinned conversation state. | `200 OK`: `{ ok: true, pinned: boolean, roomId }` |
| `POST` | `/api/messages/read` | Bearer | Mark conversation messages as read. Body: `{ friendId?, roomId? }` | `200 OK`: `{ ok: true }` |
| `POST` | `/api/messages/dm` | Bearer | Send DM via REST (fallback). Body: `{ receiverId, content, reply_to? }` | `201 Created`: `{ message: Message, roomId }` |
| `GET` | `/api/messages/requests` | Bearer | Retrieve incoming message requests from non-friends. | `200 OK`: `{ requests: MessageRequest[] }` |
| `POST` | `/api/messages/requests/:id/accept` | Bearer | Accept message request and enable direct chat. | `200 OK`: `{ message: "Accepted" }` |
| `POST` | `/api/messages/requests/:id/decline`| Bearer | Decline message request. | `200 OK`: `{ message: "Declined" }` |
| `GET` | `/api/messages/team-conversations` | Bearer | List squad chat rooms for current user. | `200 OK`: `{ conversations: Conversation[] }` |
| `GET` | `/api/messages/teams/:teamId` | Bearer | Fetch historical messages for squad room. | `200 OK`: `{ messages: Message[] }` |
| `GET` | `/api/messages/:friendId` | Bearer | Fetch historical DM messages between user and friend. Query: `?limit=50&skip=0` | `200 OK`: `{ messages: Message[], roomId }` |
| `DELETE` | `/api/messages/conversation/:friendId` | Bearer | Clear entire conversation history with friend. | `200 OK`: `{ message: "Conversation deleted" }` |
| `DELETE` | `/api/messages/:id` | Bearer | Delete individual message (sender only). | `200 OK`: `{ message: "Message deleted" }` |
| `PUT` | `/api/messages/:id` | Bearer | Edit message content. Body: `{ content }` | `200 OK`: `{ message: Message }` |
| `POST` | `/api/messages` | Bearer | Persist message via REST. Body: `{ roomId, content, type?, media_url?, voice_url? }` | `201 Created`: `{ message: Message }` |
| `POST` | `/api/messages/:id/react` | Bearer | Toggle emoji reaction on message. Body: `{ emoji }` | `200 OK`: `{ ok: true, action: "added"|"removed" }` |

---

### 2.6 Social Feed, Posts & Polls (`/api/posts` & `/api/feed`)

| Method | Endpoint Path | Auth Req | Description & Body Payload | Response Structure |
|---|---|---|---|---|
| `GET` | `/api/feed` | Optional | Paginated campus social feed. Query: `?page=1&limit=20&sortBy=recent|popular` | `200 OK`: `{ posts: Post[], total, page, limit }` |
| `GET` | `/api/posts` | Optional | Alias for `/api/feed`. | `200 OK`: `{ posts: Post[], total, page, limit }` |
| `GET` | `/api/posts/saved` | Bearer | Fetch bookmarked feed posts. Query: `?page=1&limit=20` | `200 OK`: `{ posts: Post[], total }` |
| `GET` | `/api/utils/scrape-metadata` | Optional | Scrape OpenGraph preview metadata for external links. Query: `?url=...` | `200 OK`: `{ title, description, image }` |
| `POST` | `/api/posts` | Bearer | Create post. Body: `{ content, post_type, media_urls?, code_snippet?, poll_data? }` | `201 Created`: `{ post: Post }` |
| `GET` | `/api/posts/user/:userId` | Optional | Fetch all posts published by specific student. | `200 OK`: `{ posts: Post[] }` |
| `GET` | `/api/posts/:id` | Optional | Fetch single post with reactions and comment count. | `200 OK`: `{ post: Post }` |
| `PATCH` | `/api/posts/:id` | Bearer | Edit post content and code snippet (author only). Body: `{ content, codeSnippet? }` | `200 OK`: `{ post: Post }` |
| `DELETE` | `/api/posts/:id` | Bearer | Delete post (author or admin). | `200 OK`: `{ message: "Post deleted" }` |
| `GET` | `/api/posts/:id/reactions`| Optional | Fetch list of users who reacted to post. | `200 OK`: `{ reactions: PostReaction[], total }` |
| `POST` | `/api/posts/:id/react` | Bearer | Add, switch, or remove emoji reaction. Body: `{ type: ReactionType }` | `200 OK`: `{ action, type, reactionCounts }` |
| `POST` | `/api/posts/:id/poll/vote`| Bearer | Cast vote on poll option. Body: `{ optionId }` | `200 OK`: `{ post: Post, pollData }` |
| `POST` | `/api/posts/:id/save` | Bearer | Toggle post bookmark. | `200 OK`: `{ saved: boolean, message: string }` |
| `GET` | `/api/posts/:id/comments` | Optional | Fetch threaded comments for post. | `200 OK`: `{ comments: PostComment[], total }` |
| `POST` | `/api/posts/:id/comments` | Bearer | Add comment or reply. Body: `{ content, parentCommentId? }` | `201 Created`: `{ comment: PostComment }` |
| `PATCH` | `/api/posts/:id/comments/:cid` | Bearer | Edit comment (author only). Body: `{ content }` | `200 OK`: `{ comment: PostComment }` |
| `DELETE` | `/api/posts/:id/comments/:cid` | Bearer | Delete comment (author or admin). | `200 OK`: `{ message: "Comment deleted" }` |

---

### 2.7 Cascading HiveMind AI Engine (`/api/ai`)

| Method | Endpoint Path | Auth Req | Description & Body Payload | Response Structure |
|---|---|---|---|---|
| `POST` | `/api/ai/execute` | Bearer | Centralized execution for all 11 AI capabilities with in-memory prompt sanitization. Body: `{ capability, prompt?, parameters?, context?, imageBase64?, mimeType? }` | `200 OK`: `{ ok: true, capability, output, provider: "Hive AI", model: "Hive AI", timestamp }` |
| `POST` | `/api/ai/chat` | Bearer | Free-form multimodal Q&A copilot. Body: `{ message, imageBase64?, mimeType?, context?, tier? }` | `200 OK`: `{ ok: true, reply, provider, model, security }` |
| `POST` | `/api/ai/generate-ideas` | Bearer | University capstone idea generator. Body: `{ domain, skills, teamSize, timelineWeeks, constraints }` | `200 OK`: `{ ok: true, ideas: Idea[] }` |
| `POST` | `/api/ai/generate-ideas-public` | None (Rate-limited) | Public hackathon idea generator (15 req/hr per IP). Body: `{ domain, skills?, teamSize?, timelineWeeks? }` | `200 OK`: `{ ok: true, ideas: Idea[] }` |

---

### 2.8 Native WebRTC Calling & LiveKit SFU (`/api/calls`)

| Method | Endpoint Path | Auth Req | Description & Body Payload | Response Structure |
|---|---|---|---|---|
| `POST` | `/api/calls/token` | Bearer | Mint cryptographically signed LiveKit video grant JWT. Body: `{ scope: "direct"\|"team"\|"project", targetId?, roomName?, callType: "audio"\|"video" }` | `200 OK`: `{ success: true, token, roomName, livekitUrl, callType, scope, caller }` |
| `POST` | `/api/calls/end` | Bearer | Terminate active call session and persist duration in database. Body: `{ roomName }` | `200 OK`: `{ success: true }` |
| `GET` | `/api/calls/history` | Bearer | Retrieve student’s historical call log. | `200 OK`: `{ success: true, calls: CallSession[] }` |

---

### 2.9 Developer Workspace & GitHub Integration (`/api/github`)

| Method | Endpoint Path | Auth Req | Description & Body Payload | Response Structure |
|---|---|---|---|---|
| `GET` | `/api/github/status` | Bearer | Check GitHub account connection status. | `200 OK`: `{ connected: boolean, username, profile }` |
| `POST` | `/api/github/connect` | Bearer | Link GitHub account or PAT. Body: `{ username, token? }` | `200 OK`: `{ connected: true, username, profile }` |
| `POST` | `/api/github/disconnect` | Bearer | Disconnect GitHub account. | `200 OK`: `{ message: "Disconnected" }` |
| `GET` | `/api/github/user/:username` | Optional | Fetch public GitHub user profile. | `200 OK`: `GitHubUserProfile` |
| `GET` | `/api/github/repo/:owner/:repo` | Optional | Fetch repository overview, stars, forks, default branch. | `200 OK`: `GitHubRepo` |
| `GET` | `/api/github/repo/:owner/:repo/readme` | Optional | Fetch and decode repository README.md. | `200 OK`: `{ name, path, content: "base64", htmlUrl }` |
| `GET` | `/api/github/repo/:owner/:repo/tree` | Optional | Fetch Git tree hierarchy for code explorer. Query: `?branch=...` | `200 OK`: `{ tree: GitTreeItem[] }` |
| `GET` | `/api/github/repo/:owner/:repo/file` | Optional | Fetch raw file blob content. Query: `?path=...&branch=...` | `200 OK`: `{ name, path, content: "base64", size }` |
| `GET` | `/api/github/repo/:owner/:repo/commits` | Optional | List commit history. Query: `?limit=30&branch=...` | `200 OK`: `GitHubCommit[]` |
| `GET` | `/api/github/repo/:owner/:repo/branches`| Optional | List repository branches. | `200 OK`: `GitHubBranch[]` |
| `GET` | `/api/github/repo/:owner/:repo/issues` | Optional | List repository issues. Query: `?state=all|open|closed&limit=30` | `200 OK`: `GitHubIssue[]` |
| `GET` | `/api/github/repo/:owner/:repo/pulls` | Optional | List pull requests. Query: `?state=all|open|closed&limit=30` | `200 OK`: `GitHubPullRequest[]` |
| `GET` | `/api/github/repo/:owner/:repo/pulls/:pullNumber` | Optional | Fetch pull request details and changed file patches. | `200 OK`: `GitHubPullRequest & { files }` |
| `GET` | `/api/github/repo/:owner/:repo/actions`| Optional | List GitHub Actions CI/CD workflow runs. Query: `?limit=15` | `200 OK`: `GitHubWorkflowRun[]` |
| `GET` | `/api/github/repo/:owner/:repo/releases`| Optional | List software releases and tags. Query: `?limit=10` | `200 OK`: `GitHubRelease[]` |
| `GET` | `/api/github/repo/:owner/:repo/health` | Optional | Compute composite project health score (0–100). | `200 OK`: `ProjectHealthMetrics` |
| `POST` | `/api/github/ai-review` | Bearer | Execute automated AI code review on PR patch. Body: `{ title, description?, patch, filename? }` | `200 OK`: `{ review: string, provider, model, timestamp }` |
| `POST` | `/api/github/webhook` | None (Signed) | Ingest GitHub webhook events (signature verified via HMAC-SHA256). | `200 OK`: `{ received: true }` |

---

### 2.10 Institutional Administration & Governance (`/api/admin`)

*All `/api/admin/*` endpoints strictly require `adminAuthMiddleware` (enforcing `role === 'admin'`).*

| Method | Endpoint Path | Description & Body Payload | Response Structure |
|---|---|---|---|
| `POST` | `/api/admin/auth/login` | Administrative workstation login. Body: `{ email, password }` | `200 OK`: `{ ok: true, accessToken, user }` |
| `GET` | `/api/admin/stats` | Retrieve platform-wide KPIs (users, teams, projects, messages). | `200 OK`: `AdminStats` |
| `GET` | `/api/admin/health` | Subsystem telemetry (database latency, active socket count, memory). | `200 OK`: `AdminHealth` |
| `GET` | `/api/admin/client-telemetry` | Extract unmasked client IP and hardware fingerprint of caller. | `200 OK`: `{ ip, isPrivate, deviceModel, gpu, userAgent }` |
| `GET` | `/api/admin/users` | Paginated user management directory. Query: `?search=...&role=...&status=...&page=1&limit=15` | `200 OK`: `{ users: User[], total, page, limit }` |
| `PATCH` | `/api/admin/users/:id/ban` | Ban or unban user. Body: `{ is_banned: boolean, reason? }` | `200 OK`: `{ message: "User status updated", user }` |
| `PATCH` | `/api/admin/users/:id/role`| Modify user role. Body: `{ role: "student"\|"faculty"\|"admin" }` | `200 OK`: `{ message: "Role updated", user }` |
| `DELETE` | `/api/admin/users/:id` | Permanently delete user and cascade associated records. | `200 OK`: `{ message: "User deleted" }` |
| `GET` | `/api/admin/users/:id/strikes` | Fetch disciplinary history for user. | `200 OK`: `{ strikes: UserStrike[], strikeCount }` |
| `POST` | `/api/admin/users/:id/strikes` | Issue disciplinary strike. Body: `{ reason, severity: "warning"\|"temporary_suspension"\|"permanent_ban" }` | `201 Created`: `{ message: "Strike issued", strike, totalStrikes, isBanned }` |
| `GET` | `/api/admin/reports` | Retrieve content moderation queue. Query: `?status=pending\|resolved\|dismissed&target_type=...` | `200 OK`: `{ reports: ContentReport[], total }` |
| `PATCH` | `/api/admin/reports/:id/resolve` | Resolve or dismiss report. Body: `{ status: "resolved"\|"dismissed", resolution_notes?, action_taken? }` | `200 OK`: `{ message: "Report resolved", report }` |
| `GET` | `/api/admin/posts` | Moderate feed posts. Query: `?search=...&limit=20` | `200 OK`: `{ posts: Post[], total }` |
| `DELETE` | `/api/admin/posts/:id` | Administratively delete infringing post. | `200 OK`: `{ message: "Post deleted" }` |
| `GET` | `/api/admin/teams` | Manage all squads and communities. | `200 OK`: `{ teams: Team[], total }` |
| `DELETE` | `/api/admin/teams/:id` | Disband and delete squad. | `200 OK`: `{ message: "Team deleted" }` |
| `GET` | `/api/admin/projects` | Moderate showcase projects. | `200 OK`: `{ projects: Project[], total }` |
| `DELETE` | `/api/admin/projects/:id`| Delete showcase project. | `200 OK`: `{ message: "Project deleted" }` |
| `PATCH` | `/api/admin/projects/:id/feature` | Toggle featured banner flag on project. Body: `{ is_featured: boolean }` | `200 OK`: `{ message: "Updated", project }` |
| `GET` | `/api/admin/flags` | Ingest platform kill switches and feature flags. | `200 OK`: `{ flags: SystemFlags }` |
| `PATCH` | `/api/admin/flags` | Mutate platform flags. Body: `{ flags: Partial<SystemFlags> }` | `200 OK`: `{ message: "Flags updated", flags }` |
| `GET` | `/api/admin/audit-logs` | Query forensic audit ledger. Query: `?page=1&limit=15&action=...&search=...` | `200 OK`: `{ logs: AdminAuditLog[], total, page, limit }` |
| `GET` | `/api/admin/tickets` | View support ticket queue. Query: `?skip=0&limit=100` | `200 OK`: `{ tickets: SupportTicket[], total }` |
| `PATCH` | `/api/admin/tickets/:id/resolve` | Resolve ticket. Body: `{ status: "resolved" }` | `200 OK`: `{ message: "Resolved", ticket }` |
| `DELETE` | `/api/admin/tickets/:id`| Delete ticket. | `200 OK`: `{ message: "Deleted" }` |
| `POST` | `/api/admin/promote-me` | *DEV ONLY:* Elevate current user to admin (blocked in production). | `200 OK`: `{ message: "You are now admin", role }` |

---

## 3. Real-Time Socket.IO Protocol Specification

### 3.1 Connection Handshake
- **URL:** `wss://projecthive-backend.onrender.com` (or `ws://localhost:5000`)
- **Handshake Payload:** `{ "auth": { "token": "<JWT_ACCESS_TOKEN>" } }`
- **Automatic Binding:** Server associates socket with user and automatically joins personal room `user_<userId>`.

### 3.2 Complete Socket.IO Event Reference

| Event Name | Direction | Payload Structure | Architectural Function |
|---|---|---|---|
| `join:room` | Client -> Server | `{ roomId: string }` | Joins a chat channel (squad room or DM room). Broadcasts `user:online` to room. |
| `leave:room` | Client -> Server | `{}` | Leaves current room. Emits `user:offline` to previous room members. |
| `room:joined` | Server -> Client | `{ roomId: string, onlineUsers: string[] }` | Confirms room entry and returns list of currently online participants. |
| `message:send` | Client -> Server | `{ roomId, content, type?, reply_to?, media_url?, voice_url? }` | Sends chat message. Persists to PostgreSQL `messages` table and broadcasts via dual-dispatch. |
| `message:received` | Server -> Client | `Message` object with sender details | Emitted to room members and directly to recipient's `user_<id>` channel. |
| `message:delivered`| Client <-> Server | `{ messageId: string, roomId?: string, senderId?: string }` | Delivery acknowledgment; transitions message status from `sent` to `delivered`. |
| `message:read` | Client -> Server | `{ roomId, friendId?, messageIds?: string[] }` | Marks messages as read in DB and emits `message:read_receipt` to sender. |
| `message:read_receipt` | Server -> Client | `{ roomId, readBy: string, messageIds: string[], timestamp }` | Signals sender to update checkmark indicators to double cyan read state. |
| `message:react` | Client -> Server | `{ messageId: string, roomId: string, emoji: string }` | Toggles message reaction in DB and broadcasts `message:reaction` event. |
| `message:reaction`| Server -> Client | `{ messageId, roomId, emoji, userId, action: "added"\|"removed" }` | Updates client-side reaction docks. |
| `typing:start` | Client -> Server | `{ roomId: string }` | Emits `user:typing` `{ userId }` to active room peers. |
| `typing:stop` | Client -> Server | `{ roomId: string }` | Emits `user:stop-typing` `{ userId }` to active room peers. |
| `status:update` | Server -> Client | `{ userId: string, status: "online"\|"offline", lastSeen: string }` | Broadcast to all clients when a user connects or disconnects. |
| `user:status_changed` | Server -> Client | `{ userId, status: "available"\|"away"\|"offline", onlineStatus }` | Ambient status update for user hover cards. |
| `call:initiate` | Client -> Server | `{ roomId, targetId, callerName, isWebRTC, isVoiceOnly }` | Signals callee. Verifies friendship server-side and emits `call:incoming` to all callee sockets. |
| `call:incoming` | Server -> Client | `{ roomId, callerName, callerId, isWebRTC, isVoiceOnly }` | Triggers ringing overlay and modal on receiver devices. |
| `call:accept` | Client -> Server | `{ roomId: string, targetId: string }` | Callee accepted; emits `call:accepted` to caller sockets. |
| `call:decline` | Client -> Server | `{ roomId: string, targetId: string }` | Callee rejected; emits `call:declined` to caller sockets. |
| `call:hangup` | Client -> Server | `{ roomId?: string, targetId?: string }` | Terminates call session in DB and notifies peer via `call:hungup`. |
| `call:group` | Client -> Server | `{ roomId: string, teamId: string, callerName: string }` | Broadcasts `call:incoming` to all active members of a squad. |
| `whiteboard:draw`| Client <-> Server | `{ roomId, points, color, strokeWidth, tool }` | Relays vector canvas drawing strokes to peer participants in room. |
| `whiteboard:clear`| Client <-> Server | `{ roomId: string }` | Relays canvas clear command to all participants. |
| `notification:new`| Server -> Client | `Notification` object | Dispatched directly to target `user_<id>` channel on new mentions, friend requests, or team approvals. |

