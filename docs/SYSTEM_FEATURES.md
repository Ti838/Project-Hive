# ProjectHive — System Documentation

> **A Student Collaboration & Team Formation Platform**  
> Version 1.0 | Last Updated: June 24, 2026

---

## 1. What is ProjectHive?

ProjectHive is a **full-stack web platform** that helps university students find teammates, collaborate on projects, and showcase their work — all in one place.

Think of it as **LinkedIn + Slack + GitHub**, designed specifically for students.

```mermaid
mindmap
  root((ProjectHive))
    🤝 Networking
      Find classmates
      Add friends
      Skill matching
      University filter
    👥 Teams
      Create teams
      Join requests
      Team chat
      Manage members
    🚀 Projects
      Showcase portfolio
      Upvote system
      Tech stack tags
      Featured projects
    💬 Communication
      Real-time messaging
      Voice messages
      Group chats
      Notifications
    📰 Social Feed
      Post updates
      Achievements
      Polls
      Mentions
    🤖 AI Powered
      Project idea generator
      Smart recommendations
      Chat assistant
```

---

## 2. Why Was It Built?

### The Problem

University students face these challenges every semester:

```mermaid
graph LR
    P1["😩 Can't find<br/>teammates"] --> RESULT["❌ Failed projects<br/>& missed deadlines"]
    P2["🔍 No way to<br/>discover skills"] --> RESULT
    P3["💬 Scattered<br/>communication"] --> RESULT
    P4["📂 No place to<br/>showcase work"] --> RESULT

    style P1 fill:#ef4444,stroke:#dc2626,color:#fff
    style P2 fill:#f59e0b,stroke:#d97706,color:#fff
    style P3 fill:#3b82f6,stroke:#2563eb,color:#fff
    style P4 fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style RESULT fill:#1e1b4b,stroke:#6366f1,color:#fff
```

### The Solution

ProjectHive solves all of these in one platform:

| Problem | ProjectHive Solution |
|---------|---------------------|
| Can't find teammates | **People Discovery** with skill filtering, university search, AI recommendations |
| Don't know who has what skills | **Skill Profiles** with endorsements, searchable across the platform |
| Communication is scattered | **Real-time Messaging** with DMs, team group chats, voice messages |
| No place to showcase work | **Project Showcase** with upvotes, featured projects, tech stack tags |
| Hard to form study groups | **Team System** with create, join, manage, and collaborate features |
| No motivation to share progress | **Social Feed** with posts, achievements, polls, reactions |

---

## 3. System Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph USERS["👥 Users"]
        STU["Students"]
        ADM["Admins"]
    end

    subgraph FRONTEND["🖥️ Frontend — Vercel"]
        LP["Landing Page"]
        DASH["Dashboard"]
        FEED["Social Feed"]
        MSG["Messaging"]
        PPL["People"]
        TEAM["Teams"]
        PROJ["Showcase"]
        AIGEN["AI Generator"]
        ADMIN["Admin Panel"]
    end

    subgraph BACKEND["⚡ Backend — Render"]
        EXPRESS["Express.js Server"]
        SOCKET["Socket.IO"]
        JWT["JWT Auth"]
        RATE["Rate Limiter"]
        XSS["XSS Sanitizer"]
    end

    subgraph SERVICES["🔌 External Services"]
        SUPA["Supabase PostgreSQL"]
        GEMINI["Google Gemini AI"]
        BREVO["Brevo Email"]
        CF["Cloudflare Turnstile"]
        GOAUTH["Google OAuth"]
    end

    STU --> FRONTEND
    ADM --> ADMIN
    FRONTEND -->|REST API| EXPRESS
    FRONTEND <-->|WebSocket| SOCKET
    EXPRESS --> JWT
    EXPRESS --> RATE
    EXPRESS --> XSS
    EXPRESS --> SUPA
    EXPRESS --> GEMINI
    EXPRESS --> BREVO
    JWT --> GOAUTH
    FRONTEND --> CF

    style USERS fill:#6366f1,stroke:#4f46e5,color:#fff
    style FRONTEND fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    style BACKEND fill:#0c1222,stroke:#10b981,color:#e2e8f0
    style SERVICES fill:#1a0d2e,stroke:#a855f7,color:#e2e8f0
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Vanilla HTML/CSS/JS | No framework dependency, fast loading |
| **Styling** | TailwindCSS + custom CSS | Premium UI design system |
| **Icons** | Google Material Symbols | Consistent icon system |
| **Fonts** | Inter (Google Fonts) | Modern, readable typography |
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | Supabase PostgreSQL | 13 tables, RLS security |
| **Real-time** | Socket.IO | WebSocket for messaging & notifications |
| **AI** | Google Gemini API | Project idea generation, chat assistant |
| **Auth** | JWT + Google OAuth | Secure authentication |
| **Email** | Brevo (Sendinblue) | Verification & password reset emails |
| **CAPTCHA** | Cloudflare Turnstile | Bot protection on login |
| **Hosting** | Vercel + Render | Frontend CDN + backend server |

