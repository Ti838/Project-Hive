# PROJECTHIVE: SYSTEM AUDIT & ARCHITECTURAL FOUNDATION REPORT

**Author:** Principal Product Designer, Senior Frontend Architect, QA Specialist  
**Target:** ProjectHive User Application (`frontend/src/app/(app)/*` and backend API endpoints)  
**Execution Phase:** PHASE 0 (Discovery, Baseline Audit & Verification)

---

## 1. Executive Summary & Verification State

ProjectHive's authenticated user application comprises **19 App Router views** under `frontend/src/app/(app)/`, orchestrated by a persistent layout wrapper (`AppShell.tsx`).

The platform's underlying services were empirically verified:
- **Frontend Core:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript, Tailwind CSS v4.
- **Backend API:** Express 4.18.2 running 119 active REST endpoints across 14 controllers.
- **Realtime Layer:** Socket.IO 4.7.2 with room-level multiplexing for chat, whiteboards, and presence.
- **Conferencing:** LiveKit Cloud SFU (`project-hive-o0q9p17e.livekit.cloud`) supporting dynacast, simulcast, and low-latency audio/video tracks.
- **Relational Storage:** Supabase PostgreSQL Singapore (`iekfvgjxkmgduxdvkuxf.supabase.co`) with 32 production tables and 4 storage buckets.

---

## 2. Complete User Route Inventory

| Route Path | File Location | Purpose & Core Capabilities | Primary Desktop Pattern | Mobile Adaptation Pattern |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | `(app)/dashboard/page.tsx` | Metric summaries, active squads, pending applications, quick actions, AI entry | 3-column responsive grid with stat sparklines & activity stream | Compact scrollable cards, prominent quick-action carousel, collapsible metrics |
| `/feed` | `(app)/feed/page.tsx` | Social developer activity, community announcements, project updates | Wide central timeline with sticky right-hand trending widget | Single-column edge-to-edge feed, floating creation trigger (FAB) |
| `/friends` | `(app)/friends/page.tsx` | Peer connections, friend requests, mutual collaborator network | Multi-column grid of user hover cards with relationship status | List-item cards with swipe-to-message and touch buttons |
| `/generator` | `(app)/generator/page.tsx` | HiveMind AI Studio, architecture generation, project blueprints | Split workspace: Prompt panel left, interactive multi-tab blueprint right | Full-screen chat interface with bottom-sheet preview toggle |
| `/messages` | `(app)/messages/page.tsx` | Direct messages & team group channels, typing indicators, reactions | 2-column layout: Conversation sidebar (340px) + active chat canvas | Full-screen conversation view with dedicated back-arrow, hiding bottom nav |
| `/notifications` | `(app)/notifications/page.tsx`| Team invites, recruitment status, task assignments, chat mentions | Categorized list with filter tabs (All, Teams, Invites, Alerts) | Native-style list items with swipe-to-dismiss and tap-to-navigate |
| `/people` | `(app)/people/page.tsx` | University student directory, skill matching, peer search | Filter sidebar + infinite scroll collaborator card mosaic | Top search bar with sticky filter chips, compact user summary cards |
| `/profile` | `(app)/profile/page.tsx` | Personal profile studio, skills editor, portfolio links, avatar/banner | Wide banner header with tabbed views (Overview, Skills, Projects, Friends) | Native profile view, sticky tab bar, bottom-sheet edit modals |
| `/profile/[id]` | `(app)/profile/[id]/page.tsx` | Public student profile inspection, endorsement triggers, direct message | Full-width header with social graph actions (Add Friend, Invite to Squad) | Touch-optimized action bar pinned at bottom with message shortcut |
| `/projects` | `(app)/projects/page.tsx` | Active team projects, milestone tracking, development workspace entry | Card grid with progress bars, tech stack tags, and repository badges | Vertical project card stack with swipeable milestone indicator |
| `/projects/[id]/development` | `(app)/projects/[id]/...` | Detailed development workspace: Kanban tasks, code snippets, whiteboard | Multi-pane workspace with draggable columns and side panels | Horizontal snap-scroll Kanban board or tabbed view (Tasks / Board / Code) |
| `/saved` | `(app)/saved/page.tsx` | Bookmarked teams, saved showcase builds, pinned discussions | Grid view with quick unbookmark action and category filters | Single-column list with quick-swipe actions |
| `/settings` | `(app)/settings/page.tsx` | Account security, theme preferences (light/dark/system), password change | 2-column settings navigation with contextual preference panels | Grouped list items (iOS/Android settings style) drilling into detail sheets |
| `/showcase` | `(app)/showcase/page.tsx` | Public project gallery, demo links, GitHub embeds, upvote counters | Masonry/mosaic grid with interactive video/image hover previews | 1-column project cards with double-tap upvote and clean tag pills |
| `/teams` | `(app)/teams/page.tsx` | Squad discovery hub, vacancy tags, skill requirements, recruitment filter | Filter sidebar left + responsive team card grid with recruitment badges | Filter bottom-sheet trigger, prominent recruitment vacancy badges |
| `/teams/create` | `(app)/teams/create/page.tsx` | Multi-step team formation wizard (Name, description, tags, max size) | Centered progressive card wizard with live team card preview | Mobile-optimized stepped form with fixed bottom "Next/Create" button |
| `/teams/[id]` | `(app)/teams/[id]/page.tsx` | Complete team workspace: Roster, applications, channels, tasks, call | Contextual team layout: Member drawer, active channels, LiveKit trigger | Tabbed workspace (Chat, Roster, Whiteboard, Meeting) with prominent Call button |

