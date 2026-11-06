# PROJECTHIVE: END-TO-END USER JOURNEY MAPS

This document details the primary user journeys across ProjectHive, specifying the exact interactions on Desktop vs Mobile devices.

---

## Journey 1: New Student Discovery & Account Activation
1. **Landing Page (`/`):**
   - *Desktop:* Student explores the interactive Bento Grid, reviews live platform stats, and clicks "Get Started Free" in the sticky navbar.
   - *Mobile:* Student swipes through the hero showcase cards, expands the FAQ accordion with touch taps, and hits the bottom CTA banner.
2. **Registration (`/register`):**
   - Student enters First Name, Last Name, University Email (`.edu` or institutional), and creates a strong password.
   - Client validates fields with Zod; Supabase Auth triggers an account record with `role: 'user'`.
   - Branded confirmation email is dispatched via `server/services/email.service.js`.
3. **Email Verification (`/verify-email`):**
   - Student verifies OTP or clicks the magic link; session is activated and redirects to `/dashboard`.

---

## Journey 2: Team Leader Squad Creation & Member Recruitment
1. **Squad Initiation (`/teams` -> `/teams/create`):**
   - Leader fills out Squad Name (e.g. "Nova Neural Network"), Category (`AI / Data`), Capacity (e.g. 4 members), Required Skills (`PyTorch`, `Next.js`, `FastAPI`), and Privacy (`Public`).
2. **Publishing Vacancy:**
   - Team is created in Supabase `teams` table; status automatically set to `recruiting`.
3. **Reviewing Applications:**
   - Candidate discovers squad on `/teams`, opens Join Request Modal, and submits portfolio link and custom pitch.
   - Leader receives instant notification in `/notifications` and on `/teams/[id]`.
   - Leader reviews candidate's profile hover card, checks skill endorsements, and clicks "Accept".
   - Socket.IO emits `team:member_joined`; applicant is granted access to the team workspace and private squad chat.

---

## Journey 3: Instant Collaboration & LiveKit Meeting
1. **Workspace Entrance (`/teams/[id]`):**
   - Squad members open the team workspace, viewing active roster, shared GitHub repo, and group chat.
2. **Triggering LiveKit Call:**
   - Any member clicks "Start Video Call" in the header.
   - CallManager generates a LiveKit Cloud room token (`project-hive-o0q9p17e.livekit.cloud`).
   - Sockets emit `call:incoming` to all active squad members; receiving devices play ringtone and show incoming call modal.
3. **In-Call Collaboration:**
   - Members participate with low-latency WebRTC audio/video, screensharing, and in-call whiteboard.

---

## Journey 4: HiveMind AI Assisted Project Inception
1. **AI Studio (`/generator`):**
   - Student selects "Project Generator" or "Tech Stack Architect" capability.
   - Enters query via text prompt or microphone voice dictation (Web Speech API).
2. **Cascading Model Execution:**
   - Query routes through Groq LPU (low latency) -> Gemini 2.0 Flash -> OpenRouter.
3. **Artifact Generation:**
   - Live AI response streams into the split-pane artifact canvas with Markdown architecture diagrams, database schema, and task breakdown.
   - Student clicks "Export to Project" or "Create Squad from Blueprint" with a single click.

