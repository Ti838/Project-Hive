# PROJECTHIVE: REA MASTER ANALYSIS & REFERENCE BENCHMARK REPORT

**Framework:** Reference-Driven Reverse Engineering Analysis (REA Framework)  
**Mandatory Target References:**
1. **Mobbin** (`mobbin.com`) — Real mobile app screens, navigation flows, and UI component standards.
2. **Linear Mobile** (`linear.app/mobile`) — Dedicated companion app UX, speed-first micro-interactions, and high-density mobile information architecture.
3. **Android Adaptive Layout Guidelines** (`developer.android.com/design`) — Canonical adaptive patterns across compact (phone), medium (tablet/foldable), and expanded (desktop) window size classes.
4. **Workspace Benchmarks:** Linear, Notion, ClickUp, Vercel, Slack, Discord, Google Meet, and Claude/ChatGPT.

---

## 1. Window Size Class & Adaptive Layout Matrix (Android Adaptive Standard)

Following Android's canonical layout guidelines, ProjectHive's layout architecture is partitioned into three distinct window size classes:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ANDROID ADAPTIVE WINDOW SIZE CLASSES                             │
├───────────────────────────────┬────────────────────────────┬───────────────────────────┤
│    COMPACT (< 600px width)    │   MEDIUM (600px - 839px)   │  EXPANDED (>= 840px / 1024px) │
├───────────────────────────────┼────────────────────────────┼───────────────────────────┤
│ • Handsets & Foldable (folded)│ • Tablets & Small Laptops  │ • Desktop & Ultrawide     │
│ • Bottom Navigation Bar (4-5) │ • Adaptive Navigation Rail │ • Full Collapsible Sidebar│
│ • Single-Pane Stack (List OR  │ • 2-Column Split or Rail   │ • Multi-Column Workspace  │
│   Detail with Back Navigation)│ • Bottom Sheets / Modals   │ • Side Panels & Flyouts   │
│ • Floating Action Button (FAB)│ • Extended FAB             │ • Integrated Command Bars │
│ • 100% Full-Screen Views      │ • Adaptive Card Grids      │ • Multi-Pane Dashboard    │
└───────────────────────────────┴────────────────────────────┴───────────────────────────┘
```

---

## 2. Feature-by-Feature REA Benchmark & Design Decisions

### 2.1 Workspace Navigation & App Shell
- **Desktop Reference:** **Linear** (`linear.app`) & **Vercel** (`vercel.com`)
  - *Pattern:* 240px persistent, resizable sidebar with grouped navigation (Core, Collaboration, AI Studio, Account), subtle hover highlights, keyboard shortcut hints (`Cmd+B`), and a minimal command top bar.
- **Mobile Reference:** **Linear Mobile** (`linear.app/mobile`) & **Android NavigationSuiteScaffold**
  - *Pattern:* 5-tab thumb-friendly Bottom Navigation (`Home`, `Feed`, `Chat`, `Teams`, `Profile`). All secondary destinations (`AI Studio`, `Showcase`, `Settings`) are accessible via a slick top-bar avatar trigger or slide-out sheet.
- **Tablet Reference:** **Material 3 Navigation Rail**
  - *Pattern:* Compact 72px icon rail with vertical labels, maximizing horizontal canvas space for multi-column dashboards.

### 2.2 Dashboard Home (`/dashboard`)
- **Desktop Reference:** **ClickUp** (`clickup.com`) & **Linear** (`linear.app`)
  - *Pattern:* 3-column layout:
    - Left & Center: Metric sparklines (Teams, Active Projects, Collaborators, Pending Tasks), Recent Activity stream, and Project Milestones.
    - Right Panel: Contextual HiveMind AI quick prompt box, Pending Squad Invitations, and Upcoming Deadlines.
- **Mobile Reference:** **Mobbin Production Dashboards** (Linear Mobile & GitHub Mobile)
  - *Pattern:* Single-column card stack. Top summary header with quick-switch filter pills (`Overview`, `Squads`, `Tasks`), followed by a horizontal scrollable Quick Actions carousel, and edge-to-edge recent activity items.

### 2.3 Team Discovery & Recruitment (`/teams`)
- **Desktop Reference:** **Wellfound** (`wellfound.com`) & **Devpost** (`devpost.com`)
  - *Pattern:* Persistent left filter sidebar (Skills, Category, Recruitment Status: Open/Closed, University) with a high-density 3-column team card grid showing member avatars, vacancy badges, and one-click "Apply" modals.
- **Mobile Reference:** **Linear Mobile & LinkedIn Mobile**
  - *Pattern:* Top sticky search bar with horizontal scrolling filter chips (`Open Roles`, `Frontend`, `AI/ML`, `Hackathon`). Tapping "Filters" slides up an ergonomic Bottom Sheet with full-screen checkboxes and an instant "Show Results" button.

### 2.4 Team Workspace & Management (`/teams/[id]`)
- **Desktop Reference:** **Discord** (`discord.com`) & **Slack** (`slack.com`)
  - *Pattern:* Team header with member count, recruitment status toggle (for leaders), and tabs: `Workspace Chat`, `Kanban Tasks`, `Whiteboard`, `Live Video Room`, and `Roster`.
- **Mobile Reference:** **Discord Mobile & Slack Mobile**
  - *Pattern:* Tab bar pinned beneath the team banner. LiveKit audio/video button pinned prominently as a Floating Action Bar at the top right. Roster actions (Promote, Remove) open via native bottom action sheets.

### 2.5 Realtime Messaging (`/messages`)
- **Desktop Reference:** **Slack** (`slack.com`) & **Telegram Desktop**
  - *Pattern:* 340px conversation list on the left with unread indicators, presence dots (online/idle/offline), and active channel indicators. Right pane features message thread with inline reactions, typing indicators, image attachments, and code snippet formatting.
- **Mobile Reference:** **Linear Mobile Chat & WhatsApp Mobile**
  - *Pattern:* Master-Detail pattern. On compact screens, users view either the conversation list OR the active conversation. When entering a chat, the bottom navigation bar smoothly hides to give 100% screen real estate to the conversation, with an iOS/Android standard back arrow restoring the list.

### 2.6 HiveMind AI Studio (`/generator`)
- **Desktop Reference:** **Cursor** (`cursor.com`), **Claude** (`claude.ai`), & **v0.app**
  - *Pattern:* 2-pane workbench:
    - Left Pane (400px): Chat conversation, model selector (Groq Tier 1 LPU / Gemini Vision), prompt suggestions, and speech input toggle.
    - Right Pane (Flexible): Generated project blueprint with tabs for `Architecture`, `Tech Stack`, `Database Schema`, and `Sprint Roadmap`.
- **Mobile Reference:** **ChatGPT Mobile & Claude Mobile**
  - *Pattern:* Edge-to-edge chat canvas with bottom floating input bar, voice recording waveform, and an expandable bottom drawer to inspect generated project roadmaps.

### 2.7 Video Meetings (`CallManager.tsx` & `LiveKitCallModal.tsx`)
- **Desktop Reference:** **Google Meet** (`meet.google.com`)
  - *Pattern:* Floating PiP widget when minimized, expandable to an immersive full-screen modal with participant video tiles, screen share preview, whiteboard overlay, and mute/camera controls.
- **Mobile Reference:** **Zoom Mobile & Discord Mobile Calling**
  - *Pattern:* Portrait-optimized active speaker tile with carousel of participant avatars below. One-tap bottom control bar with large thumb targets for Mic, Camera, Speaker, and End Call.

---

## 3. Transferable Interaction Patterns Catalog

| Interaction Pattern | Source Benchmark | ProjectHive Adaptation |
| :--- | :--- | :--- |
| **Thumb-Centric Quick Actions** | Linear Mobile | Floating Action Buttons (FAB) and bottom-sheet creation flows on mobile for fast team creation and project posts. |
| **Multi-Pane Master-Detail** | Android Adaptive Guidelines | Smooth transition between single-pane stack on mobile and persistent side-by-side lists on desktop for messaging and team workspaces. |
| **Bottom Sheet Filters** | Mobbin (Airbnb, Linear) | Bottom sheet sliding up on mobile for skill filters and recruitment modals, avoiding awkward desktop modal centering. |
| **Dual-Theme Surface Hierarchy** | Linear & Vercel | Semantic elevation tokens (`bg-background` $\rightarrow$ `bg-card` $\rightarrow$ `bg-muted` $\rightarrow$ `surface-floating`) with 1px hairline borders for both dark and light modes. |
| **Instant Haptic & Visual Feedback**| Mobbin Mobile Standards | Spring-animated active navigation pill (`motion.div layoutId="mobileTabPill"`), optimistic reaction updates, and clear loading skeletons. |

---

*Phase 1 REA research complete. Proceeding to Phase 2 (Information Architecture & User Journeys).*

