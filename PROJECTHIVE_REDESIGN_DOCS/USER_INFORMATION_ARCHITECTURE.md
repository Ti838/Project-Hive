# PROJECTHIVE: USER INFORMATION ARCHITECTURE & JOURNEY SPECIFICATION

This document establishes the navigation topology, user flows, and adaptive viewport mappings for **ProjectHive**.

---

## 1. Global Navigation Topology

```
                                  ┌─────────────────────────────┐
                                  │      AUTHENTICATED USER     │
                                  └──────────────┬──────────────┘
                                                 │
                   ┌─────────────────────────────┴────────────────────────────┐
                   │                                                          │
         [DESKTOP & TABLET >= 768px]                                [MOBILE < 768px]
                   │                                                          │
  ┌────────────────┴────────────────┐                        ┌────────────────┴────────────────┐
  │ • Persistent Sidebar / Rail     │                        │ • 5-Tab Native Bottom Nav Bar   │
  │ • Command Topbar & Breadcrumbs  │                        │ • Compact Contextual Topbar     │
  │ • Direct Access to All 12 Views │                        │ • Quick-Access Avatar Flyout    │
  └─────────────────────────────────┘                        └─────────────────────────────────┘
                   │                                                          │
                   ├─ 1. Dashboard (`/dashboard`) ────────────────────────────┼─ Tab 1: Home
                   ├─ 2. Feed (`/feed`) ──────────────────────────────────────┼─ Tab 2: Feed
                   ├─ 3. Messages (`/messages`) ──────────────────────────────┼─ Tab 3: Chat
                   ├─ 4. Teams Hub (`/teams`) ────────────────────────────────┼─ Tab 4: Teams
                   ├─ 5. Profile Studio (`/profile`) ─────────────────────────┼─ Tab 5: Profile
                   │                                                          │
                   │ [SECONDARY DESTINATIONS]                                 │ [ACCESS VIA HEADER / DRAWER]
                   ├─ 6. AI Studio (`/generator`) ────────────────────────────┼─ Header AI Quick Action
                   ├─ 7. Project Showcase (`/showcase`) ──────────────────────┼─ More Sheet / Dashboard Card
                   ├─ 8. Collaborator Directory (`/people`) ──────────────────┼─ Teams Hub Tab / Filter
                   ├─ 9. Saved / Bookmarks (`/saved`) ────────────────────────┼─ Profile Menu Sheet
                   ├─ 10. Notifications Center (`/notifications`) ────────────┼─ Topbar Bell Badge
                   ├─ 11. Account Settings (`/settings`) ─────────────────────┼─ Profile Menu Sheet
                   └─ 12. Active Team Workspace (`/teams/[id]`) ──────────────┴─ Deep Linked Stack View
```

---

## 2. Core User Journey Maps

### Journey 1: Team Formation & Recruitment (Leader Flow)
1. **Discovery:** User accesses `/dashboard` or `/teams` $\rightarrow$ Clicks primary action *"Create Team"*.
2. **Configuration:** Fills out stepped team creation wizard (Team Name, Category, Tags, Max Member Cap, Recruitment Rules).
3. **Vacancy Posting:** Leader defines open positions (e.g., "Frontend Developer - Next.js", "AI Engineer - PyTorch").
4. **Applicant Review:** Candidate applies with message and resume $\rightarrow$ Leader receives realtime notification badge.
5. **Approval:** Leader opens recruitment review sheet $\rightarrow$ Reviews candidate credentials $\rightarrow$ Clicks *"Accept"*.
6. **Workspace Entry:** Candidate is added to `team_members` with status `accepted` $\rightarrow$ Unlocks private channels, whiteboard, and LiveKit audio/video room.

### Journey 2: Mobile Instant Collaboration (Member Flow)
1. **Entry:** Member receives push or in-app notification of a live video sync or unread chat.
2. **Deep Navigation:** Taps notification or bottom `Chat` tab $\rightarrow$ Mobile UI hides bottom navigation, granting 100% full-screen space to conversation.
3. **Live Sync:** Member taps *"Join Live Call"* at the top of the team room $\rightarrow$ LiveKit Cloud SFU connects with adaptive audio/video.
4. **Context Switching:** While talking on LiveKit, member can collapse the meeting into a floating Picture-in-Picture (PiP) widget to inspect tasks or shared whiteboard sketches.

---

## 3. Responsive Navigation Behavioral Specifications

| Viewport Class | Primary Navigation | Secondary Actions | Back Navigation Behavior | Search & Filter UX |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile (`< 600px`)** | Bottom Nav Bar (5 tabs: Home, Feed, Chat, Teams, Profile) | Slide-up Bottom Sheets & Floating Action Buttons | Native top-left back arrow (`router.back()`) on child/detail views | Sticky header search with horizontal filter chips & filter sheet |
| **Tablet (`600px - 1023px`)** | Adaptive Navigation Rail (72px wide icon bar) | Header Dropdowns & Contextual Flyout Drawers | Breadcrumbs + Parent Link | Split-column master-detail filter |
| **Desktop (`>= 1024px`)** | Collapsible Sidebar (240px) with shortcut `Cmd+B` | Command Palette (`Cmd+K`) & Right Context Panel | Full hierarchical breadcrumb path | Persistent filter sidebar + keyword search input |

---

*Phase 2 Information Architecture complete. Proceeding to Phase 3 (Design System & Reusable Components).*

