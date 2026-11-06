# PROJECTHIVE: ADMIN FEATURE INVENTORY

| Feature | Route / Endpoint | Backend Controller | Status |
| :--- | :--- | :--- | :--- |
| **System Overview & Stats** | /admin/dashboard | getStats, getAdminHealth | VERIFIED |
| **User Directory & Ban** | /admin/users | getUsers, banUser, changeRole | VERIFIED |
| **Disciplinary Strikes** | /admin/users | getUserStrikes, issueStrike | VERIFIED |
| **Moderation Queue** | /admin/moderation | getModerationQueue, resolveReport | VERIFIED |
| **Squads Management** | /admin/teams | getTeams, deleteTeam | VERIFIED |
| **Platform Flags & Toggles**| /admin/system | getSystemFlags, updateFlags | VERIFIED |
| **Immutable Audit Logs** | /admin/audit | getAuditLogs | VERIFIED |
| **Hardware Workstation Gate**| Global DesktopGate | Client-side pointer & viewport check | VERIFIED |
