# PROJECTHIVE: THEME ARCHITECTURE SPECIFICATION

- **Context Provider:** `frontend/src/context/ThemeContext.tsx`.
- **Modes Supported:** `light`, `dark`, and `system`.
- **OS Real-time Listener:** `window.matchMedia('(prefers-color-scheme: dark)')` automatically updates DOM classes when operating system theme changes.
- **Cloud Sync:** Preference is persisted in `localStorage` and synchronized to PostgreSQL via `api.users.updateSettings`.
