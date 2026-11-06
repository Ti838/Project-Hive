# 08: DATABASE SCHEMA & DATA RELATIONSHIPS

> **Document Classification:** Relational PostgreSQL Schema & Data Dictionary  
> **Database Provider:** Supabase (PostgreSQL 15+)  
> **Total Active Relational Tables:** 32 tables  
> **Total Storage Buckets:** 4 object storage buckets  
> **Extraction Evidence Level:** `[VERIFIED]` Direct SQL Schema Analysis & Metadata Queries  

---

## 1. Database Architecture & Extension Environment

ProjectHive persists all stateful data in a **Supabase PostgreSQL** instance located in Southeast Asia (Singapore region `iekfvgjxkmgduxdvkuxf`). The database utilizes PostgreSQL core extensions for cryptographic operations and universally unique identifiers:
- `pgcrypto` (`[VERIFIED]`: `server/database/supabase_final_production_sync.sql:9`)
- `uuid-ossp` (`[VERIFIED]`: `server/database/supabase_final_production_sync.sql:10`)

---

## 2. Storage Buckets & Access Policies

The Supabase Storage subsystem hosts 4 dedicated buckets verified via live `listBuckets()` query:

| Bucket ID | Bucket Name | Public Visibility | Content Type / Allowed Payloads | Access & Security Rules |
|---|---|---|---|---|
| `avatars` | `avatars` | **Public** | JPEG, PNG, WebP profile pictures (< 500 KB) | Public read. Authenticated students can insert/update only their own folder (`userId/*`). |
| `banners` | `banners` | **Public** | JPEG, PNG wide profile headers (1200x675 px) | Public read. Authenticated students can upload/update only their own banner. |
| `attachments` | `attachments` | **Public** | Chat photos, post media, audio voice clips | Public read. Authenticated users can upload media attachments. |
| `resumes` | `resumes` | **Private** | PDF, DOCX student resumes and portfolios | Private read. Restricted to owner student and squad leaders where applicant applied. |

---

## 3. Relational Table Dictionary (All 32 Tables)

### Table 1: `users` (Core Identity & Academic Profiles)
- **Stores:** Student credentials, institutional details, profile bio, avatar URLs, online status, and login metadata.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Columns & Types:**
  - `email VARCHAR(255) NOT NULL UNIQUE`
  - `first_name VARCHAR(100) NOT NULL`, `last_name VARCHAR(100) NOT NULL`
  - `role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin'))`
  - `university VARCHAR(255) DEFAULT 'General Campus'`, `major VARCHAR(255)`, `department VARCHAR(255)`
  - `student_id VARCHAR(100)`, `year_of_study INTEGER DEFAULT 1`
  - `avatar TEXT`, `avatar_color VARCHAR(20) DEFAULT '#6366F1'`, `banner_image TEXT`, `bio TEXT`
  - `github_url TEXT`, `linkedin_url TEXT`, `portfolio_url TEXT`
  - `is_verified BOOLEAN DEFAULT FALSE`, `is_banned BOOLEAN DEFAULT FALSE`, `is_public BOOLEAN DEFAULT TRUE`
  - `status VARCHAR(50) DEFAULT 'active'`, `online_status VARCHAR(20) DEFAULT 'offline'`, `last_seen TIMESTAMPTZ`
  - `skills JSONB DEFAULT '[]'::jsonb`, `interests TEXT[] DEFAULT '{}'`
  - `refresh_tokens TEXT[] DEFAULT '{}'`
  - `last_login_ip TEXT`, `last_login_country TEXT`, `last_login_city TEXT`, `last_login_device_model TEXT`, `last_login_os TEXT`, `last_login_browser TEXT`, `last_login_at TIMESTAMPTZ`
  - `settings JSONB DEFAULT '{"emailNotifications": true, "chatSounds": true, "theme": "dark", "twoFactorPrompt": false}'::jsonb`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- **Indexes:** `idx_users_email`, `idx_users_role_banned`, `idx_users_university`, `idx_users_major`, `idx_users_last_login_ip`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 2: `system_flags` (Live Infrastructure Kill Switches)
