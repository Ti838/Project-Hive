# 24: FEATURE DEPENDENCY & SUBSYSTEM INTERACTION MAP

> **Document Classification:** Cross-Functional Dependency Graph & Subsystem Tracing  
> **Extraction Evidence Level:** `[VERIFIED]` End-to-End Code Trace  

---

## 1. Master Cross-Subsystem Traceability Matrix

The following matrix traces every major feature from user interface components down to persistent database tables and external third-party cloud services:

| Feature Domain | Primary UI Components | Frontend API Methods | Express Routes & Controllers | Persistent Database Tables | External Cloud Dependencies |
|---|---|---|---|---|---|
| **Authentication & Profile** | `LoginPage.tsx`<br>`RegisterPage.tsx`<br>`ProfilePage.tsx` | `api.auth.login`<br>`api.auth.register`<br>`api.users.me` | `/api/auth/login`<br>`/api/auth/register`<br>`auth.controller.js` | `users` | Supabase PostgreSQL<br>Brevo SMTP<br>Cloudflare Turnstile |
| **People Discovery & Endorsements** | `PeoplePage.tsx`<br>`UserProfileHoverCard.tsx`<br>`UserAvatar.tsx` | `api.users.getPeople`<br>`api.users.endorseSkill`<br>`api.friends.sendRequest` | `/api/users/people`<br>`/api/users/:id/skills/:id/endorse`<br>`users.controller.js` | `users`<br>`skills`<br>`skill_endorsements`<br>`friend_requests` | Supabase Storage (`avatars`) |
| **Squad Formation & Recruitment** | `TeamsHubPage.tsx`<br>`CreateTeamPage.tsx`<br>`JoinRequestModal.tsx` | `api.teams.getAll`<br>`api.teams.create`<br>`api.teams.postJoinRequest` | `/api/teams`<br>`/api/teams/:id/join`<br>`teams.controller.js` | `teams`<br>`team_members`<br>`join_requests`<br>`notifications` | Supabase PostgreSQL |
| **Squad Workspace & Management** | `TeamWorkspacePage.tsx`<br>`JoinRequestsDrawer.tsx` | `api.teams.getById`<br>`api.teams.kickMember`<br>`api.teams.transferLeadership`| `/api/teams/:id`<br>`/api/teams/:id/members/:mid`<br>`teams.controller.js` | `teams`<br>`team_members`<br>`messages` | Supabase PostgreSQL |
| **Unified Messaging Studio** | `MessagesPage.tsx`<br>`VoiceMessagePlayer.tsx` | `api.messages.getRoom`<br>`api.messages.getDMs`<br>`api.messages.react` | `/api/messages/conversations`<br>`/api/messages/:id`<br>`messages.controller.js` | `messages`<br>`conversation_pins`<br>`message_reactions`<br>`friends` | Socket.IO Server<br>Supabase Storage (`attachments`) |
| **LiveKit SFU Video Calling** | `CallManager.tsx`<br>`ActiveCallOverlay.tsx`<br>`MinimizedCallWidget.tsx` | `api.calls.getToken`<br>`api.calls.end`<br>`useLiveKitRoom()` | `/api/calls/token`<br>`/api/calls/end`<br>`calls.controller.js` | `call_sessions`<br>`call_participants` | LiveKit Cloud SFU<br>Metered.ca STUN/TURN |
| **In-Call Whiteboard** | `InCallWhiteboard.tsx` | Handled via Socket hook (`socket.emit('whiteboard:draw')`) | Realtime Socket Hub (`socket.service.js`) | Ephemeral (In-Memory Canvas Sync) | Socket.IO Engine |
| **Showcase & Upvoting** | `ProjectsPage.tsx`<br>`SubmitProjectModal.tsx` | `api.projects.list`<br>`api.projects.create`<br>`api.projects.upvote` | `/api/projects`<br>`/api/projects/:id/upvote`<br>`projects.controller.js` | `projects`<br>`project_likes`<br>`saved_projects` | Supabase PostgreSQL |
| **GitHub Dev Workspace** | `ProjectDevelopmentPage.tsx`<br>`ReadmeViewer.tsx`<br>`CodeViewer.tsx` | `api.github.getRepoOverview`<br>`api.github.getRepoTree`<br>`api.github.performAiReview` | `/api/github/repo/*`<br>`/api/github/ai-review`<br>`github.controller.js` | `projects`<br>`users` (reads `github_token`) | GitHub REST API v3<br>Groq / Gemini AI |
| **HiveMind AI Studio** | `HiveAIWorkspace.tsx`<br>`HiveAICopilotDrawer.tsx`<br>`HiveAIComposer.tsx` | `api.ai.execute`<br>`api.ai.chat`<br>`voiceEngine.startListening` | `/api/ai/execute`<br>`/api/ai/chat`<br>`ai.controller.js` | None (Stateless inference) | Groq Cloud<br>Google AI Studio<br>OpenRouter<br>Web Speech API |
| **Campus Social Feed** | `PostComposerModal.tsx`<br>`PostCard.tsx`<br>`ReactionDock.tsx` | `api.posts.list`<br>`api.posts.create`<br>`api.posts.react` | `/api/posts`<br>`/api/posts/:id/react`<br>`posts.controller.js` | `posts`<br>`post_reactions`<br>`post_comments`<br>`saved_posts` | Supabase Storage (`attachments`) |
| **Institutional Governance** | `AdminOverviewPage.tsx`<br>`AdminUsersPage.tsx`<br>`AdminSystemPage.tsx` | `api.admin.getStats`<br>`api.admin.banUser`<br>`api.admin.updateFlags` | `/api/admin/*`<br>`admin.controller.js`<br>`adminAuthMiddleware` | `system_flags`<br>`admin_audit_logs`<br>`content_reports`<br>`user_strikes` | Supabase PostgreSQL |

---

## 2. Upstream & Downstream Subsystem Dependencies

```mermaid
graph TD
    subgraph Core_Identity ["Core Identity"]
        UsersDB[("users Table")]
        AuthService["Auth Controller & KeySigner"]
    end

    subgraph Relational_Modules ["Dependent Modules"]
        TeamsModule["Teams & Recruitment"]
        ProjectsModule["Projects & Showcase"]
        MessagesModule["Messaging & Sockets"]
        CallsModule["LiveKit SFU Calling"]
        PostsModule["Feed, Comments & Reactions"]
        AdminModule["Admin Governance & Audit"]
    end

    subgraph RealTime_AI ["Real-Time & Intelligence"]
        SocketEngine["Socket.IO Hub"]
        AIEngine["Cascading AI Engine"]
        LiveKitSFU["LiveKit Cloud SFU"]
    end

    UsersDB --> AuthService
    AuthService --> TeamsModule
    AuthService --> ProjectsModule
    AuthService --> MessagesModule
    AuthService --> CallsModule
    AuthService --> PostsModule
    AuthService --> AdminModule

    MessagesModule <--> SocketEngine
    CallsModule <--> SocketEngine
    CallsModule <--> LiveKitSFU
    ProjectsModule --> AIEngine
    TeamsModule --> CallsModule
    AdminModule --> UsersDB
    AdminModule --> TeamsModule
    AdminModule --> ProjectsModule
```

