# PROJECTHIVE: MOBILE REFERENCE REVERSE-ENGINEERING ANALYSIS

**References Examined:** Linear Mobile (`linear.app/mobile`), Android Adaptive Layout Guidelines (`developer.android.com/design`), Mobbin UI Patterns (`mobbin.com`), Telegram Mobile, X / Twitter iOS/Android.

---

## 1. Architectural Philosophy: The "Dedicated Mobile App"

A mobile web application must never feel like a squeezed desktop website. It must strictly mimic native iOS/Android applications with thumb-ergonomic target zones, native gestures, and bottom-oriented interaction.

### 1. The 5-Tab Safe-Area Bottom Navigation Bar
- **Tab Layout:**
  1. `Home` (`/dashboard`): Dashboard metrics, quick squad shortcuts, and recent highlights.
  2. `Feed` (`/feed`): Full-bleed campus activity stream, media mosaic, floating reaction dock.
  3. `Chat` (`/messages`): Unified messaging with unread badge pulse and instant conversation cards.
  4. `Teams` (`/teams`): Campus squad finder with sticky filter chips and bottom-sheet filters.
  5. `Profile` (`/profile`): User identity, skills endorsement badges, and portfolio links.
- **Ergonomics & Height:**
  - Placed at the bottom edge with `pb-[max(0.75rem,env(safe-area-inset-bottom,16px))]`.
  - Content containers enforce `pb-[calc(4.5rem+env(safe-area-inset-bottom,16px))]` to ensure the bottommost element is completely scrollable above the navigation bar.
  - Active tab indicated by spring-animated background pill (`layoutId="mobileTabPill"`).

### 2. Touch Targets & Ergonomic Sizing
- All interactive elements (buttons, filter chips, avatar icons, menu items) enforce a minimum touch target of `44px × 44px` (or `48px × 48px` for primary actions) adhering to WCAG 2.5.5 and Android Accessibility Standards.
- Active feedback: Every button and card utilizes `tap-press` micro-scaling (`active:scale-[0.98] transition-transform duration-100`).

### 3. Bottom Sheets Instead of Center-Screen Modals
- On viewports `< 640px`, center modals cause keyboard overlap and awkward thumb reach.
- ProjectHive employs `BottomSheet.tsx`:
  - Slidable sheet pinned to the bottom viewport edge.
  - Tactile grab handle indicator (`w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4`).
  - Max height capped at `85vh` with internal scrolling.
  - Seamless exit on backdrop click or downward drag.

### 4. Edge-to-Edge Single-Column Flow
- Multi-column desktop grids collapse cleanly into high-density single-column vertical cards.
- Horizontal scrolling is strictly forbidden on the document root (`overflow-x: hidden`).
- Horizontal carousels are applied only to discrete tag filters (e.g., Squad Categories, Project Tech Stack) with `-mx-4 px-4` touch bleed and scroll snap.

### 5. Floating Action Buttons (FAB)
- Primary creation actions (`+ Create Squad` on `/teams`, `+ Post Update` on `/feed`) are pinned to the bottom right above the navigation bar (`bottom-[calc(5rem+env(safe-area-inset-bottom,16px))] right-4`).