- **Stores:** Dynamic platform-wide feature flags queried on every request and mutated by admins.
- **Primary Key:** `key VARCHAR(100)`
- **Columns & Types:**
  - `value BOOLEAN NOT NULL DEFAULT FALSE`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`
- **Default Seed Records:** `maintenanceMode = false`, `registrationEnabled = true`, `emailVerification = false`, `rateLimitStrict = false`, `allowPublicProjects = true`, `aiReviewEnabled = true`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 3: `system_configuration` (Legacy Configuration Matrix)
- **Stores:** Table-row representation of platform settings (`maintenance_mode`, `registration_enabled`, etc.).
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Status:** `[VERIFIED]` Exists (Superseded by key-value `system_flags`).

---

### Table 4: `admin_audit_logs` (Forensic Immutable Ledger)
- **Stores:** Unalterable audit trail recording every administrative intervention.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `admin_id UUID REFERENCES users(id) ON DELETE SET NULL`
- **Columns:** `admin_email TEXT NOT NULL`, `action TEXT NOT NULL`, `target_type TEXT`, `target_id TEXT`, `details JSONB DEFAULT '{}'`, `ip_address TEXT`, `device_model TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_admin_audit_logs_created_at`, `idx_admin_audit_logs_action`, `idx_admin_audit_logs_admin_id`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 5: `content_reports` (Abuse & Moderation Queue)
- **Stores:** Abuse and safety violation reports filed against posts, comments, users, squads, or projects.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `reporter_id UUID REFERENCES users(id)`, `resolved_by UUID REFERENCES users(id)`
- **Columns:** `target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'team', 'project'))`, `target_id UUID NOT NULL`, `reason VARCHAR(100) NOT NULL`, `details TEXT`, `status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed'))`, `resolution_notes TEXT`, `created_at TIMESTAMPTZ`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 6: `user_strikes` (3-Strike Disciplinary System)
- **Stores:** Formal disciplinary infractions issued against student accounts.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `issued_by UUID REFERENCES users(id)`
- **Columns:** `reason VARCHAR(255) NOT NULL`, `severity VARCHAR(50) DEFAULT 'warning' CHECK (severity IN ('warning', 'temporary_suspension', 'permanent_ban'))`, `report_id UUID REFERENCES content_reports(id)`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 7: `teams` (Squads & Communities)
- **Stores:** Student teams, capstone groups, and campus interest communities.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Columns:** `name VARCHAR(255) NOT NULL`, `description TEXT`, `category VARCHAR(100)`, `status VARCHAR(50) DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'active', 'completed'))`, `type VARCHAR(50) DEFAULT 'team' CHECK (type IN ('team', 'community'))`, `max_members INTEGER DEFAULT 4`, `required_skills TEXT[] DEFAULT '{}'`, `avatar TEXT`, `avatar_color VARCHAR(20) DEFAULT '#6366F1'`, `is_private BOOLEAN DEFAULT FALSE`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_teams_leader_id`, `idx_teams_status`, `idx_teams_type`.
- **Status:** `[VERIFIED]` Core Active (7 records verified).

---

### Table 8: `team_members` (Squad Membership Junction)
- **Stores:** Association between students and squads with explicit role assignments.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE`, `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(team_id, user_id)`
- **Columns:** `role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('leader', 'member', 'moderator'))`, `joined_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active (14 records verified).

---

### Table 9: `join_requests` (Squad Recruitment Applications)
- **Stores:** Recruitment applications submitted by students wishing to join a squad.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE`, `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(team_id, user_id)`
- **Columns:** `message TEXT`, `portfolio_url TEXT`, `status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active (1 record verified).

---

### Table 10: `projects` (Showcase Submissions)
- **Stores:** Capstone projects, prototypes, and open-source submissions.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `team_id UUID REFERENCES teams(id) ON DELETE SET NULL`
- **Columns:** `title VARCHAR(255) NOT NULL`, `description TEXT`, `category VARCHAR(100)`, `tech_stack TEXT[] DEFAULT '{}'`, `demo_url TEXT`, `repo_url TEXT`, `image_url TEXT`, `is_featured BOOLEAN DEFAULT FALSE`, `likes INTEGER DEFAULT 0`, `upvotes INTEGER DEFAULT 0`, `views INTEGER DEFAULT 0`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_projects_creator_id`, `idx_projects_category`, `idx_projects_upvotes`.
- **Status:** `[VERIFIED]` Core Active (4 records verified).