---

## 4. Complete Feature Map

### User Journey

```mermaid
graph LR
    A["Register /<br/>Login"] --> B["Complete<br/>Profile"]
    B --> C["Add Skills<br/>& Bio"]
    C --> D{"What to do?"}
    
    D --> E["🔍 Find People"]
    D --> F["👥 Join Team"]
    D --> G["📰 Post Feed"]
    D --> H["💬 Message"]
    D --> I["🚀 Showcase"]
    D --> J["🤖 AI Ideas"]

    E --> K["Add Friends"]
    F --> L["Collaborate"]
    G --> M["Get Reactions"]
    H --> N["Real-time Chat"]
    I --> O["Get Upvotes"]
    J --> P["Build Project"]

    K --> L
    L --> P
    P --> I

    style A fill:#6366f1,stroke:#4f46e5,color:#fff
    style D fill:#f59e0b,stroke:#d97706,color:#fff
    style P fill:#10b981,stroke:#059669,color:#fff
    style I fill:#ec4899,stroke:#db2777,color:#fff
```

---

## 5. Feature Details

### 5.1 Authentication System

```mermaid
graph TB
    subgraph AUTH["🔐 Authentication"]
        R["Register"] --> EV["Email Verification"]
        L["Login"] --> JWT["JWT Token"]
        G["Google OAuth"] --> JWT
        FP["Forgot Password"] --> RE["Reset Email"]
        RE --> NP["New Password"]
    end

    JWT --> ACCESS["Access Token<br/>15 min"]
    JWT --> REFRESH["Refresh Token<br/>7 days"]
    ACCESS --> API["API Access"]

    style AUTH fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
```

| Feature | Description |
|---------|-------------|
| Email + Password | Standard registration with bcrypt hashing |
| Google OAuth | One-click sign in via Supabase provider |
| Email Verification | Verification email with clickable link |
| Forgot Password | Email-based password reset flow |
| JWT Tokens | Access (15m) + Refresh (7d) token pair |
| Auto Refresh | Token auto-refreshes before expiry |
| CAPTCHA | Cloudflare Turnstile on login form |
| Rate Limiting | 20 attempts / 15 minutes on auth endpoints |

---

### 5.2 Dashboard

The main hub after login. Shows everything at a glance.

```mermaid
graph TB
    subgraph DASH["🏠 Dashboard Layout"]
        subgraph LEFT["Left Sidebar"]
            NAV["Navigation Menu"]
            THEME["Dark/Light Toggle"]
        end
        
        subgraph CENTER["Main Content"]
            GREET["Greeting Card"]
            PROFILE_PCT["Profile Completion %"]
            STATS["Quick Stats Grid"]
            NOTIFS["Recent Notifications"]
        end

        subgraph RIGHT["Right Sidebar"]
            CLOCK["Live Clock"]
            ONLINE["Online Friends"]
            RFEED["Recent Feed Posts"]
            STEAM["Suggested Teams"]
            AICARD["AI Promo Card"]
        end
    end

    style DASH fill:#0f172a,stroke:#6366f1,color:#e2e8f0
    style LEFT fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    style CENTER fill:#1e1b4b,stroke:#10b981,color:#e2e8f0
    style RIGHT fill:#1e1b4b,stroke:#a855f7,color:#e2e8f0
```

