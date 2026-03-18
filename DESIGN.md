# EASI Leaderboard — Design System

An editorial, indigo-accented design language for spatial intelligence benchmark presentation.

---

## Design Philosophy

**"Rigorous data, editorial grace."**

See [DESIGN_PHILOSOPHY.md](./DESIGN_PHILOSOPHY.md) for the full artistic direction.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Data First** | The leaderboard and benchmarks are the product — design serves them |
| **Editorial Warmth** | Soft shadows, rounded corners, serif headings — not cold or clinical |
| **Single Accent** | Indigo dominates; other colors are functional (capability tints, rank medals) |
| **Static & Fast** | Full static export, no runtime server, sub-second page loads |
| **Accessible** | WCAG AA contrast, reduced-motion support, keyboard navigable |

---

## Color System

### Primary Palette

| Role | Name | HEX | Usage |
|------|------|-----|-------|
| **Background** | Lavender Wash | `#faf9fc` | Page background, alternating sections |
| **Surface** | White | `#ffffff` | Cards, tables, stats bar |
| **Primary** | Indigo | `#6366f1` | Accent, CTAs, active states, badges |
| **Text** | Deep Navy | `#1e1b4b` | Headings, body text, navigation |
| **Text Secondary** | Muted Plum | `#7c7a9a` | Descriptions, secondary labels |
| **Text Muted** | Light Plum | `#a5a3c2` | Tertiary text, timestamps |
| **Border** | Lavender Gray | `#e5e2f0` | Card borders, dividers |
| **Border Emphasis** | Warm Gray | `#d4d1e5` | Hover borders |

### Derived / Transparent

| Token | Value | Usage |
|-------|-------|-------|
| `primary-light` | `rgba(99,102,241, 0.06)` | Hover backgrounds, badge fills |
| `primary-muted` | `rgba(99,102,241, 0.12)` | Pill badge borders, selection |
| `nav` | `#1e1b4b` | Navigation active pill, CTA fill |

### Capability Tint Palette

Each of the six spatial capabilities has a unique color for its badge and card accent border:

| Capability | Color | HEX | Bg (8%) | Border (35%) |
|------------|-------|-----|---------|---------------|
| MM — Metric Measurement | Indigo | `#4f46e5` | `rgba(79,70,229, 0.08)` | `rgba(79,70,229, 0.35)` |
| MR — Mental Reconstruction | Violet | `#7c3aed` | `rgba(124,58,237, 0.08)` | `rgba(124,58,237, 0.35)` |
| SR — Spatial Relations | Blue | `#2563eb` | `rgba(37,99,235, 0.08)` | `rgba(37,99,235, 0.35)` |
| PT — Perspective-taking | Amber | `#d97706` | `rgba(217,119,6, 0.08)` | `rgba(217,119,6, 0.35)` |
| DA — Deformation & Assembly | Emerald | `#059669` | `rgba(5,150,105, 0.08)` | `rgba(5,150,105, 0.35)` |
| CR — Comprehensive Reasoning | Rose | `#e11d48` | `rgba(225,29,72, 0.08)` | `rgba(225,29,72, 0.35)` |

### Rank Colors

| Rank | Token | HEX |
|------|-------|-----|
| Gold (1st) | `lb-gold` | `#a16207` |
| Silver (2nd) | `lb-silver` | `#7c7a9a` |
| Bronze (3rd) | `lb-bronze` | `#9a3412` |
| Best in column | `lb-best` | `#059669` |

---

## Typography

### Font Stack

| Role | Family | Weights | Source |
|------|--------|---------|--------|
| **Headings / Display** | Fraunces (opsz 9–144) | 400, 500, 600, 700 | Google Fonts |
| **Body / UI** | DM Sans | 400, 500, 600, 700 | Google Fonts |
| **Code / Metrics** | IBM Plex Mono | 400, 500, 600 | Google Fonts |

### Type Scale (Tailwind tokens)

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `display` | 3rem | 1.1 | Hero "EASI" title |
| `heading` | 2rem | 1.2 | Section headings |
| `subheading` | 1.5rem | 1.3 | Sub-section headings, citation header |
| `body` | 1.125rem | 1.6 | Paragraphs, descriptions |
| `caption` | 1rem | 1.5 | Card titles, labels |

### Text Treatments

| Type | Style |
|------|-------|
| Hero title | Fraunces, `clamp(3rem, 8vw, 5.5rem)`, bold, deep navy |
| Section headings | Fraunces, `text-heading`, semibold, centered |
| Body text | DM Sans, `text-body`, secondary color, relaxed leading |
| Stat numbers | Fraunces, `text-2xl md:text-3xl`, bold, indigo |
| Stat labels | DM Sans, `text-xs`, semibold, uppercase, widest tracking, muted |
| Metric badges | IBM Plex Mono, `text-xs`, indigo on primary-light pill |
| BibTeX | IBM Plex Mono, `text-xs`, full-width pre block |

---

## Spacing & Layout

### Spacing Scale (Tailwind tokens)

| Token | Value | Pixels |
|-------|-------|--------|
| `xs` | 0.25rem | 4px |
| `sm` | 0.5rem | 8px |
| `md` | 1rem | 16px |
| `lg` | 2rem | 32px |
| `xl` | 4rem | 64px |

### Container Widths

| Context | Max Width | Usage |
|---------|-----------|-------|
| Landing page | `max-w-4xl` (56rem) | Hero section |
| Landing sections | `max-w-5xl` (64rem) | Capabilities, benchmarks |
| Citation / Links | `max-w-3xl` (48rem) | Narrower reading width |
| Leaderboard | `max-w-7xl` (80rem) | Full data table |

