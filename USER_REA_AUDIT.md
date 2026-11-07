# ProjectHive — User Ecosystem Reverse Engineering Analysis (REA) & Forensic Audit

**Document Version:** 1.0.0  
**Target Environment:** ProjectHive Production Stack (Next.js 16 + Express API + Supabase PostgreSQL)  
**Scope:** User Dashboard (`/(app)/*`), Profiles, Settings, Teams, Projects, Messaging, AI & Realtime  
**Status:** Complete Forensic Audit  

---

## 1. Executive Summary & Inventory

The ProjectHive User Ecosystem provides an end-to-end university collaboration platform encompassing team recruitment, project showcasing, real-time peer messaging, WebRTC study rooms, and HiveMind AI assistance.

### User Feature Inventory & Operational Classification

| Feature | Frontend Route | Backend Handler | Database Entities | Operational Status | Classification |
|---|---|---|---|---|---|
| **User Dashboard Overview** | `/(app)/dashboard` | `projects.controller.js`, `teams.controller.js` | `projects`, `teams`, `notifications` | **Fully Working** (Real project listings, team links, stats) | **A: Fully Working** |
| **Profile Management** | `/(app)/profile`, `/(app)/profile/view` | `users.controller.js:updateProfile` | `users`, `skills`, `user_settings` | **Fully Working** (Bio, major, university, avatar, banner, skills) | **A: Fully Working** |
| **Account & Security Settings** | `/(app)/settings` | `users.controller.js:changePassword` | `users`, `user_settings` | **Partially Working** (Password change works; Active Sessions tab had mock data) | **B: Partially Working** |
| **Active Session Management** | `/(app)/settings` -> Sessions | *Previously None* | `users.refresh_tokens` | **C: UI Only** (Rendered hardcoded mock devices: MacBook Pro, iPhone) | **C: UI Only** |
| **Location & Campus Settings** | `/(app)/settings` -> Privacy | `users.controller.js:updateProfile` | `users.university` | **Partially Working** (University selection works; no Geolocation or privacy toggle) | **B: Partially Working** |
| **Squads & Team Collaboration** | `/(app)/teams`, `/(app)/teams/[id]` | `teams.controller.js` | `teams`, `team_members`, `join_requests` | **Fully Working** (Creation, recruitment, join requests, member management) | **A: Fully Working** |
| **Projects & Showcase** | `/(app)/projects`, `/(app)/showcase` | `projects.controller.js` | `projects`, `project_likes`, `saved_projects` | **Fully Working** (Creation, like/unlike, bookmark, showcase tags) | **A: Fully Working** |
| **Peer & Team Messaging** | `/(app)/messages` | `messages.controller.js`, Socket.IO | `messages`, `conversation_pins` | **Fully Working** (Direct & team chat, read receipts, typing indicators) | **A: Fully Working** |
| **WebRTC Audio/Video Calls** | `calls.routes.js`, LiveKit | `calls.controller.js:createRoom` | `call_sessions` | **Fully Working** (LiveKit Cloud token exchange, room signaling) | **A: Fully Working** |
| **HiveMind AI Assistant** | `/(app)/generator` | `ai.controller.js:generateProject` | Groq / Gemini / OpenRouter API | **Fully Working** (Multi-model fallback cascade, circuit breaker) | **A: Fully Working** |
| **Notification Center** | `/(app)/notifications` | `notifications.controller.js` | `notifications` | **Fully Working** (Realtime Socket.IO alerts, mark as read) | **A: Fully Working** |

---

## 2. Forensic Findings & User Experience Gaps

### 2.1. Mock Active Sessions in Settings
In [`frontend/src/app/(app)/settings/page.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/app/(app)/settings/page.tsx#L70-L95), the `sessions` state was hardcoded with sample hardware:
```typescript
{
  id: 'session_2',
  device: 'MacBook Pro 16" (macOS Sonoma)',
  browser: 'Chrome 128.0',
  ip: '172.56.21.***',
  lastActive: '2 hours ago',
  isCurrent: false,
}
```
This violates production authenticity. Users require a genuine view of their authenticated sessions, the ability to see which devices are signed in, and the security control to revoke individual sessions or "Sign out of all other devices."

### 2.2. Location Intelligence & Campus Peer Discovery
Students currently input `university` as a plain string. There is no automated browser geolocation detection with explicit user consent, no reverse geocoding to resolve campus/city, no privacy controls for whether location is shared with peers, and no location-aware filtering for teams and projects.

### 2.3. Responsive Layout Consistency
The user dashboard contains extensive multi-column layouts that require verified testing across mobile (375px), tablet (768px), laptop (1024px), and desktop (1440px) breakpoints to ensure sticky headers, drawers, and form cards never introduce horizontal overflow.

---

## 3. Reference Product Comparison (Slack, Clerk & Notion)

| Dimension | Reference Pattern | ProjectHive Current State | Target Implementation |
|---|---|---|---|
| **Session Control (Clerk)** | List of authenticated devices, IP-derived location, device icons, "Revoke Session" button. | Hardcoded state in React component. | Structured `user_sessions` table + `GET /api/users/me/sessions` and `DELETE /api/users/me/sessions/:id`. |
| **Location & Privacy (Slack/Discord)**| Clear privacy toggles: "Show location on campus", "Hide location from search". | Implicit `is_public` boolean on profile. | Dedicated Location Privacy Selector: `'private' \| 'campus' \| 'city'`. |
| **Workspace Navigation (Notion)** | Collapsible sidebar, quick search command palette, breadcrumbs. | Fixed responsive sidebar with modern icons. | Preserved brand identity with active tab indicators and sound feedback. |