| Widget | What It Shows |
|--------|--------------|
| Greeting Card | "Good morning, [Name]" with time-aware greeting |
| Profile Completion | Progress bar with % and step indicator |
| Quick Stats | 4 cards — Teams, Friends, Projects, Messages count |
| Notifications | Latest 5 alerts with mark-all-read |
| Online Friends | Friends currently active (green dot) |
| Recent Feed | Last 3 posts from the social feed |
| Suggested Teams | 3 teams you might want to join |
| AI Promo | CTA card linking to AI Generator |
| Live Clock | Real-time clock with date |

---

### 5.3 Social Feed

A LinkedIn-style feed for sharing updates, achievements, and polls.

```mermaid
graph TB
    subgraph COMPOSER["✏️ Post Composer"]
        TEXT["Text Content"]
        TYPE["Post Type Selector"]
        IMG["Image Attachment"]
        LINK["URL Preview"]
        POLL["Poll Builder"]
        MENTION["@Mention Autocomplete"]
    end

    subgraph POST_TYPES["📋 Post Types"]
        GEN["📝 General"]
        ACH["🏆 Achievement"]
        PU["📊 Project Update"]
        LFT["👥 Looking for Team"]
        POL["📊 Poll"]
    end

    subgraph INTERACTIONS["💬 Interactions"]
        REACT["4 Reaction Types"]
        COMMENT["Comments"]
        SAVE["Bookmark"]
        SHARE["Copy Link"]
        EDIT["Edit / Delete"]
    end

    COMPOSER --> POST_TYPES
    POST_TYPES --> INTERACTIONS

    style COMPOSER fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    style POST_TYPES fill:#0c1222,stroke:#f59e0b,color:#e2e8f0
    style INTERACTIONS fill:#1a0d2e,stroke:#10b981,color:#e2e8f0
```

| Feature | How It Works |
|---------|-------------|
| Post Types | 5 types — each renders with unique color styling |
| @Mentions | Type `@` → popover appears → select user → highlighted in post |
| Polls | Create 2-5 options → users vote → live % bars update |
| Reactions | Like, Celebrate, Insightful, Support (one per user) |
| Comments | Threaded comments with edit/delete |
| Link Preview | Paste URL → server scrapes title, description, image |
| Image Upload | Attach image with preview before posting |
| Bookmark | Save posts to your Saved collection |

---

### 5.4 Messaging System

Full real-time chat with DMs, team groups, voice, and more.

```mermaid
graph TB
    subgraph MSG["💬 Messaging Features"]
        subgraph TYPES["Message Types"]
            TXT["📝 Text"]
            VOICE["🎤 Voice"]
            IMAGE["🖼️ Image"]
        end
        
        subgraph FEATURES["Core Features"]
            RT["⚡ Real-time via Socket.IO"]
            REPLY["↩️ Reply to Messages"]
            EDITM["✏️ Edit Messages"]
            DEL["🗑️ Delete Messages"]
            EMOJI["😀 Emoji Reactions"]
            READ["✅ Read Receipts"]
            TYPING["💭 Typing Indicator"]
        end

        subgraph CHANNELS["Chat Channels"]
            DM["👤 Direct Messages"]
            TEAM_CHAT["👥 Team Group Chat"]
            REQ["📨 Message Requests"]
        end
    end

    style MSG fill:#0f172a,stroke:#6366f1,color:#e2e8f0
    style TYPES fill:#1e1b4b,stroke:#ec4899,color:#e2e8f0
    style FEATURES fill:#1e1b4b,stroke:#10b981,color:#e2e8f0
    style CHANNELS fill:#1e1b4b,stroke:#f59e0b,color:#e2e8f0
```

| Feature | Description |
|---------|-------------|
| Real-time delivery | Messages appear instantly via WebSocket |
| Voice messages | Record with live waveform → send as audio |
| Image attachments | Drag & drop or click to attach |
| Reply | Quote any message with preview |
| Edit | Modify your sent messages |
| Reactions | React with emoji to any message |
| Read receipts | Blue checkmarks when read |
| Typing indicator | "User is typing..." feedback |
| Message requests | Non-friends go to request inbox |
| Delete | Remove individual messages or entire conversations |

---

### 5.5 People & Networking

