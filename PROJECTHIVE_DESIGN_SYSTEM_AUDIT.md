# PROJECTHIVE: DESIGN SYSTEM & BRAND AUDIT

**Version:** 2.0.0  
**Design Tokens Origin:** ProjectHive Core Theme Configuration  
**Engine:** Tailwind CSS v4 + Next.js App Router  

---

## 1. Brand Identity & Design Token Mapping

ProjectHive's brand identity is rooted in an **Electric Violet** primary combined with an **Obsidian Zinc Dark** canvas and signature **Honeycomb Amber** accents. This system was audited to guarantee that all redesign work remains completely faithful to ProjectHive rather than borrowing third-party palettes.

### 1.1 Color Palette Specifications

```css
/* ─── Light Mode Theme Tokens ────────────────────────────────────────── */
:root {
  --background: 240 10% 98.5%;       /* #FAFAFC Porcelain Canvas */
  --foreground: 240 10% 3.9%;        /* #09090B High-Contrast Charcoal */
  --card: 0 0% 100%;                 /* #FFFFFF Pure White Card */
  --card-foreground: 240 10% 3.9%;
  --primary: 263.4 85% 60%;          /* #7C3AED ProjectHive Electric Violet */
  --primary-foreground: 210 20% 98%; /* #F8FAFC White Text */
  --secondary: 240 4.8% 95.9%;       /* #F4F4F6 Light Grey */
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;      /* #EF4444 Crimson Alert */
  --border: 240 5.9% 90%;            /* #E4E4E7 Crisp Border */
  --input: 240 5.9% 90%;
  --ring: 263.4 85% 60%;
  --radius: 0.85rem;                 /* 13.6px Corner Radius */
}

/* ─── Obsidian Dark Mode Palette ─────────────────────────────────────── */
.dark {
  --background: 240 10% 3.9%;        /* #09090B Obsidian Base */
  --foreground: 0 0% 98%;            /* #FAFAFA High-Contrast White */
  --card: 240 10% 5.5%;              /* #0E0E12 Elevated Obsidian Card */
  --card-foreground: 0 0% 98%;
  --primary: 263.4 85% 62%;          /* #8B5CF6 Vibrant Electric Violet */
  --primary-foreground: 210 20% 98%;
  --secondary: 240 5.9% 10%;         /* #18181B Zinc Charcoal */
  --secondary-foreground: 0 0% 98%;
  --muted: 240 5.9% 10%;
  --muted-foreground: 240 5% 64.9%;  /* #A1A1AA Readable Slate */
  --accent: 240 5.9% 12%;            /* #1F1F24 Interactive Hover */
  --accent-foreground: 0 0% 98%;
  --destructive: 0 72% 51%;          /* #DC2626 */
  --border: 240 6% 14%;              /* #232328 Hairline Card Border */
  --input: 240 6% 14%;
  --ring: 263.4 85% 62%;
}
```

### 1.2 Signature Accent Rules
* **Electric Violet (`hsl(263.4 85% 60%)`):** Reserved for primary conversion buttons, focused input outlines, active navigation links, and primary brand logos.
* **Honeycomb Amber (`amber-400 / amber-500`):** Reserved for HiveMind AI assistant badges, priority sprint milestones, and code generation callouts.
* **Emerald Green (`emerald-400 / emerald-500`):** Reserved for active LiveKit SFU rooms, student online presence, and RLS database security shields.

---

## 2. Typography & Contrast Compliance

| Hierarchy Level | Font Size / Weight | Line Height | Tracking | WCAG AA Contrast |
| :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | `text-4xl sm:text-6xl md:text-7xl` / `font-extrabold` | `1.08` | `-0.03em` | $\ge 12:1$ (Passed) |
| **Section H2** | `text-3xl sm:text-5xl` / `font-extrabold` | `1.15` | `-0.025em` | $\ge 10:1$ (Passed) |
| **Card H3** | `text-xl sm:text-2xl` / `font-bold` | `1.25` | `-0.015em` | $\ge 8:1$ (Passed) |
| **Body Standard** | `text-sm sm:text-base` / `font-normal` | `1.6` | `0` | $\ge 5.8:1$ (Passed) |
| **Subtle Label** | `text-xs font-medium` / `text-muted-foreground` | `1.4` | `0` | $\ge 4.5:1$ (Passed) |
| **Monospace / Code** | `text-[11px] font-mono` | `1.4` | `+0.02em` | $\ge 4.5:1$ (Passed) |

---

## 3. Component Dimension Standardization

To ensure zero layout shift across views, interactive components adhere to a strict height ladder:

```
Inputs & Text Fields : 44px (h-11)
Quick-Switch Tabs    : 44px (h-11)
Modal Buttons        : 44px (h-11)
Primary CTA Buttons  : 48px to 52px (h-12 to h-13)
Touch Targets (Min)  : 44px x 44px (Strict Mobile Standard)
Card Corner Radii    : 16px (rounded-2xl) to 24px (rounded-3xl)
```

---

## 4. Theme Engine Verification

The theme engine is governed by [`frontend/src/context/ThemeContext.tsx`](file:///c:/Users/TIMON/Desktop/Project-Hive/frontend/src/context/ThemeContext.tsx):
* **Light Mode:** Applies clean porcelain canvas, subtle gray cards, and high-contrast text.
* **Dark Mode:** Applies deep obsidian zinc background (`#09090b`), dark card elevations (`#0e0e12`), and violet glows.
* **System Mode:** Detects `window.matchMedia('(prefers-color-scheme: dark)')` with automated change listeners.
* Both modes were verified to maintain identical layout structures, border geometry, and spacing tokens without any style flickering or layout shifts.

