# PROJECTHIVE: EXISTING UX FORENSIC AUDIT

**Audit Date:** November 2026  
**Auditor:** Principal UX Architect & Senior Systems Engineer  
**Scope:** Landing Page (`/`), Authentication Pages (`/login`, `/register`), Legal Pages (`/terms`, `/privacy`)

---

## 1. Executive Forensic Findings

A forensic review of the existing ProjectHive public-facing pages revealed multiple critical UX and structural defects. While the foundational design intent was modern, practical execution suffered from **unverified marketing claims, auth layout shifts, and missing in-flow legal document modals**.

| Defect ID | Category | Location | Severity | Description |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | Auth Stability | `/login` $\leftrightarrow$ `/register` | **HIGH** | Vertical coordinate jumping when toggling between Sign In and Sign Up due to dynamic `items-center` parent centering on unequal content heights. |
| **DEF-02** | Content Integrity | Landing Page (`Hero.tsx`, `CTA.tsx`) | **CRITICAL** | Unverified metrics ("1,200+ Innovators", "50+ Squads", "+2,400 Students") without empirical backing in the database. |
| **DEF-03** | Content Integrity | `Testimonials.tsx` | **CRITICAL** | Fabricated student testimonials ("Ayesha Rahman", "Marcus Vance", "Tanvir Ahmed") claiming fictitious capstone expo awards and star ratings. |
| **DEF-04** | Legal Workflow | `/register` | **HIGH** | Terms & Conditions and Privacy Policy links opened separate browser tabs (`target="_blank"`), abandoning the user's registration form state. |
| **DEF-05** | Viewport Overflow | `globals.css` | **MEDIUM** | Fixed `width: 100vw` on `.bg-noise` caused horizontal scrolling on viewports where scrollbar dimensions are accounted for. |
| **DEF-06** | Mobile Grid Squeeze | `Showcase.tsx` & `BentoGrid.tsx` | **MEDIUM** | 3-column Kanban and calling grids compressed down to 90px on 360px mobile viewports, making badges and text unreadable. |
| **DEF-07** | Button Stacking | `BentoGrid.tsx` (Card 6) | **MEDIUM** | Dual action buttons exceeded available card width on 360px/375px mobile screens, causing button text clipping. |

---

## 2. Root Cause Analysis

### 2.1 The Authentication "Page Jump" Defect (DEF-01)
* **Root Cause:** Both `/login` and `/register` utilized a full-height flex container:
  ```tsx
  <div className="flex-1 flex w-full max-w-6xl mx-auto items-center justify-center p-4 sm:p-6 lg:p-8">
  ```
  Because the Registration form contains 8 inputs plus a terms checkbox (~680px height), while the Login form contains only 2 inputs (~440px height), the `items-center` flexbox calculation placed the top of the Login card at a substantially lower vertical position than the Registration card. 
* **User Impact:** When a user clicked "Create Account" from the Login page or "Sign In" from the Register page, the entire card violently shifted vertically on the display, degrading perceived quality.
* **Remediation:** Anchor the container to a stabilized top offset (`py-8 sm:py-12`) with a uniform min-height baseline on the left branding column, ensuring the card's top edge, tabs, and headers stay at the exact same vertical pixel coordinates.

### 2.2 Unverified Data & Fabricated Testimonials (DEF-02, DEF-03)
* **Root Cause:** Placeholder marketing copy was carried over during initial prototyping.
* **User Impact:** Misleads university students and institutional partners; violates authenticity and enterprise compliance requirements.
* **Remediation:** 
  1. Purge all fabricated quotes and ratings from `Testimonials.tsx`.
  2. Replace `Testimonials.tsx` with an authentic, verification-backed **University Collaboration Lifecycle** component showing genuine platform stages (Profile Setup $\to$ Teammate Matchmaking $\to$ Live SFU Collaboration $\to$ Verified Project Showcase).
  3. Replace artificial counts in `Hero.tsx` and `CTA.tsx` with verifiable architectural specifications (e.g., PostgreSQL Zero-Trust RLS across 34 tables, LiveKit SFU edge streaming, Socket.IO 4.x sub-50ms dispatch, Groq + Gemini AI copilot).

### 2.3 Registration Legal Consent & Missing Modals (DEF-04)
* **Root Cause:** Registration form used standard anchor tags (`<Link href="/terms" target="_blank">`) instead of accessible modal dialogs.
* **User Impact:** Students who wanted to verify data privacy or code ownership rights were kicked out of the registration funnel into a new tab, increasing registration drop-off.
* **Remediation:**
  1. Build a high-grade accessible `LegalModal` component supporting separate "Terms of Service" and "Privacy Policy" views.
  2. Maintain single source of truth for legal text via shared components (`TermsContent.tsx` and `PrivacyContent.tsx`) so `/terms` and `/privacy` standalone pages remain fully functional and 100% in sync.
  3. Ensure explicit consent: viewing the modal never auto-checks the acceptance box; consent remains strictly opt-in.

---

## 3. Forensic Remediation Plan

1. **Phase 1: Legal Content Modularization:** Extract legal text into reusable modules; build `LegalModal`.
2. **Phase 2: Authentication Stability:** Unify container geometry, top anchoring, and identical branding columns between `/login` and `/register`.
3. **Phase 3: Landing Page Authenticity Overhaul:** Replace unverified metrics with real technical specs; replace fake testimonials with authentic collaboration lifecycle architecture.
4. **Phase 4: Responsive Verification:** Test at 1920px, 1440px, 1024px, 768px, 430px, 390px, 375px, and 360px widths.