```mermaid
graph LR
    subgraph DISCOVER["🔍 Discovery"]
        SEARCH["Search by Name,<br/>University, Skills"]
        FILTER["Filter Chips:<br/>All, Available,<br/>Web, AI, Mobile"]
        UNI["University<br/>Dropdown Filter"]
    end

    subgraph NETWORK["🤝 Networking"]
        ADD["Send Friend Request"]
        ACCEPT["Accept / Decline"]
        UNFRIEND["Remove Friend"]
        MUTUAL["Mutual Friends Count"]
    end

    subgraph VIEWS["📑 Tabs"]
        T1["Discover"]
        T2["Recommended"]
        T3["My Friends"]
        T4["Requests"]
    end

    DISCOVER --> NETWORK
    VIEWS --> DISCOVER

    style DISCOVER fill:#1e1b4b,stroke:#3b82f6,color:#e2e8f0
    style NETWORK fill:#0c1222,stroke:#10b981,color:#e2e8f0
    style VIEWS fill:#1a0d2e,stroke:#a855f7,color:#e2e8f0
```

| Feature | Description |
|---------|-------------|
| Discover | Browse all users with profile cards |
| Recommended | AI-powered suggestions based on mutual friends |
| Search | By name, university, or skills |
| Skill filters | Web Dev, AI/ML, Mobile Dev chip filters |
| University filter | Dropdown populated from all users' universities |
| Friend requests | Send, accept, decline with real-time UI updates |
| Unfriend | Remove friends from My Friends tab |
| Mutual count | "3 mutual friends" shown on recommended cards |

---

### 5.6 Teams & Collaboration

```mermaid
graph TB
    subgraph LIFECYCLE["👥 Team Lifecycle"]
        CREATE["Create Team"] --> OPEN["Open for Joining"]
        OPEN --> JOIN["Users Send<br/>Join Requests"]
        JOIN --> LEADER["Leader Accepts<br/>/ Rejects"]
        LEADER --> COLLAB["Team Collaborates"]
        COLLAB --> CHAT["Team Group Chat"]
        COLLAB --> PROJECT["Submit Project<br/>to Showcase"]
    end

    subgraph MANAGE["⚙️ Management"]
        EDIT_T["Edit Team Info"]
        KICK["Kick Members"]
        CLOSE["Close / Open Team"]
        DELETE_T["Delete Team"]
    end

    COLLAB --> MANAGE

    style LIFECYCLE fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    style MANAGE fill:#0c1222,stroke:#ef4444,color:#e2e8f0
```

| Feature | Description |
|---------|-------------|
| Create team | Name, description, category, tags, max size |
| Browse teams | Grid view with search and open/closed filter |
| Join request | Send request → leader approves → you're in |
| Team chat | Real-time group messaging |
| Edit team | Update name, description, category, tags |
| Kick members | Leader can remove any member |
| Leave team | Members can leave voluntarily |
| Close/Open | Toggle team availability |

---

### 5.7 Project Showcase

```mermaid
graph LR
    subgraph SUBMIT["📤 Submit Project"]
        TITLE["Title & Description"]
        TECH["Tech Stack Tags"]
        LINKS["GitHub + Demo URLs"]
        CAT["Category Selection"]
    end

    subgraph DISPLAY["🖼️ Showcase"]
        CARDS["Project Cards Grid"]
        DETAIL["Detail Modal"]
        BADGE["⭐ Featured Badge"]
        MEMBERS["Looking for Members"]
    end

    subgraph INTERACT["❤️ Interactions"]
        UPVOTE["Upvote / Like"]
        BOOKMARK["Bookmark / Save"]
        EDIT_P["Edit Project"]
        DELETE_P["Delete Project"]
    end

    SUBMIT --> DISPLAY --> INTERACT

    style SUBMIT fill:#1e1b4b,stroke:#10b981,color:#e2e8f0
    style DISPLAY fill:#0c1222,stroke:#f59e0b,color:#e2e8f0
    style INTERACT fill:#1a0d2e,stroke:#ec4899,color:#e2e8f0
```

---

### 5.8 AI Generator

Powered by **Google Gemini API** (`gemini-2.0-flash`).

