# 13: COMPLETE USER JOURNEY & WORKFLOW RECONSTRUCTION

> **Document Classification:** End-to-End Workflow & User Journey Reconstruction  
> **Target Personas:** New Students, Team Leaders, Team Members, Makers, Administrators  
> **Extraction Evidence Level:** `[VERIFIED]` Verified Code Paths & Route Transitions  

---

## Journey A: New Student Onboarding & Profile Activation

```mermaid
flowchart TD
    Step1["1. Visit Landing Page (/)"] --> Step2["2. Click 'Get Started' -> /register"]
    Step2 --> Step3["3. Fill Form (Name, Campus Email, University, Password)"]
    Step3 --> Step4["4. Submit -> POST /api/auth/register"]
    
    Step4 --> CheckFlags{"Email Verification Flag Enabled?"}
    CheckFlags -- Yes --> Step5A["5A. Verification Token Emailed via Brevo SMTP"]
    Step5A --> Step6A["6A. User clicks /verify-email?token=xxx -> Account Verified"]
    CheckFlags -- No --> Step5B["5B. Direct Token Issuance (JWT Access + Refresh)"]
    
    Step6A --> Step7["7. Navigate to /login -> Enter Credentials"]
    Step5B --> Step7
    Step7 --> Step8["8. Authenticated -> Token Stored in localStorage"]
    Step8 --> Step9["9. Land on /dashboard -> Prompt to Complete Profile"]
    Step9 --> Step10["10. Visit /profile -> Upload Avatar (Canvas Compressed), Add Skills & Bio"]
```

- **Verified Steps:** Landing (`/`), Registration (`/register`), Login (`/login`), Dashboard (`/dashboard`), Profile (`/profile`).
- **Operational Reality:** If `system_flags.emailVerification === false` (default state), students bypass email confirmation and achieve instantaneous activation.

---

## Journey B: Team Discovery & Recruitment Application

```mermaid
flowchart TD
    Step1["1. Student on /dashboard"] --> Step2["2. Navigate to /teams (Squads Hub)"]
    Step2 --> Step3["3. Enter Keywords or Select Category (e.g., 'AI / Data')"]
    Step3 --> Step4["4. Browse Squad Cards (View required skills, open roles)"]
    Step4 --> Step5["5. Click 'Apply to Join' -> Mount JoinRequestModal"]
    Step5 --> Step6["6. Enter Motivation Pitch & Portfolio URL -> Click 'Send Application'"]
    Step6 --> Step7["7. POST /api/teams/:id/join -> Writes to join_requests table"]
    Step7 --> Step8["8. Server dispatches notification:new to Squad Leader via Socket.IO"]
    Step8 --> Step9["9. Applicant UI reflects 'Application Pending' badge"]
```

---

## Journey C: Squad Leader Recruitment & Management

```mermaid
flowchart TD
    Step1["1. Student clicks 'Create Squad' -> /teams/create"] --> Step2["2. Configure Squad (Name, Mission, Max Size, Required Skills)"]
    Step2 --> Step3["3. POST /api/teams -> User recorded as leader_id in teams & team_members"]
    Step3 --> Step4["4. Redirected to /teams/[id] (Squad Headquarters)"]
    Step4 --> Step5["5. Leader opens 'Settings' tab -> Views Pending Join Requests"]
    Step5 --> Step6["6. Leader reviews applicant profile and motivation pitch"]
    
    Step6 --> Decision{"Accept or Reject?"}
    Decision -- Accept --> Step7A["7A. Click 'Accept' -> POST /api/teams/:id/requests/:reqId/accept"]
    Step7A --> Step8A["8A. Member added to team_members; join_requests status = 'accepted'"]
    Step8A --> Step9A["9A. Notification sent to applicant; applicant gains squad chat access"]
    
    Decision -- Reject --> Step7B["7B. Click 'Reject' -> POST /api/teams/:id/requests/:reqId/reject"]
    Step7B --> Step8B["8B. Request status updated to 'rejected'"]
```

---

## Journey D: Team Member Workspace Collaboration

```mermaid
flowchart TD
    Step1["1. Member opens /teams/[id]"] --> Step2["2. Access Squad Headquarters"]
    Step2 --> Step3["3. Switch to 'Chat' Tab -> Join Socket Room 'team_:id'"]
    Step3 --> Step4["4. Exchange messages, share attachments, react with emojis"]
    Step4 --> Step5["5. Click 'Start Squad Call' -> Mint LiveKit Video Grant"]
    Step5 --> Step6["6. Mount ActiveCallOverlay -> Multi-participant video/audio stream"]
    Step6 --> Step7["7. Open Whiteboard -> Collaborative architectural sketching"]
    Step7 --> Step8["8. Navigate to Dev Workspace -> Inspect GitHub repo & CI/CD status"]
```

---

## Journey E: Real-Time Direct Messaging (DMs)