### Section Padding

| Section | Vertical Padding |
|---------|-----------------|
| Hero | `pt-16 pb-20` |
| Stats Bar | `py-8` |
| Content sections | `py-16` |
| Links footer | `py-12` |
| Site footer | `py-lg` (2rem) |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6px | Small badges, metric pills |
| `DEFAULT` / `md` | 10px | Cards, inputs |
| `lg` | 14px | Large cards, modals |
| `xl` | 18px | Hero elements |
| `full` | 9999px | Pill badges, rounded buttons |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)` | Default card rest state |
| `md` | `0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` | Hover lift, emphasis |
| `lg` | `0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)` | Prominent cards |

---

## Motion System

### Animations

| Name | Keyframes | Duration | Easing |
|------|-----------|----------|--------|
| `fadeInUp` | opacity 0→1, translateY 10px→0 | 450ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `barGrow` | width 0→auto | 700ms | `cubic-bezier(0.16, 1, 0.3, 1)` |

### Stagger Delays

```css
.stagger-1 { animation-delay: 50ms; }
.stagger-2 { animation-delay: 100ms; }
.stagger-3 { animation-delay: 150ms; }
.stagger-4 { animation-delay: 200ms; }
.stagger-5 { animation-delay: 250ms; }
.stagger-6 { animation-delay: 300ms; }
.stagger-7 { animation-delay: 350ms; }
.stagger-8 { animation-delay: 400ms; }
```

### Scroll Reveal (Landing Page)

Implemented via `IntersectionObserver` in `LandingPage.tsx`:
- **Threshold**: 15% visibility triggers reveal
- **Effect**: `opacity-0 translate-y-4` → `opacity-100 translate-y-0`
- **Duration**: 700ms with `ease-out`
- **Child stagger**: Capability cards 80ms apart, benchmark cards 60ms apart
- **One-shot**: Observer disconnects after first intersection

### Hover / Interaction

| Element | Effect | Duration |
|---------|--------|----------|
| Cards | Shadow increase (`shadow-sm` → `shadow-md`) | 150ms |
| Nav links | Background + text color shift | 150ms |
| CTA buttons | Opacity fade to 90% | 150ms |
| Link cards | Border emphasis + shadow + text color | 150ms |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

The `useReveal` hook also checks `prefers-reduced-motion` and sets `visible: true` immediately if the user prefers reduced motion.

---

## Component Patterns

### Pill Badge (Hero)

```
rounded-full · px-4 py-1.5 · text-xs · font-semibold
tracking-widest · uppercase · indigo text on primary-light bg
border primary-muted
```

### Capability Card

```
bg-surface · border border-lb-border · rounded-lg · shadow-sm · p-5
border-top: 2px solid [capability color]
┌──────────────────────────┐
│ [48×48 abbr badge]  Title │
│                           │
│ Description text          │
└──────────────────────────┘
```

### Benchmark Card

```
bg-lb-bg · border border-lb-border · rounded-lg · p-4
hover:shadow-md
┌──────────────────────────┐
│ Name            [metric] │
│ Focus area description   │
└──────────────────────────┘
```

### Stat Item

```
text-center
Number: font-heading · text-2xl md:text-3xl · bold · indigo
Label:  text-xs · semibold · uppercase · tracking-widest · muted
```

### Link Card

```
flex items-center gap-2 · px-5 py-3
bg-lb-bg · border border-lb-border · rounded-lg
hover: border-emphasis + shadow-md + text color shift
[icon] Label →
```

---

## File Structure

```
src/
├── app/
│   ├── globals.css          # Animations, base resets, scrollbar, focus
│   ├── layout.tsx           # Root layout with fonts, header, footer
│   ├── page.tsx             # Landing page (renders LandingPage component)
│   ├── leaderboard/
│   │   └── page.tsx         # Leaderboard table
│   └── submit/
│       └── page.tsx         # Model submission form
├── components/
│   ├── Header.tsx           # Site nav: logo → /, Leaderboard, Submit
│   ├── Footer.tsx           # Site footer
│   └── LandingPage.tsx      # Full landing page (client component)
├── lib/
│   ├── constants.ts         # BENCHMARKS, CAPABILITIES, model types
│   ├── filters.ts           # Leaderboard filter logic
│   ├── site.ts              # Site metadata constants
│   └── types.ts             # TypeScript interfaces
├── tailwind.config.ts       # Design tokens (colors, fonts, spacing, shadows)
└── postcss.config.mjs
```

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | Deep navy on lavender/white — WCAG AA+ |
| Focus visible | `2px solid #6366f1`, `outline-offset: 2px` |
| Reduced motion | All animations and transitions disabled |
| Semantic HTML | `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>` |
| Keyboard nav | All links, buttons, and interactive elements focusable |

---

## Do's and Don'ts

### Do

- Use Fraunces for display text and DM Sans for body
- Keep capability colors at low opacity (8% bg, 35% border)
- Use indigo as the single dominant accent
- Maintain generous section spacing (py-16 minimum)
- Test scroll animations with reduced-motion enabled

### Don't

- Use more than one accent color per component
- Add parallax, scroll-jacking, or exit animations
- Put decorative imagery in the landing page — typography carries the design
- Use shadows heavier than `shadow-lg`
- Animate layout-shifting properties (width, height, padding)

---

*Last updated: March 2026*