```mermaid
graph TB
    subgraph AI["🤖 AI Features"]
        CHAT_AI["💬 Chat with AI<br/>Ask anything about projects"]
        GEN["💡 Generate Ideas<br/>Input skills → Get 3 ideas"]
        IMG_AI["🖼️ Image Analysis<br/>Upload image for AI review"]
    end

    subgraph OUTPUT["📋 Output"]
        IDEA["Idea Card:<br/>Title + Description +<br/>Tech Stack + Difficulty"]
        SAVE_AI["💾 Save to Collection"]
        SHARE_AI["📤 Share to Feed"]
    end

    AI --> OUTPUT

    style AI fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    style OUTPUT fill:#0c1222,stroke:#10b981,color:#e2e8f0
```

| Feature | Description |
|---------|-------------|
| AI Chat | Natural language conversation about project ideas |
| Idea Generation | Input your skills + interests → get 3 structured project suggestions |
| Idea Cards | Title, description, tech stack, difficulty level |
| Save Idea | Save to localStorage collection for later |
| Share to Feed | Post idea to social feed with `#ProjectIdea` tag |
| Image Analysis | Upload an image → AI analyzes and discusses it |

---

### 5.9 Admin Panel

Full moderation and system management dashboard.

```mermaid
graph TB
    subgraph ADMIN["🛡️ Admin Panel"]
        subgraph MOD["Moderation"]
            USERS_M["User Management<br/>Ban / Unban / Delete / Role"]
            TEAMS_M["Team Management<br/>View / Delete"]
            PROJ_M["Project Management<br/>Feature / Delete"]
            POSTS_M["Post Moderation<br/>Review / Delete"]
        end

        subgraph INSIGHT["Insights"]
            STATS_A["Platform Statistics"]
            ANALYTICS["Charts & Graphs"]
            AUDIT["Audit Log"]
            REPORTS["Reports + Export"]
        end

        subgraph SYS["System"]
            MAINT["Maintenance Mode"]
            REG["Registration Toggle"]
            EMAILV["Email Verification Toggle"]
            HEALTH["API + DB Health Check"]
            BLAST["Email Blast"]
        end
    end

    style ADMIN fill:#0f172a,stroke:#ef4444,color:#e2e8f0
    style MOD fill:#1e1b4b,stroke:#f59e0b,color:#e2e8f0
    style INSIGHT fill:#1e1b4b,stroke:#3b82f6,color:#e2e8f0
    style SYS fill:#1e1b4b,stroke:#10b981,color:#e2e8f0
```

| Section | Capabilities |
|---------|-------------|
| **Users** | Search, filter by role, ban/unban, promote/demote, delete |
| **Teams** | Browse all, filter open/closed, delete |
| **Projects** | Browse all, feature/unfeature, delete |
| **Posts** | View with content preview + attachments, delete |
| **Analytics** | User distribution chart, team status chart |
| **Audit Log** | Logs all admin actions (ban, delete, role change) with timestamps |
| **Reports** | 8-stat summary + JSON export download |
| **Email Blast** | Compose email → target All/Students/Admins → send |
| **System** | Maintenance mode, registration, email verification toggles |
| **Health** | Live API and database connection status |

---

### 5.10 Settings & Profile

```mermaid
graph TB
    subgraph SETTINGS["⚙️ Settings Tabs"]
        ACC["👤 Account<br/>Name, University, Bio"]
        SEC["🔒 Security<br/>Change Password"]
        PRIV["🛡️ Privacy<br/>Public/Private Profile"]
        NOTIF_S["🔔 Notifications<br/>6 Email Toggles"]
        BLOCK["🚫 Blocked Users<br/>View & Unblock"]
        DATA["💾 Data & Sessions<br/>Active Session Info<br/>Download Data Export"]
        DANGER["⚠️ Danger Zone<br/>Delete Account"]
    end

    style SETTINGS fill:#0f172a,stroke:#6366f1,color:#e2e8f0
```

---

### 5.11 Notifications

```mermaid
graph LR
    EVENT["🔔 Event Occurs"] --> SOCKET["Socket.IO<br/>Pushes to Client"]
    SOCKET --> BADGE["Sidebar Badge<br/>Unread Count"]
    SOCKET --> PAGE["Notifications Page<br/>Full List"]
    PAGE --> CLICK["Click → Redirect<br/>to Relevant Page"]
    PAGE --> READ["Mark as Read"]
    PAGE --> DEL_N["Delete"]

    style EVENT fill:#6366f1,stroke:#4f46e5,color:#fff
    style SOCKET fill:#10b981,stroke:#059669,color:#fff
```