---

## 3. Existing Integration Map

1. **Supabase PostgreSQL & Storage:**
   - 32 tables storing users, teams, recruitment posts, applications, tasks, messages, reactions, read receipts, whiteboard snapshots, and audit logs.
   - 4 Storage buckets: `avatars`, `banners`, `attachments`, and `resumes` (private).
2. **Realtime Socket.IO:**
   - Connected via `frontend/src/hooks/useSocket.ts` on port 5000 / Render domain.
   - Dual-dispatch: immediate broadcast for connected clients + persistent database writes.
3. **LiveKit Cloud SFU:**
   - Managed via `frontend/src/components/calling/CallManager.tsx` and `LiveKitCallModal.tsx`.
   - Audio/video room token minting handled by `/api/media/token`.
4. **HiveMind AI Engine:**
   - Cascading 4-tier pool: Groq Cloud LPU $\rightarrow$ Google Gemini 2.0 Flash $\rightarrow$ OpenRouter $\rightarrow$ Web Speech API.
   - Built-in Zero-Leak Prompt Sanitizer stripping API keys, SSNs, credit cards, and emails before LLM dispatch.

---

## 4. Current Defect & Usability Gap Analysis

| Subsystem | Observed Defect / Limitation | Architectural Solution |
| :--- | :--- | :--- |
| **Mobile Navigation** | Desktop sidebar previously collapsed into an awkward drawer, while the bottom nav overlapped content on notched devices. | Implement Android Adaptive guidelines: Persistent desktop sidebar on $\ge 1024\text{px}$; Navigation rail on tablet ($768\text{px} - 1023\text{px}$); Native-grade bottom navigation bar with safe-area padding on $< 768\text{px}$. |
| **Touch Targets** | Some table actions, reaction emojis, and icon buttons were under 36px, causing missed taps on mobile. | Standardize all mobile interactive elements to a minimum of $44\text{px} \times 44\text{px}$ touch targets. |
| **Double Scrollbars** | In `/messages` and `/generator`, nested internal scroll containers clashed with the outer viewport scrollbar. | Explicitly enforce `overflow: hidden` on layout shells for internal scroll routes (`hasInternalScroll`) while maintaining `scroll-smooth touch-auto` on standard views. |
| **Bottom Sheet Absence** | Modals on mobile rendered as small centered desktop dialogs, awkward for thumb reach. | Implement native-feel Bottom Sheets (sliding from bottom with swipe-to-dismiss gesture) for mobile views on filters, recruitment forms, and task editors. |
| **Density & Hierarchy** | Desktop screens $> 1440\text{px}$ had excessive whitespace in some views, while mobile screens $< 390\text{px}$ suffered from text clipping. | Create adaptive content density: High-density multi-column workspace on desktop; Clean, prioritized single-column hierarchy on mobile. |

---

*Phase 0 is complete. Baseline integrity verified. Proceeding directly to Phase 1.*

