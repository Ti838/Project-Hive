# PROJECTHIVE: ADMIN UI PATTERN MATRIX

| Component Pattern | Primary Reference | Interaction & Ergonomics | State Handling |
| :--- | :--- | :--- | :--- |
| **Command Palette** | Linear & Raycast | Global Cmd+K modal with fuzzy search across users, teams, settings, and quick actions. | Loading skeleton, zero-result suggestions, keyboard up/down/enter. |
| **Data Tables** | Stripe Dashboard | Multi-column tabular view with sorting, search debounce, status badges, and contextual action menus. | Empty state, loading rows skeleton, error toast. |
| **Detail Drawers** | Stripe & Atlassian | Right slide-over drawer showing detailed user telemetry, strike history, or moderation reports. | Backdrop blur, escape-to-close, tabbed sub-views. |
| **Workstation Gate**| Cloudflare Access / Entra | Viewport & hardware checking blocking mobile touch environments (<1024px) with high-contrast SecOps lock screen. | Live telemetry printout, IP display, return-to-app CTA. |
