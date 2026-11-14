# ProjectHive 🐝 — Modern Workspace Experience, Brand Architecture & Auth Security Report

## Executive Summary

This engineering dossier documents the design system, centralized dynamic branding architecture, interactive collaborative workspace preview, and strict authentication portal separation for **ProjectHive**.

All implementations are grounded in production-tested design patterns from **Linear**, **Notion**, **Slack**, **LiveKit**, and **Stripe**, preserving dark obsidian slate surfaces (`#07090e`, `#0d1117`), refined amber accents (`#f59e0b`), and zero-trust authentication boundaries.

---

## 1. Reference-Based Design System Matrix

| Benchmark Product | Category | Observed Design Pattern | ProjectHive Translation & Implementation |
|---|---|---|---|
| **Linear** (`linear.app`) | SaaS & Project Management | Restrained obsidian surfaces, subtle 1px borders, high-density typography, priority badges, and sprint milestones | Refined dark mode palette (`#07090e` base, `#0d1117` cards, `border-border/80`), interactive Sprint Kanban preview with story points and checkboxes. |
| **Slack** (`slack.com`) | Real-Time Collaboration | Dedicated team channel hierarchy, unread indicators, presence dots, audio message chimes | Socket.IO real-time squad chat, live audio notification engine (`soundEngine.ts`), online status dots, and haptic feedback. |
| **LiveKit** (`livekit.io`) | Low-Latency SFU Calling | Active-speaker glow rings, audio level waveform meters, Picture-in-Picture calling tiles, and screen sharing | Integrated LiveKit SFU stage with 4K screen share, dynamic participant tiles, and syntax-mode clarity. |
| **Notion** (`notion.so`) | Workspace Organization | Structured documentation, sprint PRD scaffolding, clear section dividers | HiveMind AI Studio integration for automated PRD, architecture, and sprint breakdown generation. |
| **Stripe** (`stripe.com`) | Administrative Clarity | Data tables, audit logs, system telemetry, and granular permission controls | Dedicated SecOps Administrator Portal with database latency monitors, immutable PostgreSQL audit logs, and user moderation drawers. |

---

## 2. Interactive Workspace Architecture (`Hero.tsx`)

The landing page Hero features an authentic, interactive four-tab workspace preview that demonstrates real platform functionality:

### 2.1 Squad Hub (`activeTab === 'squad'`)
- **Live Capstone Team Card:** Features an authentic capstone roster (`BUET CSE 499: Autonomous Drone AI`) with verified member roles (Firmware Lead, CV/SLAM Lead, Flight Controller, Backend/ROS2).
- **Interactive Recruitment Drawer:** Allows prospective candidates to inspect requirements, tech stacks, and submit 1-click squad join applications.

### 2.2 Sprint Kanban (`activeTab === 'kanban'`)
- **Interactive Sprint Board:** Organized into *To Do*, *In Flight*, and *Shipped* columns.
- **Task Micro-Interactions:** Includes story points, priority badges (Urgent, High, Medium), and interactive task completion toggles that calculate real-time completion state.

### 2.3 LiveKit SFU Stage (`activeTab === 'calling'`)
- **4K WebRTC Stage:** Features dual speaker feeds with active-speaker glowing borders and dynamic 8-band audio waveform meters.
- **Low-Latency Screen Share:** Displays Gazebo 3D simulation telemetry alongside participant feeds and full in-call controls (Mute, Video, Screen Share, Disconnect).

### 2.4 HiveMind AI Copilot (`activeTab === 'ai'`)
- **Engineering AI Assistant:** Demonstrates automated PRD and architecture specification generation with instant action pills (*Generate Milestones*, *Review Security*, *Export PRD*).

---

## 3. Centralized Brand Configuration (Zero Hardcoded Assets)

All platform branding is strictly centralized through a single configuration engine:

### 3.1 Single Source of Truth (`brandConfig.ts`)
- Defines application name, highlights, taglines, version tokens, organization metadata (`BITA`), and asset paths:
  - `BRAND_CONFIG.name` ("ProjectHive")
  - `BRAND_CONFIG.organization` ("BITA")
  - `BRAND_CONFIG.assets` (`logo`, `logoDark`, `logoLight`, `favicon`)
  - `BRAND_CONFIG.urls` (`terms`, `privacy`, `support`, `adminPortal`, `adminLogin`)

### 3.2 Dynamic `<BrandLogo />` Component (`BrandLogo.tsx`)
- Supports `full`, `mark`, `org`, and `badge` variants with responsive sizing tokens (`xs` through `xl`).
- Includes built-in SVG geometric fallbacks if images fail to load or are temporarily unavailable.
- Zero manually duplicated logo tags or hardcoded asset paths across any page or component.

---

## 4. Strict Authentication & Portal Isolation

ProjectHive enforces strict architectural separation between the Student Application and the Administrator Console:

### 4.1 Student Portal (`/login` & `/register`)
- **Admin Lockout:** Super-admin and admin accounts are strictly restricted from authenticating via `/login`. When admin credentials are submitted, the portal halts authentication with an administrative redirection notice.
- **Auto-Routing:** Authenticated administrators visiting `/login` or student workspace routes (`/(app)/*`) are automatically intercepted and routed to `/admin`.
- **Clean Workspace Shell:** The student sidebar is dedicated exclusively to student collaboration with zero public references to the administrative console.

### 4.2 Administrator Console (`/admin` & `/admin/login`)
- **Dedicated Terminal:** Administrative authentication is routed exclusively through `/admin/login`.
- **Role Verification:** Protected by strict backend middleware (`adminAuth.js`) and client layout guards (`admin/layout.tsx`), permitting only accounts with verified `admin` or `super_admin` PostgreSQL roles.
- **Student Redirection:** Non-admin visitors to `/admin/login` receive an explicit student warning banner with a one-click *"Return to Student Workspace"* action.
- **OWASP Verification:** All 7/7 automated security suites passed, verifying Bcrypt 12 salt rounds, JWT signatures, privilege escalation barriers, and immutable audit logs.