| Notification Type | Trigger | Redirect |
|------------------|---------|----------|
| Friend Request | Someone sends you a request | People → Requests |
| Team Invite | Invited to join a team | Teams page |
| Message | New message received | Messages |
| Post Reaction | Someone reacts to your post | Feed → Post |
| Comment | Someone comments on your post | Feed → Post |

---

## 6. Security Architecture

```mermaid
graph TB
    subgraph SECURITY["🔒 21 Vulnerabilities Found & Fixed"]
        subgraph CRITICAL["🔴 Critical (5)"]
            C1["Hardcoded JWT Secret"]
            C2["Plaintext Admin Password"]
            C3["SQL Injection"]
            C4["SSRF Attack"]
            C5["Token Type Confusion"]
        end

        subgraph HIGH["🟠 High (7)"]
            H1["No Rate Limiting"]
            H2["Missing CSP"]
            H3["No XSS Sanitization"]
            H4["Disabled CAPTCHA"]
            H5["Dev Endpoint in Prod"]
            H6["10MB Body Limit"]
            H7["No Auth Rate Limit"]
        end

        subgraph MEDIUM["🟡 Medium (6)"]
            M1["No HSTS"]
            M2["No Referrer-Policy"]
            M3["Long Admin Token"]
            M4["Permissive CORS"]
            M5["No Permissions-Policy"]
            M6["Fail-Open Socket"]
        end
    end

    style SECURITY fill:#0f172a,stroke:#ef4444,color:#e2e8f0
    style CRITICAL fill:#450a0a,stroke:#ef4444,color:#fecaca
    style HIGH fill:#451a03,stroke:#f59e0b,color:#fef3c7
    style MEDIUM fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
```

**All 21 vulnerabilities have been fixed.** See `docs/SECURITY_AUDIT.md` for full details.

---

## 7. Platform Statistics

| Metric | Count |
|--------|-------|
| HTML Pages | 26 |
| API Endpoints | 90+ |
| Database Tables | 13 |
| Controllers | 11 |
| Route Files | 10 |
| Security Fixes | 21 |
| Socket.IO Events | 10+ |
| Post Types | 5 |
| Reaction Types | 4 |
| Settings Tabs | 7 |
| Admin Sections | 10 |

---

## 8. Deployment Architecture

```mermaid
graph LR
    USER["🌐 User Browser"] --> CDN["☁️ Vercel CDN<br/>Frontend"]
    CDN --> RENDER["⚡ Render Server<br/>Express + Socket.IO"]
    RENDER --> SUPA_DB["🗄️ Supabase<br/>PostgreSQL"]
    RENDER --> GEM["🤖 Google<br/>Gemini API"]
    RENDER --> MAIL["📧 Brevo<br/>Email Service"]
    CDN --> CF_T["🛡️ Cloudflare<br/>Turnstile"]
    USER --> GOAUTH_D["🔑 Google<br/>OAuth"]
    GOAUTH_D --> SUPA_DB

    style USER fill:#6366f1,stroke:#4f46e5,color:#fff
    style CDN fill:#000,stroke:#fff,color:#fff
    style RENDER fill:#10b981,stroke:#059669,color:#fff
    style SUPA_DB fill:#3b82f6,stroke:#2563eb,color:#fff
    style GEM fill:#f59e0b,stroke:#d97706,color:#fff
    style MAIL fill:#ec4899,stroke:#db2777,color:#fff
    style CF_T fill:#f97316,stroke:#ea580c,color:#fff
    style GOAUTH_D fill:#ef4444,stroke:#dc2626,color:#fff
```

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | `projecthive-bd.vercel.app` | Static HTML/CSS/JS hosting |
| Backend | `projecthive-backend.onrender.com` | API + WebSocket server |
| Database | Supabase cloud | PostgreSQL with RLS |
| Dev Frontend | `localhost:3000` | Local development |
| Dev Backend | `localhost:5000` | Local development |

---

*ProjectHive — Connecting students, building futures.*
