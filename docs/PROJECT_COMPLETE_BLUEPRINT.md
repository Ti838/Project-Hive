# ProjectHive 🐝 — Complete System Blueprint & Developer Handbook

This document contains the absolute, comprehensive details of **ProjectHive**—what it is, why it was built, its full capabilities, complete technology stack, real-time workflows, and security architectures.

---

## 1. What is ProjectHive? (system ki)
**ProjectHive** is a premium, full-stack, real-time collaboration and teammate discovery platform designed specifically for university students. It serves as a unified digital ecosystem combining:
* **Professional Networking (LinkedIn-style):** Skill-based searchable profiles and student-centric social feeds.
* **Instant Collaboration (Slack-style):** Real-time messaging, WebRTC calling, and interactive whiteboard tools.
* **Project Showcase (GitHub-style):** A public repository gallery with community upvoting and featured highlights.

---

## 2. Why Was It Built? (kano)
Every semester, computer science and engineering students encounter several systematic challenges:
1. **Teammate Search Friction:** Students have no easy way of knowing which peers have matching skills (e.g., React, Flutter, AI/ML) for group projects.
2. **Communication Fragmentation:** Conversations are scattered across Discord, WhatsApp, Messenger, and email, leading to disorganized tasks, missing project assets, and late submissions.
3. **Lack of a Tech Showcase:** Projects are completed, graded, and then forgotten on local hard drives. There is no centralized gallery within universities to publish codebases and gain peer appreciation.
4. **Brainstorming Gaps:** Students often struggle to conceptualize project ideas or analyze UI sketches without active mentoring.

---

## 3. What Can It Do? (ki ki korte pare - Detailed Features & Workflows)

### 3.1 Secure Authentication & Onboarding
* **Turnstile Protection:** Cloudflare Turnstile CAPTCHA guards auth endpoints to block automated bot registrations.
* **SMTP Email Verification:** Registration triggers a verification token sent via **Brevo SMTP (Nodemailer)**. Users must verify their email before logging in.
* **Google OAuth:** One-click registration/login integrated via Supabase provider.
* **Cookie-Based Sessions:** Migrated JWT access (24h) and refresh (7d) tokens from local storage into secure, `HttpOnly`, `SameSite` cookies to neutralize XSS token-theft risks.

### 3.2 Profile Directory & People Discovery
* **Skill & University Filtering:** A searchable user directory filterable by university name and tech skill chips (e.g., Web, Mobile, AI/ML).
* **Friend Workflows:** Direct APIs to send, accept, decline, and delete friend requests.
* **Profile Completion Tracker:** A dynamic UI progress bar showing completion percentage based on bio, links, and avatar status.

### 3.3 Real-Time Chat System (Socket.IO)
* **Instant Delivery:** Bi-directional Socket.IO WebSocket channels for DMs and team chats.
* **Dynamic Indicators:** Displays real-time typing indicators ("User is typing...") and online/offline status dots.
* **Message Handling:** Retains full scrollable chat history, supports message replies, message editing/deletion, and emoji reactions.
* **Voice Messaging:** Record audio directly in browser $\rightarrow$ shows live waveform visualizer $\rightarrow$ uploads to server $\rightarrow$ plays back with customizable speeds.

### 3.4 WebRTC Voice & Video Calling
* **1:1 Calling:** High-quality, low-latency WebRTC P2P Voice and Video calls.
* **ICE Candidate Queuing:** Solves call-initiation race conditions by buffering connection candidates during the ringing phase.
* **Metered.ca TURN Relay:** Bypasses strict university/corporate firewalls using secure, server-generated temporary HMAC-SHA1 TURN credentials.
* **Group Calling:** Embedded **Jitsi Meet** iframe directly within the team chat viewport.

### 3.5 Collaborative Live Whiteboard
* **Normalized Syncing:** Draws onto HTML5 canvas and normalizes coordinates `(x/width, y/height)` as floats between `0.0` and `1.0`.
* **Real-time Broadcast:** Socket.IO relays drawing coordinates. The peer scales coordinates to their local monitor size, keeping drawing strokes identical across different screens.
* **Tools:** Pen, Eraser, Clear, 5 color swatches, and brush thickness control.