---

### Table 11: `project_likes` (Showcase Like Toggles)
- **Stores:** User likes on showcase projects.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `project_id UUID REFERENCES projects(id) ON DELETE CASCADE`, `user_id UUID REFERENCES users(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(project_id, user_id)`
- **Status:** `[VERIFIED]` Core Active.

---

### Table 12: `saved_projects` (Project Bookmarks)
- **Stores:** Student bookmarks for showcase projects.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `user_id UUID REFERENCES users(id) ON DELETE CASCADE`, `project_id UUID REFERENCES projects(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(user_id, project_id)`
- **Status:** `[VERIFIED]` Core Active.

---

### Table 13: `posts` (Social Feed Updates & Milestones)
- **Stores:** Campus feed posts, milestone announcements, code snippets, and polls.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Columns:** `content TEXT NOT NULL`, `type VARCHAR(50) DEFAULT 'update' CHECK (type IN ('update', 'achievement', 'poll', 'project', 'general', 'project_update', 'looking_for_team'))`, `media_urls TEXT[] DEFAULT '{}'`, `image_url TEXT`, `code_snippet JSONB DEFAULT NULL`, `poll_data JSONB DEFAULT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_posts_author_id`, `idx_posts_created_at`.
- **Status:** `[VERIFIED]` Core Active (9 records verified).

---

### Table 14: `post_reactions` (Feed Post Emoji Reactions)
- **Stores:** Student reactions on feed posts (`like`, `love`, `care`, `haha`, `wow`, `sad`, `angry`, `celebrate`, `insightful`, `fire`, `support`).
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE`, `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(post_id, user_id)`
- **Status:** `[VERIFIED]` Core Active (9 records verified).

---

### Table 15: `post_comments` (Threaded Feed Discussions)
- **Stores:** Discussion comments and nested replies on feed posts.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE`, `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE`
- **Columns:** `content TEXT NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active (5 records verified).

---

### Table 16: `saved_posts` (Post Bookmarks)
- **Stores:** Bookmarked feed posts.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(user_id, post_id)`
- **Status:** `[VERIFIED]` Core Active.

---

### Table 17: `messages` (Chat & Discussion History)
- **Stores:** All DM messages and squad channel messages.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Columns:** `room_id VARCHAR(255) NOT NULL`, `content TEXT NOT NULL`, `type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'voice', 'image', 'system'))`, `media_url TEXT`, `voice_url TEXT`, `voice_duration NUMERIC`, `reply_to UUID REFERENCES messages(id) ON DELETE SET NULL`, `reply_to_content TEXT`, `reply_to_sender TEXT`, `status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'seen'))`, `read_by UUID[] DEFAULT '{}'`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_messages_room_id`, `idx_messages_sender_id`, `idx_messages_created_at`.
- **Status:** `[VERIFIED]` Core Active (96 records verified).

---

### Table 18: `conversation_pins` (Pinned Chat Threads)
- **Stores:** Pinned conversation threads per user.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Columns:** `room_id VARCHAR(255) NOT NULL`, `pinned_at TIMESTAMPTZ DEFAULT NOW()`.
- **Unique Constraint:** `UNIQUE(user_id, room_id)`
- **Status:** `[VERIFIED]` Core Active.

---

### Table 19: `message_reactions` (Message Emoji Reactions)
- **Stores:** Floating emoji reactions attached to individual chat messages.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE`, `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Columns:** `emoji VARCHAR(20) NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Unique Constraint:** `UNIQUE(message_id, user_id, emoji)`
- **Status:** `[VERIFIED]` Core Active.

---