```mermaid
flowchart TD
    Step1["1. Student navigates to /messages or clicks 'Message' on a profile"] --> Step2["2. Select conversation thread -> Room ID generated ('userA_userB')"]
    Step2 --> Step3["3. Client emits Socket.IO 'join:room'"]
    Step3 --> Step4["4. Student types message -> Emits 'message:send'"]
    Step4 --> Step5["5. Server inserts row into 'messages' table"]
    Step5 --> Step6["6. Dual-Dispatch: Emits 'message:received' to room and 'user_:recipientId'"]
    Step6 --> Step7["7. Recipient device receives message -> Emits 'message:delivered'"]
    Step7 --> Step8["8. Sender sees double gray checkmark"]
    Step8 --> Step9["9. Recipient views chat -> Emits 'message:read' -> Sender checkmark turns cyan"]
```

---

## Journey F: Native WebRTC Video / Voice Calling

```mermaid
flowchart TD
    Step1["1. Caller clicks Video icon in Chat Header"] --> Step2["2. POST /api/calls/token -> Backend issues LiveKit JWT"]
    Step2 --> Step3["3. Caller emits Socket.IO 'call:initiate'"]
    Step3 --> Step4["4. Server verifies friendship -> Dispatches 'call:incoming' to callee sockets"]
    Step4 --> Step5["5. Callee hears ringtone and sees IncomingCallModal"]
    
    Step5 --> CalleeDecision{"Accept or Decline?"}
    CalleeDecision -- Accept --> Step6A["6A. Callee requests token -> Joins LiveKit Room"]
    Step6A --> Step7A["7A. Callee emits 'call:accept' -> Caller connects to SFU"]
    Step7A --> Step8A["8A. Bi-directional WebRTC media tracks streamed via LiveKit SFU"]
    Step8A --> Step9A["9A. Either participant can click 'Minimize' into PiP Floating Widget"]
    Step8A --> Step10A["10A. Click 'Hang Up' -> POST /api/calls/end -> Duration saved in DB"]

    CalleeDecision -- Decline --> Step6B["6B. Callee emits 'call:decline' -> Caller status = 'REJECTED'"]
```

---

## Journey G: HiveMind AI Copilot Execution

```mermaid
flowchart TD
    Step1["1. Student opens /generator or presses Ctrl+J (Copilot Drawer)"] --> Step2["2. Select capability (e.g., 'architecture_design')"]
    Step2 --> Step3["3. Enter technical prompt or attach screenshot -> Click Send"]
    Step3 --> Step4["4. POST /api/ai/execute -> Body: { capability, prompt, imageBase64? }"]
    Step4 --> Step5["5. Backend sanitizer scrubs sensitive credentials from prompt"]
    
    Step5 --> Step6{"Image Attachment Present?"}
    Step6 -- Yes --> Step7A["7A. Route to Gemini 2.0 Flash (Multimodal Vision)"]
    Step7A -.->|Failover| Step8A["8A. Fallback to OpenRouter Vision"]
    
    Step6 -- No --> Step7B["7B. Route to Tier 1: Groq Cloud (Llama 3.3 / GPT-OSS 120B)"]
    Step7B -.->|Failover on 429| Step8B["8B. Cascade to Tier 2: Google Gemini Flash"]
    Step8B -.->|Failover on 503| Step9B["9B. Cascade to Tier 3: OpenRouter Free Pool"]
    
    Step7A --> Step10["10. Response desanitized (restores redacted tokens)"]
    Step8A --> Step10
    Step7B --> Step10
    Step8B --> Step10
    Step9B --> Step10
    
    Step10 --> Step11["11. Frontend renders markdown response with syntax highlighting"]
    Step11 --> Step12["12. Optional: Click Speaker icon to hear response via Web Speech TTS"]
```

---

## Journey H: Showcase Project Publishing & Discovery

```mermaid
flowchart TD
    Step1["1. Student visits /projects -> Clicks 'Submit Project'"] --> Step2["2. Enters title, description, category, tech stack tags, demo & repo URLs"]
    Step2 --> Step3["3. POST /api/projects -> Saved in 'projects' table"]
    Step3 --> Step4["4. Project appears on Showcase page"]
    Step4 --> Step5["5. Peers view project card -> Click Upvote (▲)"]
    Step5 --> Step6["6. POST /api/projects/:id/upvote -> Increments tally; optimistic UI"]
    Step6 --> Step7["7. Peers click 'Dev Workspace' -> Directly explore repository files & commits"]
```

---

## Journey I: Institutional Administrative Governance

```mermaid
flowchart TD
    Step1["1. Administrator accesses /admin/login on Desktop Workstation"] --> Step2["2. DesktopGate checks viewport width (>= 1024px) & non-touch pointer"]
    Step2 --> Step3["3. Authenticate -> Verified against ADMIN_EMAIL & ADMIN_PASSWORD"]
    Step3 --> Step4["4. Mount Admin Dashboard (/admin) -> Live telemetry stream"]
    Step4 --> Step5["5. Navigate to /admin/moderation -> Review pending abuse reports"]
    Step5 --> Step6["6. Navigate to /admin/users -> Issue strike against violating account"]
    Step6 --> Step7["7. Navigate to /admin/system -> Toggle platform maintenance or registration flags"]
    Step7 --> Step8["8. Navigate to /admin/audit -> Review immutable forensic ledger of actions"]
```

