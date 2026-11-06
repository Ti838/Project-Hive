# PROJECTHIVE: DESKTOP REFERENCE REVERSE-ENGINEERING ANALYSIS

**References Examined:** Linear Desktop (`linear.app`), Vercel (`vercel.com`), Notion (`notion.com`), Clerk (`clerk.com`), WorkOS (`workos.com`), Raycast (`raycast.com`).

---

## 1. Architectural Philosophy: The "SaaS Workspace Grade"

Modern enterprise engineering platforms prioritize density, keyboard velocity, low cognitive friction, and continuous spatial continuity. 

### Core Desktop Workspace Mechanics:
1. **Persistent Collapsible Left Rail (240px Default):**
   - Resizable between 200px and 380px with zero visual lag using pointer event capture.
   - Smooth collapse to 0px or compact icon rail via global shortcut `Cmd+B` / `Ctrl+B`.
   - Distinct sections: Workspace Brand, Core Navigation (`Dashboard`, `Feed`, `Messages`, `Teams`, `Projects`, `AI Studio`), Secondary Tools (`Saved`, `Notifications`, `Settings`), and User Profile Dock with quick-logout.

2. **Command-Grade Global Topbar:**
   - 56px fixed height with backdrop blur (`backdrop-blur-xl`, `bg-background/80`).
   - Breadcrumb navigation showing current context (e.g., `Teams / Nova AI Squad / Workspace`).
   - Omnipresent Command Palette trigger (`Cmd+K`) for instantaneous jump to any squad, peer, project, or AI capability.
   - Live socket status indicator, notifications badge counter, and quick AI Studio copilot drawer toggle.

3. **Multi-Column Dashboard Layout:**
   - Left / Main Column (7 or 8 cols): Obsidian-themed greeting hero, 4 metric sparkline cards (Active Students, Formed Squads, Showcase Projects, Universities), quick action shortcuts, and live campus highlight feed.
   - Right Column (4 or 5 cols): Active Squads roster with member counts and status badges, upcoming sprint deadlines, and HiveMind AI prompt triggers.

4. **Internal Scroll Containers for Heavy Views (`overflow: hidden` on AppShell):**
   - For `/messages` (Telegram/Slack style) and `/generator` (Claude/Cursor AI Studio style), the global window scrollbar is suppressed. The page hosts its own virtualized message thread and artifact split-pane, eliminating nested double scrollbar collisions.

5. **Split-Pane AI Canvas (Claude Artifacts / Cursor Studio):**
   - Left 50%: Conversational prompt stream, model selector (Groq Turbo, Gemini Flash Pro, OpenRouter Ultra), voice prompt recording with visualizer.
   - Right 50%: Live interactive Artifact viewer (Markdown blueprints, syntax-highlighted code schemas, exportable deliverables).