### 3.6 Team Assembly & Lifecycle
* **Team Creation:** Define team name, description, tags, category, and max team member limits.
* **Join Requests Queue:** Students apply $\rightarrow$ leader receives notification $\rightarrow$ accept/reject updates the team list in real-time.
* **Management:** Leaders can edit team details, close the team when full, or kick members. Members can leave voluntarily.

### 3.7 Social Feed & Showcase
* **Post Composer:** Share achievements, project updates, links (with server-side metadata preview scraping), and images.
* **Interactive Polls:** Build 2-5 option polls with live percentage updates as users vote.
* **Showcase Gallery:** Publish completed projects with GitHub and Live URLs. Includes a community upvote/like system. Admins can flag projects as "Featured" (pins with a gold star badge).

### 3.8 Dual AI Engine (Groq + Gemini)
* **Groq SDK (Primary):** Relies on `llama-3.3-70b` for instant chat and structured 3-idea project recommendations based on student skills.
* **Gemini SDK (Fallback & Vision):** If Groq encounters API limits, the backend automatically falls back to `gemini-2.5-flash`. Gemini also handles image/diagram upload reviews.

### 3.9 Admin Moderation Control Center
* **Security:** Timing-safe password checks (`crypto.timingSafeEqual`) and brute-force lockout (5 attempts / 15m).
* **System Flags:** Toggles maintenance mode, registration open/closed, and email verification.
* **Moderation:** Banning/unbanning users, deleting teams/projects, and viewing role distribution analytics.
* **Health Check:** Live check verifying backend server and Supabase DB connection statuses.

---

## 4. What Technology Stack is Used? (ki ki use korsi)

| Layer | Technologies & Services | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JS (ES2020+) | High performance, zero framework overhead, instant load. |
| **Styling** | Custom CSS Variables, Tailwind CSS | Sleek theme variables, dark mode styling, bento-grid layouts. |
| **Backend** | Node.js, Express.js, Socket.IO v4 | REST API routing, WebSocket gateway, WebRTC signaling. |
| **Database** | Supabase Cloud (PostgreSQL) | Persistence layer, relational table structures, Row-Level Security (RLS). |
| **Relay Network** | Metered.ca STUN/TURN | Traverses symmetric NATs, mobile networks, and college firewalls. |
| **APIs & AI** | Groq API, Google Gemini, Brevo SMTP | Dual AI, vision analysis, transactional email delivery. |
| **Security** | Helmet.js, Cloudflare Turnstile | CSP headers, HSTS, bot verification, input sanitization. |
| **Hosting** | Vercel (Frontend), Render (Backend) | Static file CDN hosting, Node server deployment. |

---

## 5. What Solutions Does it Provide? (ki solution kore)

### 5.1 Real-World Student Solutions
* **Time Savings:** Reduces teammate discovery time from weeks to seconds via skill filters.
* **Structured Collaborations:** Centralizes chats, group calls, and whiteboards, eliminating tool fragmentation.
* **Academic Portfolio:** Connects student coding achievements to a public profile gallery.

### 5.2 Technical Security Hardening (21 OWASP Fixes)
ProjectHive solved 21 vulnerabilities identified in a comprehensive security audit:
* **SQL Injection Blocked:** Sanitized input parameters on all search routes using `sanitizeSearch()`.
* **SSRF Shielded:** Verified scraper URLs, blocking private subnets (`10.x.x.x`, `192.168.x.x`), loopback, and own backend domains.
* **JWT Storage Hardening:** Moved tokens to HTTP-Only secure cookies, neutralizing XSS attacks.
* **Timing Attack Prevention:** Admin login passwords compared using constant-time evaluation to block side-channel attacks.
* **CSP Headers:** Helmet configured with strict frame-ancestors, connect-src, and frame-src policies (meet.jit.si allowlist).

### 5.3 System Metrics
* **Frontend Performance:** Average page load time under **800ms**.
* **WebSocket Speed:** Socket.IO packet latency averages **~45ms**.
* **Call Setups:** WebRTC peer connection established in under **2.5s**.
