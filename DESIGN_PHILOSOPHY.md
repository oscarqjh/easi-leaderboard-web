# Design Philosophy: The Academic Journal

**"Rigorous data, editorial grace."**

EASI is a benchmark site, not a product. It must feel like opening a well-typeset journal article — authoritative, unhurried, and quietly beautiful. Every pixel serves the data or gets out of the way.

---

## Core Concept

**The Editorial Foyer**

The site has two modes: a landing page that orients the reader, and a leaderboard that delivers the numbers. The landing page is an abstract — it sets context, establishes credibility, and invites deeper reading. The leaderboard is the results section — dense, sortable, scannable.

- **Atmosphere**: Scholarly calm. Soft lavender light on clean white paper.
- **Metaphor**: A well-organized research poster presented in a quiet conference hallway.
- **Rhythm**: Measured. Sections reveal themselves on scroll like turning pages. No urgency, no flash.

---

## Visual Aesthetics

### 1. The Palette: Indigo Ink on Vellum

We use a single dominant hue — indigo — as the ink color of an academic press. Everything else is neutral.

- **Indigo (`#6366f1`)**: The primary accent. Used sparingly: headings, active states, badges, CTAs.
- **Deep Navy (`#1e1b4b`)**: Text and navigation. Grounded, serious, high-contrast.
- **Lavender Wash (`#faf9fc`)**: The background. Not white — warmer, softer, easier on the eyes during long reading sessions.
- **Pure White (`#ffffff`)**: Surface cards, tables, the leaderboard. Creates clear figure-ground separation against the lavender.

Capability cards introduce six tint accents (indigo, violet, blue, amber, emerald, rose) but these are always muted — 8% opacity fills, 35% opacity borders. Color informs, never shouts.

### 2. Typography: Fraunces + DM Sans

- **Fraunces** (optical size 9–144): The display serif. Used for the "EASI" wordmark, section headings, and stat numbers. Its soft, wonky serifs add warmth without pretension.
- **DM Sans**: The body workhorse. Geometric, clean, excellent at small sizes. Carries descriptions, labels, and table data.
- **IBM Plex Mono**: Code and metrics only. BibTeX blocks, metric badges, data values.

### 3. Layout: Centered & Contained

- **Max-width 80rem** for the leaderboard (data needs room).
- **Max-width 64rem** for the landing page (editorial content reads better narrow).
- **Generous vertical padding** between sections (4rem minimum). Sections breathe.
- **Cards use soft shadows** (`0 2px 8px rgba(0,0,0,0.06)`) and rounded corners (`10px`). This is intentionally not flat — the editorial aesthetic values subtle depth to separate content layers.

---

## Motion Philosophy

### 1. Scroll-Triggered Reveals

Each landing page section fades in (opacity 0→1, translateY 16px→0) when it enters the viewport. This creates a sense of progression — the reader "discovers" content as they scroll.

- **Duration**: 700ms with `ease-out`.
- **Stagger**: Capability cards and benchmark cards animate individually with 60–80ms delays between siblings.
- **One-shot**: Elements animate in once and stay. No exit animations, no parallax, no scroll-jacking.

### 2. Interaction Feedback

- **Hover**: Cards lift slightly via shadow increase. Links shift color. Transitions are 150ms.
- **Copy button**: Instant text swap ("Copy" → "Copied!") with a 2s reset. No toast, no animation — just honest feedback.
- **Navigation**: Active state uses the deep navy (`#1e1b4b`) as a solid pill. Transitions are 150ms.

### 3. Restraint

No particle systems, no WebGL, no complex orchestration. The benchmark data is the star. Motion exists only to make the page feel alive and guide the eye.

---

## Key Sections

### Landing Page (the "Abstract")

1. **Hero**: Pill badge → Display title → Subtitle → Two CTAs. Centered, typographic, no imagery.
2. **Stats Bar**: Four numbers in a white strip. Proves scale at a glance.
3. **Capabilities Grid**: 3×2 cards with colored accent borders. The taxonomy made tangible.
4. **Benchmarks Grid**: 4×2 compact cards. Each benchmark with name, focus, and metric badge.
5. **Citation**: Monospace BibTeX with one-click copy. Academic courtesy.
6. **Links**: GitHub, arXiv, HuggingFace as a horizontal row. Exit ramps to primary sources.

### Leaderboard (the "Results")

A dense, sortable table. This is the core utility — it must load fast, scan easily, and support filtering. Design stays out of the way here.

---

## Engineering Standards

1. **Static export**: The entire site builds to static HTML via `next export`. No server runtime, no API routes. Data is baked in at build time.
2. **Client components only where needed**: `LandingPage.tsx` is client-side for `IntersectionObserver` and clipboard. The leaderboard is client-side for sorting/filtering. Everything else is server-rendered.
3. **Tailwind utilities over custom CSS**: The design system lives in `tailwind.config.ts` (colors, fonts, spacing, shadows, radii). `globals.css` holds only animations and base resets.
4. **Accessibility**: `prefers-reduced-motion` kills all animation. Focus rings on all interactive elements. Semantic HTML throughout.

---

*When in doubt, ask: "Would this feel at home in a Nature or Science supplementary website?" If yes, ship it. If no, simplify.*
