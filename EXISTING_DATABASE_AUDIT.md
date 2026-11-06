# PROJECTHIVE: EXISTING DATABASE AUDIT & SCHEMA TOPOLOGY

**Cluster:** Supabase PostgreSQL Singapore Node  
**Data Strategy:** Zero-destructive forward updates + JSONB extension

---

## 1. Verified Core Tables
1. `users` (id, email, password_hash, first_name, last_name, role, is_verified, is_banned, strikes, avatar, bio, university, department, github, leetcode, scholar, devpost)
2. `user_settings` (user_id, theme, privacy, notifications, ai_preferences)
3. `teams` (id, name, description, category, leader_id, max_members, status, rules)
4. `team_members` (id, team_id, user_id, role, joined_at)
5. `projects` (id, title, description, team_id, owner_id, status, tags, github_url, demo_url, upvotes)
6. `tasks` (id, project_id, title, status, priority, due_date, assigned_to)
7. `messages` (id, conversation_id, sender_id, content, type, reactions, created_at)
8. `conversations` (id, type, target_id, last_message_at)
9. `posts` (id, author_id, content, media_urls, tags, upvotes, poll_data)
10. `comments` (id, post_id, author_id, content, parent_id)
11. `audit_logs` (id, actor_id, action, target_type, target_id, metadata, ip_address, created_at)
12. `reports` (id, reporter_id, target_type, target_id, reason, status, resolution)
13. `system_flags` (id, key, enabled, description, updated_at)

---

## 2. Storage Buckets & Policies
- `avatars`: Public read, authenticated user write/update.
- `attachments`: Authenticated read/write for team and chat attachments.
