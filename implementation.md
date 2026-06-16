ProjectHive — Feed Feature: Handoff Plan for Next Session
✅ Already Done (THIS session)
Database (Supabase — DONE)
posts table ✅
post_reactions table ✅
post_comments table ✅
RLS policies ✅
Backend (DONE, pushed to GitHub)
server/controllers/posts.controller.js ✅
getFeed, createPost, deletePost
reactToPost (toggle/switch)
getComments, addComment, deleteComment
server/routes/posts.routes.js ✅
GET /api/feed
POST /api/posts
DELETE /api/posts/:id
POST /api/posts/:id/react
GET/POST /api/posts/:id/comments
DELETE /api/posts/:id/comments/:cid
server/controllers/admin.controller.js ✅ (getAdminPosts, deleteAdminPost added)
server/routes/admin.routes.js ✅ (GET/DELETE /api/admin/posts added)
server/app.js ✅ (postsRoutes registered)
⬜ TODO — Next Session (build in this order)
Phase 3 — feed.html (MOST IMPORTANT — start here)
File: public/pages/user/feed.html

Layout: 3-column desktop, 1-column mobile

Left: existing ph-sidebar.js sidebar
Center: Post creator card + feed posts list
Right: People You Know + Your Stats panel
Post Creator Card:

Avatar + "What's on your mind?" textarea
4 post type buttons: General, Achievement, Project Update, Looking for Team
Submit button
Post Card (for each post in feed):

Author avatar (color-coded initials, no hardcoded)
Author name, university, time ago, online dot
Post content text
Post type badge (achievement/project_update/looking_for_team shown as badge)
Reaction summary: 👍13 🎉5 💡3
Action row: [Like▾] [Comment] buttons
Reaction picker: hover on Like button → shows 4 SVG icon options (like, celebrate, insightful, support) — NO EMOJI, use inline SVG
Comment section: expandable, shows comments list + add comment input
API_BASE: use same pattern as other pages:

js
const API_BASE = ['localhost','127.0.0.1'].includes(location.hostname)
  ? '' : 'https://projecthive-backend.onrender.com';
Sidebar init: PHSidebar.init('feed', '../../')

Phase 4 — Sidebar + Bottom Nav update
File: public/assets/js/core/ph-sidebar.js

Add 'feed' to NAV_ITEMS array (after dashboard):

js
{ key: 'feed', label: 'Feed', href: 'pages/user/feed.html', icon: `<feed-svg>` }
Update buildBottomNav() — change 'dashboard' home item to 'feed':

js
{ key: 'feed', href: base + 'pages/user/feed.html', label: 'Home', icon: `...` }
Phase 5 — Activity Status (real-time online/offline)
Files: server/server.js (or socket service), all user pages

On socket connect: update users.online_status = 'online' in Supabase
On socket disconnect: update online_status = 'offline', last_seen = now()
Frontend: people.html — show green/grey dot based on real online_status field
Feed: show online dot on post author avatar
Messages: show online dot in conversation list
Sidebar: show own status as real online
Phase 6 — Messages Upgrade
File: public/pages/user/messages.html

Add:

Unread badge count in sidebar + conversation list
Seen/delivered tick (✓ delivered, ✓✓ seen) — needs message_reads table
Typing indicator — Socket.IO emit 'typing' event, show "X is typing..."
SQL needed for message_reads:

sql
create table if not exists message_reads (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references messages(id) on delete cascade,
  reader_id uuid references users(id) on delete cascade,
  read_at timestamptz default now(),
  unique(message_id, reader_id)
);
alter table message_reads enable row level security;
create policy "read reads" on message_reads for select using (true);
Phase 7 — Admin Posts Tab
File: public/pages/admin/dashboard.html

Add to sidebar: 📰 Posts (before Users) Add section sec-po:

Table with: Author | Content preview | Type | Date | [Delete]
Search box
Filter tabs: All / Achievement / Project Update / Looking for Team
Stats: add Posts count card
API calls:

js
fetch(API + '/api/admin/posts', {headers: H})  // GET
fetch(API + '/api/admin/posts/' + id, {method:'DELETE', headers:H})  // DELETE
Phase 8 — Video Call (Jitsi) ✅ COMPLETED
File: public/pages/user/messages.html
Add video call button in chat header. On click: open modal with Jitsi iframe.
Notify other user via Socket.IO with 'call:incoming' event.

Phase 9 — Global Search (Ctrl+K) ✅ COMPLETED
File: public/assets/js/core/ph-sidebar.js
Add initGlobalSearch() function called from init():
Creates #ph-search-modal div (appended to body)
Listens for Ctrl+K keydown globally
Input triggers debounced fetch to GET /api/users/global-search?q=query
Results shown in 4 grouped sections
Arrow keys navigate, Enter navigates to result, Esc closes
Design Rules (IMPORTANT — must follow)
❌ No hardcoded logo path — use dynamic base variable
❌ No emoji for icons — use inline SVG only
✅ Color-coded avatars (hash of name → color from palette)
✅ Same glassmorphic card style as dashboard (.ph-card)
✅ Same dark/light mode support (html.dark class)
✅ Same Inter font
✅ API_BASE pattern for production/dev URL switching
✅ Mobile: feed column full width, right panel hidden
Tech Stack
Frontend: Static HTML + Vanilla JS + ph-system.css
Backend: Node.js + Express + Supabase (PostgreSQL)
Real-time: Socket.IO
Auth: JWT (localStorage 'access_token')
Hosting: Vercel (frontend) + Render (backend)
Backend URL (production): https://projecthive-backend.onrender.com