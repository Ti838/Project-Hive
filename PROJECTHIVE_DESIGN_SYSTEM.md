# ProjectHive — Design System Specification

**Document Version:** 1.0.0  
**Phase:** Phase 1 Foundation  
**Execution Lead:** AGENT 3 (Product Design & Craft Specialist)  
**Aesthetic Benchmark:** Linear, Vercel, Slack, Notion, Clerk  

---

## 1. Visual Identity & Brand Philosophy

ProjectHive establishes a focused, premium, dark-mode-first academic collaboration environment. It avoids generic SaaS templates, excessive gradients, fake marketing claims, and gratuitous animations.

### 1.1 Color Tokens
- **Canvas / Background:** `#0B0F17` (Deep Obsidian / Dark Slate)
- **Primary Card Surface:** `#131B2E` (Deep Navy Slate with 1px border `#1E293B`)
- **Secondary Elevated Surface:** `#1E293B` (Slate Gray for popovers, dropdowns, and flyout drawers)
- **Primary Accent (Brand Glow):** `#F59E0B` (Amber / Golden Honeycomb)
- **Interactive Secondary:** `#6366F1` (Indigo / Electric Violet for buttons and highlights)
- **Success / Online State:** `#10B981` (Emerald Green)
- **Warning State:** `#F59E0B` (Amber Alert)
- **Danger / Destructive Action:** `#EF4444` (Crimson Red for remote session kill switch & account bans)
- **Text Primary:** `#F8FAFC` (Slate 50)
- **Text Secondary / Muted:** `#94A3B8` (Slate 400)
- **Text Disabled:** `#475569` (Slate 600)

### 1.2 Typography System
- **Font Family:** Inter / Plus Jakarta Sans, with fallback to system `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`.
- **Display Heading:** `text-3xl` to `text-5xl` font-bold tracking-tight text-white.
- **Section Heading:** `text-xl` to `text-2xl` font-semibold text-white.
- **Card Title:** `text-base` to `text-lg` font-medium text-slate-100.
- **Body Text:** `text-sm` leading-relaxed text-slate-300.
- **Caption / Meta:** `text-xs` font-medium text-slate-400.
- **Monospace Tokens:** `font-mono text-xs` for task IDs (`#TASK-102`), IP addresses, and audit hashes.

### 1.3 Elevation, Borders & Glassmorphism
- **Borders:** Subtle `1px solid #1E293B` applied consistently across all cards, modals, and drawers.
- **Shadows:** Soft ambient glow `shadow-lg shadow-black/40` avoiding harsh black outlines.
- **Radius Tokens:**
  - `rounded-lg` (8px): Form inputs, badges, and dropdown menu items.
  - `rounded-xl` (12px): Standard cards, task tiles, and video participant frames.
  - `rounded-2xl` (16px): Main dashboard widgets, modals, and split-screen auth containers.
  - `rounded-full`: Avatar circles, status indicator dots, and pill category chips.

### 1.4 Responsive Layout Architecture
Following Android Adaptive Layout & Modern Web standards:
- **Compact Viewport (< 640px / Mobile):** 
  - 5-tab thumb-friendly bottom navigation bar (`Home`, `Feed`, `Chat`, `Teams`, `Profile`).
  - Single-pane stack with slide-up bottom sheets for filters and applicant details.
  - Minimum touch target 48x48px on all action buttons.
- **Medium Viewport (640px - 1023px / Tablet):**
  - Collapsed icon-rail navigation maximizing horizontal canvas for task boards.
  - 2-column card layouts.
- **Expanded Viewport (>= 1024px / Desktop & Ultrawide):**
  - Persistent 240px left sidebar with active highlights.
  - 3-column dashboard layouts with integrated command palettes (`Cmd+K`).
  - Slide-out flyout drawers (420px width) for applicant vetting and user deep-inspection.

### 1.5 Motion & Micro-Interaction Principles
- Transition durations: `150ms - 200ms ease-out` for hover states and button presses.
- Modal / Drawer transitions: `250ms - 300ms cubic-bezier(0.16, 1, 0.3, 1)` for smooth slide-outs.
- Zero layout shift: Fixed aspect ratios on image containers and skeleton loaders.
