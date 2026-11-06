# 03: TECHNOLOGY STACK & DEPENDENCY INTELLIGENCE

> **Document Classification:** Comprehensive Dependency Audit & Runtime Specification  
> **Target Manifests:** `package.json`, `frontend/package.json`, `server/package.json`  
> **Extraction Evidence Level:** `[VERIFIED]` Package Manifest & Lockfile Analysis  

---

## 1. System-Wide Runtime & Engine Matrix

| Layer | Technology | Version / Spec | Purpose & Runtime Role | Evidence |
|---|---|---|---|---|
| **Root Runtime** | Node.js | `>= 18.0.0` (v20+ recommended) | Cross-platform JavaScript runtime powering both Next.js SSR/Edge and Express backend. | `server/package.json:engines` |
| **Package Manager** | npm | `v10+` | Monorepo dependency resolution using dedicated package-locks. | Root & subfolder `package-lock.json` |
| **Frontend Framework** | Next.js | `16.3.3` | React full-stack framework with Turbopack bundler and App Router. | `frontend/package.json` |
| **UI Library** | React | `19.2.8` | Component rendering engine utilizing React 19 concurrent features. | `frontend/package.json` |
| **Backend Framework** | Express.js | `4.18.2` | Minimalist web gateway managing REST API routing and middleware. | `server/package.json` |
| **Real-Time Engine** | Socket.IO | `4.7.2` (Server) / `4.8.3` (Client) | Bi-directional, low-latency WebSocket communication. | `server/package.json`, `frontend/package.json` |
| **Database Engine** | Supabase (PostgreSQL) | PostgreSQL 15+ (`@supabase/supabase-js: 2.108.1`) | Managed relational database, Row Level Security, and object storage. | `server/package.json`, `server/config/supabase.js` |
| **Media Server (SFU)** | LiveKit Cloud | Server SDK `2.18.0` / Client SDK `2.22.2` | WebRTC Selective Forwarding Unit for multi-participant audio/video calling. | `server/package.json`, `frontend/package.json` |
| **Styling & Design** | Tailwind CSS | `v4` (`@tailwindcss/postcss: ^4`) | Modern utility-first CSS framework with native CSS variables. | `frontend/package.json`, `frontend/postcss.config.mjs` |

---

## 2. Frontend Dependency Catalog (`frontend/package.json`)

### 2.1 Production Dependencies

| Package Name | Version | Architecture Domain | Exact Operational Purpose in ProjectHive |
|---|---|---|---|
| `next` | `16.3.3` | Client Framework | Drives App Router, Turbopack builds, SSR pre-rendering, and image optimization. |
| `react` | `19.2.8` | UI Library | Core component rendering engine, React 19 `use()` hook for async params. |
| `react-dom` | `19.2.8` | DOM Renderer | React DOM mounting and event delegation. |
| `livekit-client` | `^2.22.2` | Real-Time Media | Manages WebRTC peer connections, room subscriptions, local media publication, and audio/video track lifecycle. |
| `socket.io-client` | `^4.8.3` | WebSocket Client | Connects to Render backend WebSocket server; handles chat messaging, presence, and whiteboard synchronization. |
| `zustand` | `^5.0.15` | Global State Management | Lightweight state stores: `useAuthStore` (auth/tokens), `useSocketStore` (presence), `useUIStore` (sidebar/drawers), `useCallStore` (calling). |
| `framer-motion` | `^13.1.1` | Animation Engine | Drives modal enter/exit animations, page transitions, sliding drawers, and hover physics. |
| `gsap` | `^3.15.0` | High-Performance Animation | Powers cinematic timeline animations on the landing page (`Hero.tsx`, `Workflow.tsx`). |
| `@gsap/react` | `^2.1.2` | Animation Interop | Safe React lifecycle integration for GSAP animations. |
| `three` | `^0.186.0` | 3D Graphics | WebGL rendering library powering the landing page 3D showcase canvas. |
| `@react-three/fiber` | `^9.7.0` | 3D React Reconciler | Declarative React wrapper around Three.js scene graphs. |
| `@react-three/drei` | `^10.7.8` | 3D Helpers | Camera controls, environment lighting, and geometric helpers for React Three Fiber. |
| `lenis` | `^1.3.26` | Scroll Physics | Smooth inertial scrolling engine for landing page storytelling (`SmoothScroll.tsx`). |
| `lucide-react` | `^1.37.0` | Iconography | Primary iconography system across all student and admin views. |
| `react-hook-form` | `^7.87.0` | Form Management | High-performance uncontrolled form handling with state subscription. |
| `@hookform/resolvers` | `^5.9.1` | Form Validation | Connects Zod validation schemas to `react-hook-form`. |
| `zod` | `^4.5.4` | Schema Validation | Type-safe runtime schema definitions for login, registration, and profile edits. |
| `clsx` | `^2.1.1` | Class Utility | Conditional CSS class string composition. |
| `tailwind-merge` | `^3.6.0` | Class Deduplication | Resolves Tailwind CSS class conflicts safely (`cn()` utility). |
| `date-fns` | `^4.4.0` | Date Arithmetic | Relative timestamp formatting and time calculations. |
| `tailwindcss` | `^4` | Design Engine | Next-generation Tailwind CSS v4 engine. |
| `@tailwindcss/postcss`| `^4` | PostCSS Plugin | Integrates Tailwind CSS v4 into Next.js PostCSS build pipeline. |

