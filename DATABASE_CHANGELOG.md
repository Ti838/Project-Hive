# PROJECTHIVE: DATABASE CHANGELOG & MIGRATION LEDGER

**Schema Management:** Supabase PostgreSQL Singapore Node
**Persistence Strategy:** Zero-destructive forward-only migrations + JSONB schema extension.

## 1. Initial Production Tables
- Core user authentication: `users`, `user_settings`, `active_sessions`.
- Team collaboration: `teams`, `team_members`, `join_requests`.
- Project incubation: `projects`, `tasks`, `milestones`.
- Realtime communication: `messages`, `conversations`, `call_logs`.
- Social engagement: `posts`, `comments`, `reactions`, `saved_posts`.

## 2. Academic Mesh & Collaborative Docs Extension
- Enhanced `teams.rules` JSON column to store structured academic data:
  - `courseCode` (e.g. "CSE470: Software Engineering Capstone")
  - `instructor`
  - `sprintMilestones` (milestone ID, title, due date, status, deliverables)
  - `rubrics` (criteria, points, description)
  - `submissions` (student deliverables, GitHub repo, Google Drive URL, timestamp)
  - `wikiDoc` (Markdown architecture documentation, meeting minutes)
- Zero mock data; updates are applied using atomic `UPDATE teams SET rules = $1 WHERE id = $2`.
