# PROJECTHIVE: FRONTEND COMPONENT INVENTORY

## 1. Adaptive Primitives (`frontend/src/components/ui/`)
- `BottomSheet.tsx`: Accessible touch-first mobile slide-up sheet with backdrop blur.
- `EmptyState.tsx`: Contextual empty state with SVG iconography and primary CTAs.
- `FloatingActionButton.tsx`: Thumb-reachable mobile action trigger.

## 2. Layout & Ergonomics (`frontend/src/components/layout/`)
- `AppShell.tsx`: Responsive root shell with selective internal scroll containment.
- `Sidebar.tsx`: 240px persistent desktop sidebar with icon-only mode (`Cmd+B`).
- `Topbar.tsx`: Command header with `Cmd+K` palette and 3-mode theme switcher.
- `MobileNav.tsx`: 5-tab safe-area bottom navigation bar for viewports <600px.

## 3. Academic & Collaborative Systems (`frontend/src/components/teams/`)
- `TeamClassworkView.tsx`: Google Classroom sprint milestones, rubrics, 1-click turn-in drawer.
- `TeamDocsView.tsx`: Notion-grade collaborative markdown specs and meeting minutes.
- `JoinRequestModal.tsx`: Squad application modal with portfolio pitch.

## 4. Identity & Verification (`frontend/src/components/profile/`)
- `ProfileView.tsx`: Verified badges (GitHub, LeetCode, Scholar, Devpost) and recruitment toggle.

## 5. Media & Conferencing (`frontend/src/components/calling/`)
- `CallManager.tsx`: LiveKit Cloud SFU WebRTC audio/video call room.
- `MinimizedCallWidget.tsx`: Floating Picture-in-Picture (PIP) camera preview.

## 6. Admin Workstation (`frontend/src/components/admin/`)
- `DesktopGate.tsx`: Hardware-checked barrier blocking touch mobile devices (<1024px).