### 2.2 Developer Dependencies

| Package Name | Version | Operational Purpose |
|---|---|---|
| `typescript` | `^5` | Type-safety, compilation checks, and IDE autocomplete. |
| `@types/node` | `^20` | TypeScript definitions for Node.js APIs. |
| `@types/react` | `^19` | TypeScript declarations for React 19. |
| `@types/react-dom` | `^19` | TypeScript declarations for React DOM 19. |
| `eslint` | `^9` | Code linting and style enforcement. |
| `eslint-config-next` | `16.3.3` | Next.js-recommended ESLint rules. |

---

## 3. Backend Dependency Catalog (`server/package.json`)

### 3.1 Production Dependencies

| Package Name | Version | Security & Architecture Domain | Operational Purpose in ProjectHive |
|---|---|---|---|
| `express` | `^4.18.2` | HTTP Gateway | REST API routing, request/response lifecycle, and middleware chaining. |
| `socket.io` | `^4.7.2` | Real-Time WebSocket | Stateful WebSocket hub managing rooms, typing indicators, read receipts, and direct dual-dispatch. |
| `@supabase/supabase-js` | `^2.108.1` | Database & Storage Client | Supabase PostgreSQL client executing queries via PostgREST and managing S3-compatible storage buckets. |
| `livekit-server-sdk` | `^2.18.0` | WebRTC Media Token Issuer | Mints cryptographically signed JWT video grants with explicit room permissions. |
| `@google/generative-ai` | `^0.21.0` | Multimodal AI Inference | Official SDK for Google Gemini 2.0 Flash text and vision models (`server/config/gemini.js`). |
| `jsonwebtoken` | `^9.0.0` | Cryptographic Tokens | Issues and verifies HS256/RS256 JWT access and refresh tokens. |
| `bcryptjs` | `^2.4.3` | Password Hashing | 12-round salted password hashing for student accounts. |
| `helmet` | `^7.1.0` | HTTP Header Hardening | Enforces Content Security Policy (CSP), HSTS, frame-ancestors, and XSS protection headers. |
| `cors` | `^2.8.5` | Origin Whitelisting | Enforces strict CORS policy allowing only authorized origins and Vercel edge domains. |
| `express-rate-limit` | `^7.1.5` | Abuse & DoS Protection | Enforces sliding-window rate limits (100 req/15m globally, 20 attempts/15m on auth endpoints). |
| `cookie-parser` | `^1.4.7` | Cookie Parsing | Parses incoming request cookies for session credentials. |
| `nodemailer` | `^8.0.11` | Transactional Mail | Sends verification and password reset emails via SMTP. |
| `morgan` | `^1.10.0` | HTTP Access Logging | Combined format request logging for diagnostic tracing. |
| `dotenv` | `^16.3.1` | Environment Loader | Loads configuration keys from `.env` files into `process.env`. |
| `ioredis` | `^5.3.2` | Redis Client | Connects to Upstash Redis for distributed state management. |
| `@socket.io/redis-adapter` | `^8.1.2` | Cluster WebSocket Adapter | Enables multi-instance horizontal scaling of Socket.IO servers via Redis pub/sub. |

### 3.2 Backend Developer Dependencies

| Package Name | Version | Operational Purpose |
|---|---|---|
| `eslint` | `^8.55.0` | Backend code quality linting. |

---

## 4. External Cloud Services & APIs

| Cloud Service | Provider | Plan / Tier | Integration Mechanism | Authentication Method |
|---|---|---|---|---|
| **PostgreSQL Database** | Supabase | Free Tier (Singapore `ap-southeast-1`) | `@supabase/supabase-js` client | Supabase Anon Key & Service Role JWT |
| **Object Storage** | Supabase Storage | Free Tier (500 MB) | S3-compatible REST API | Service Role Key |
| **WebRTC Media SFU** | LiveKit Cloud | Cloud Free (Project `project-hive-o0q9p17e`) | `livekit-client` / `livekit-server-sdk` | HMAC API Key & Secret |
| **Ultra-Fast LLM Inference** | Groq Cloud | Free Developer Tier | OpenAI-compatible HTTPS REST API | Groq API Bearer Key |
| **Vision & Multimodal AI** | Google AI Studio | Free Tier (Gemini 2.0 Flash) | `@google/generative-ai` SDK / HTTPS REST | Google Gemini API Key |
| **Failover AI Router** | OpenRouter | Free Tier (`openrouter/free`) | OpenAI-compatible HTTPS REST API | OpenRouter API Key |
| **Transactional Email** | Brevo (Sendinblue) | Free Tier (300 emails/day) | Brevo HTTP REST v3 API & SMTP | Brevo API Key (`xkeysib-...`) |
| **Code Collaboration** | GitHub REST API | Public API / Personal Access Token | Octokit / Node.js HTTPS Fetch | GitHub Fine-Grained Token / PAT |
| **Bot Mitigation** | Cloudflare Turnstile | Free Tier | Client widget + server-side siteverify | Turnstile Secret Key |
| **STUN/TURN Relays** | Metered.ca & Google | Free Community Relay | RFC 5766 TURN over UDP/TCP/TLS | Ephemeral HMAC Credentials |