### Table 20: `dm_requests` (Direct Message Requests)
- **Stores:** Message requests initiated by non-friends prior to friendship confirmation.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `sender_id UUID REFERENCES users(id)`, `receiver_id UUID REFERENCES users(id)`
- **Columns:** `content TEXT`, `status VARCHAR(20) DEFAULT 'pending'`, `created_at TIMESTAMPTZ`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 21: `call_sessions` (Native LiveKit Call Records)
- **Stores:** Active and historical LiveKit WebRTC call sessions.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `initiator_id UUID REFERENCES users(id) ON DELETE SET NULL`
- **Columns:** `room_name VARCHAR(255) NOT NULL UNIQUE`, `scope VARCHAR(50) DEFAULT 'direct' CHECK (scope IN ('direct', 'team', 'project'))`, `call_type VARCHAR(20) DEFAULT 'video' CHECK (call_type IN ('audio', 'video'))`, `status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'rejected', 'missed'))`, `started_at TIMESTAMPTZ DEFAULT NOW()`, `ended_at TIMESTAMPTZ`, `duration_seconds INTEGER DEFAULT 0`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_call_sessions_room_name`, `idx_call_sessions_status`.
- **Status:** `[VERIFIED]` Core Active (1 record verified).

---

### Table 22: `call_participants` (Session Attendance Records)
- **Stores:** Individual participant attendance and duration records per call session.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE`, `user_id UUID REFERENCES users(id) ON DELETE CASCADE`
- **Columns:** `joined_at TIMESTAMPTZ DEFAULT NOW()`, `left_at TIMESTAMPTZ`, `duration_seconds INTEGER DEFAULT 0`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 23: `notifications` (User Alerts & System Pings)
- **Stores:** Notifications for friend requests, team approvals, mentions, and reactions.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Columns:** `type VARCHAR(50) NOT NULL`, `title TEXT`, `message TEXT NOT NULL`, `data JSONB DEFAULT '{}'`, `is_read BOOLEAN DEFAULT FALSE`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_notifications_user_id`, `idx_notifications_is_read`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 24: `support_tickets` (Institutional Helpdesk)
- **Stores:** In-app support tickets submitted by students.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `assigned_to UUID REFERENCES users(id)`
- **Columns:** `subject VARCHAR(255) NOT NULL`, `message TEXT NOT NULL`, `priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))`, `status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active (1 record verified).

---

### Table 25: `stories` (24-Hour Ephemeral Updates)
- **Stores:** Ephemeral social media stories that expire after 24 hours.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Columns:** `media_url TEXT NOT NULL`, `media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video'))`, `caption TEXT`, `expires_at TIMESTAMPTZ NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_stories_author_id`, `idx_stories_expires_at`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 26: `story_views` (Story Impression Tracking)
- **Stores:** Impression logs recording which students viewed an ephemeral story.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE`, `viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(story_id, viewer_id)`
- **Columns:** `viewed_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 27: `follows` (One-Way Social Following)
- **Stores:** Unidirectional follow connections between students.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(follower_id, following_id)`
- **Columns:** `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 28: `blocks` (Safety & Harassment Prevention)
- **Stores:** User block rules preventing harassment, DMs, and call signaling.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(blocker_id, blocked_id)`
- **Columns:** `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 29: `friends` (Confirmed Bi-Directional Friendships)
- **Stores:** Confirmed friendships between two students.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(user_id, friend_id)`
- **Columns:** `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 30: `friend_requests` (Pending Friendship Applications)
- **Stores:** Pending friendship invitations.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Unique Constraint:** `UNIQUE(sender_id, receiver_id)`
- **Columns:** `status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active.

---

### Table 31: `skills` (Predefined Skill Taxonomy)
- **Stores:** Normalized master catalog of technical, scientific, and design skills.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Columns:** `name VARCHAR(100) NOT NULL UNIQUE`, `category VARCHAR(100)`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Status:** `[VERIFIED]` Core Active (23 skill records verified).

---

### Table 32: `skill_endorsements` (Peer Skill Validation)
- **Stores:** Peer skill endorsements vouching for a student's technical abilities.
- **Primary Key:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `endorser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `endorsed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- **Columns:** `skill_name VARCHAR(100) NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Unique Constraint:** `UNIQUE(endorser_id, endorsed_id, skill_name)`
- **Status:** `[VERIFIED]` Core Active.

