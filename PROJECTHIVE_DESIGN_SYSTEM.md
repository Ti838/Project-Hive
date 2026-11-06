# PROJECTHIVE: HYBRID PREMIUM DESIGN SYSTEM SPECIFICATION

This document details the complete design tokens, component primitives, interaction guidelines, and responsive rules governing **ProjectHive's Public Landing Page and Authentication System**.

---

## 1. Design Philosophy: "Hybrid Premium"

ProjectHive's visual identity unites three distinct design philosophies:
1. **Linear's Craft & Precision:** Razor-sharp hairline borders, dark-mode-first aesthetic, reserved chromatic accents, and tight tracking.
2. **Clerk & WorkOS Ergonomics:** Frictionless authentication forms, split-screen balance, clear inline validation, and transparent security cues.
3. **Notion's Honest Information Architecture:** Authentic feature demonstrations, clear typographic contrast, and clean layout whitespace.

---

## 2. Core Tokens & CSS Variables

```css
:root {
  /* Canvas & Base Surfaces */
  --color-canvas-dark: #08090a;
  --color-canvas-navy: #0b0f19;
  --color-card-dark: #101827;
  --color-surface-elevated: #161f33;

  /* Chromatic Brand Accents */
  --color-brand-violet: #6366f1;
  --color-brand-blue: #38bdf8;
  --color-brand-primary: #6558e8;
  --color-brand-secondary: #4c9aff;

  /* Status Colors */
  --color-status-success: #10b981;
  --color-status-warning: #f59e0b;
  --color-status-error: #ef4444;

  /* Typography Colors */
  --color-text-primary: #ffffff;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;

  /* Hairlines & Borders */
  --color-border-subtle: rgba(255, 255, 255, 0.08);
  --color-border-focus: rgba(99, 102, 241, 0.6);
}
```

---

## 3. Typography Hierarchy

| Style Role | Font Family | Size (px / rem) | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Inter Variable | 88px / 5.5rem | `800` (ExtraBold) | `1.05` | `-0.04em` |
| **Section Title** | Inter Variable | 36px / 2.25rem | `700` (Bold) | `1.2` | `-0.02em` |
| **Card Heading** | Inter Variable | 18px / 1.125rem | `600` (SemiBold) | `1.3` | `-0.01em` |
| **Body Large** | Inter Variable | 16px / 1.0rem | `400` (Regular) | `1.6` | `normal` |
| **Body Small** | Inter Variable | 14px / 0.875rem | `400` (Regular) | `1.5` | `normal` |
| **Caption / Badge** | Inter Variable | 11px / 0.6875rem | `700` (Bold) | `1.4` | `+0.08em` |

---

## 4. Component Primitives

### 4.1 Input Fields
- **Container Height:** `44px` (`h-11`)
- **Corner Radius:** `12px` (`rounded-xl`)
- **Padding:** `0 14px` (`px-3.5`)
- **Background:** `bg-muted/60`
- **Border:** `1px solid border-border/80`
- **Focus State:** `focus:border-primary focus:bg-background outline-none`
- **Error State:** `border-destructive text-destructive`

### 4.2 Buttons
- **Primary Action Button:**
  - Background: Brand gradient or high-contrast foreground (`bg-primary` / `bg-foreground`)
  - Text: High-contrast white or dark background (`font-semibold text-sm`)
  - Radius: `12px` or `9999px` (Pill for hero CTAs)
  - Height: `44px` (`h-11`) or `56px` (`h-14` for Hero CTA)
  - Micro-Interaction: `active:scale-[0.98] transition-all duration-200`
- **Secondary Action Button:**
  - Background: Semi-transparent backdrop (`bg-secondary` or `bg-card border border-border/80`)
  - Hover: `hover:bg-accent/60`
- **Social OAuth Button (Google):**
  - Official Google SVG emblem
  - Clear label: *"Continue with Google"* / *"Sign up with Google"*
  - Disabled state during active PKCE handshake with animated spinner.

### 4.3 Cards & Containers
- **Corner Radius:** `24px` (`rounded-3xl`) for outer auth split cards; `16px` (`rounded-2xl`) for inner feature blocks.
- **Glassmorphism:** `backdrop-blur-xl` combined with `bg-card/60`.
- **Borders:** Thin hairlines (`border border-border/80`).

---

## 5. Responsive Layout Breakpoints

- **Mobile Viewport (`< 640px`):**
  - Full-width stacked single-column layouts.
  - Auth split screen collapses the left branding panel completely, displaying only the form.
  - Minimum 44px touch targets on all interactive buttons and inputs.
- **Tablet Viewport (`640px - 1023px`):**
  - Centered auth card containers (max-width: 540px).
  - Navigation bar displays hamburger drawer trigger.
- **Desktop Viewport (`>= 1024px`):**
  - 12-column grid system (`grid-cols-12`).
  - Left branding panel (5 columns) + Right auth form panel (7 columns).
  - Parallax depth effects and ambient radial glow active.

---

*This document defines the production design standard for ProjectHive's landing and authentication interfaces.*

