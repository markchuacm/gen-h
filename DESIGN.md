---
name: Verae Health
description: Doctor-led preventive health platform — editorial, airy, clinical-calm, one warm terracotta accent
colors:
  cream: "#ffffff"
  ink: "#111827"
  muted: "#64748b"
  faint: "rgba(15, 23, 42, 0.1)"
  line: "rgba(15, 23, 42, 0.13)"
  accent: "#b85d35"
  accent-dark: "#964829"
  accent-soft: "#cf7a56"
  accent-tint: "rgba(184, 93, 53, 0.08)"
  danger: "#b3261e"
  danger-dark: "#9a2820"
  danger-tint: "rgba(179, 38, 30, 0.08)"
  dark: "#0f172a"
  doctor-amber: "#c9973d"
  doctor-red: "#cd6353"
  admin-ok: "#167a5a"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(3.2rem, 8.6vw, 8.75rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2rem, 4.2vw, 3.8rem)"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 800
    letterSpacing: "0.22em"
rounded:
  pill: "999px"
  card-sm: "12px"
  card-md: "18px"
  card-lg: "24px"
  card-xl: "28px"
  frame: "34px"
spacing:
  section: "clamp(96px, 11vw, 168px)"
  container: "min(1280px, calc(100% - clamp(32px, 5vw, 96px)))"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.accent-dark}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  chip:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent-dark}"
    rounded: "{rounded.pill}"
  chip-neutral:
    backgroundColor: "rgba(15, 23, 42, 0.05)"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.card-lg}"
---

# Design System: Verae Health

## Overview

**Creative North Star: "The Clinical Magazine"**

Verae Health reads like a premium health magazine, not a SaaS dashboard: a pure-white canvas, generous whitespace, and exactly one warm accent color, with real photography carrying all the emotional warmth so the interface itself can stay quiet and neutral. Headings are light-weight and fluid, never bold or shouting; the only loud element on a page is the letter-spaced uppercase eyebrow kicker. Emphasis inside a heading is carried by italic terracotta runs, never by bold or a second typeface.

This calm-editorial voice is deliberate: the brand exists to reduce health anxiety, not add to it, so nothing in the visual system is allowed to feel clinical-cold or alarmist. The one confirmed rejection is a second brand hue or decorative gradient — color is spent once, on the accent, and everywhere else stays neutral ink/muted/white.

The same base language (accent, neutrals, pill buttons, soft large-radius cards, three-tier hairline shadows) is shared verbatim across the marketing landing page and the member, doctor, and admin portals — `src/member-v2/tokens.css` states explicitly that landing tokens are the source of truth and portal tokens must stay in sync with it. Doctor and admin surfaces layer their own semantic (non-brand) colors on top for status and workflow states.

**Key Characteristics:**
- Pure white surfaces, one warm terracotta accent, no second brand hue
- Light-weight (400) fluid display type, italic-terracotta emphasis inside headings
- Fully-round (999px) pills for every button and chip; soft large radii (18–34px) for cards and image frames
- Three-tier hairline shadow system (border / border-hover / lift) — always soft, never hard
- Native system-font stack everywhere; no webfont shipped
- Real photography desaturated-and-dimmed at rest, warming to full color on hover

## Colors

A single-accent palette: nearly everything is white, ink, or muted gray, with terracotta reserved for accent and one calm green/amber/red set reserved for portal status states.

### Primary
- **Terracotta / Clay** (`#b85d35`): the one brand accent — CTAs, italic heading emphasis, active/selected states, focus rings, link hover. Deepens to **Terracotta Dark** (`#964829`) on hover/press, and softens to **Terracotta Soft** (`#cf7a56`) for emphasis text over dark or photographic backgrounds. **Terracotta Tint** (`rgba(184,93,53,0.08)`) is the chip/pill fill.

### Neutral
- **Paper White** (`#ffffff`): the only surface color. No off-white, no tinted background.
- **Ink** (`#111827`): primary text.
- **Muted Slate** (`#64748b`): secondary text, eyebrow labels, captions.
- **Faint** (`rgba(15,23,42,0.1)`) / **Line** (`rgba(15,23,42,0.13)`): hairline dividers and card borders — never a solid gray border.
- **Warm Near-Black** (`#0f172a`): reserved for dark sections (footer, glass nav backing), used sparingly.

### Semantic / Status (portal extensions)
- **Danger** (`#b3261e`, hover `#9a2820`, tint `rgba(179,38,30,0.08)`): errors and destructive actions system-wide.
- **Doctor Amber** (`#c9973d`): doctor portal warning/pending state only.
- **Doctor Red** (`#cd6353`): doctor portal alert state, distinct from the shared `--danger` red — softer, used for clinical flags rather than destructive actions.
- **Admin Ok / Released Green** (`#167a5a`, tint `rgba(22,122,90,0.1)`): admin-only "released"/optimal state.

### Named Rules
**The One Hue Rule.** The entire system has exactly one brand color — terracotta. No second decorative hue, no gradient palette, no purple. Portal-specific status colors (amber, red, green) are semantic workflow signals, not brand colors, and never appear on the marketing landing page.

**The Governed Extension Rule.** Doctor and admin portals may introduce new semantic colors for status/workflow (warnings, released state, alerts) on top of the shared base tokens, but must never introduce a new decorative or brand hue. Any new portal color must justify itself as a functional status signal.

## Typography

**Display/Body Font:** native system sans (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) — no webfont is loaded anywhere in the product, by deliberate choice, for a neutral, fast-loading, trustworthy voice.

**Character:** Light and unhurried at large sizes, plain and readable at body size. The typographic voice never reaches for weight or a second typeface to create emphasis — italic + the accent color is the only emphasis mechanism.

### Hierarchy
- **Display** (400, `clamp(3.2rem, 8.6vw, 8.75rem)`, line-height 0.98, letter-spacing -0.03em): hero headlines only.
- **Headline** (400, `clamp(2rem, 4.2vw, 3.8rem)`, line-height 1.06, letter-spacing -0.02em): section headings.
- **Body** (400, 1.1rem on landing / 1.05rem in portals, line-height 1.65–1.7): all running text; `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs.
- **Label / Eyebrow** (800, 0.78rem, letter-spacing 0.22em, uppercase, muted color): section kickers ("WHAT WE TEST", "HOW IT WORKS") — the only uppercase, the only heavy weight, anywhere in the system.

### Named Rules
**The Italic-Accent Emphasis Rule.** `em` inside any `h1`/`h2`/`h3` renders italic in the accent color (`color: var(--accent)`, or `--accent-soft` over hero/dark backgrounds). This is the only way headings carry emphasis — never bold, never a second font.

**The One Uppercase Rule.** Sentence case everywhere except the eyebrow kicker. Never Title Case a headline, never write an all-caps sentence.

## Layout

Section rhythm is generous and consistent: `padding-block: clamp(96px, 11vw, 168px)` between major sections. Container width is `min(1280px, calc(100% - clamp(32px, 5vw, 96px)))` — fluid, capped, never edge-to-edge on large screens. Heading blocks are centered with `text-wrap: balance`; grids use `gap`, never margin-based spacing between siblings. Portal screens (member/doctor/admin) reuse the same container and section-rhythm logic at a slightly denser body scale (1.05rem vs. landing's 1.1rem) appropriate to task-focused UI rather than editorial scrolling.

## Elevation & Depth

Three-tier hairline shadow system, always soft and low-contrast — never a hard or dark drop shadow.

### Shadow Vocabulary
- **Border** (`0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)`): resting state for cards — a hairline ring plus a faint drop, never a visible border line.
- **Border Hover** (`0 0 0 1px rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.08), 0 8px 24px rgba(15,23,42,0.1)`): interactive card lift on hover.
- **Lift** (`0 20px 60px rgba(15,23,42,0.13), 0 0 0 1px rgba(0,0,0,0.06)`): the large ambient shadow reserved for hero panels and the most prominent process/feature panels.

### Named Rules
**The Hairline-Not-Border Rule.** Cards never use a visible solid border. Edges are defined by the Border shadow tier's 1px ring, kept at low opacity.

## Shapes

Radius scales with a component's prominence, and nothing is sharp-cornered:
- **Pills** (999px): every button, chip, and badge, with no exception.
- **Small cards / rows** (12–18px): compact list rows, form fields, small utility cards.
- **Standard cards** (24px): the default card radius across landing and portals (`.p-card`, section panels).
- **Prominent cards** (28px): elevated profile/summary cards.
- **Hero & photographic frames** (34px): the largest, most photographic surfaces only.

## Components

Buttons, cards, and inputs are gentle and confident: soft hover lifts, generous pill or large-radius geometry, and calm low-contrast shadows rather than sharp or snappy feedback. The one deliberate exception is the primary button's small `scale: 0.96` press-in on `:active` — a light tactile confirmation, not a bounce.

### Buttons
- **Shape:** fully round (999px) always.
- **Primary (`.p-btn`):** `background: var(--accent)`, white text, weight 520, `padding: 12px 24px`. Hover darkens to `--accent-dark` and lifts `translate: 0 -1px`; active scales to `0.96`. Transition timing uses the standard UI ease (`cubic-bezier(0.2, 0, 0, 1)`, ~180ms).
- **Ghost (`.p-btn-ghost`):** transparent fill, `box-shadow: inset 0 0 0 1px var(--line)` in place of a border, ink text, same padding/weight/radius as primary. Hover fills to a faint neutral tint (`rgba(15,23,42,0.04)`).

### Chips
- **Style (`.p-chip`):** fully round, `background: var(--accent-tint)`, `color: var(--accent-dark)`, 0.78rem, weight 600, letter-spacing 0.01em.
- **Neutral variant (`.p-chip--neutral`):** same shape, `background: rgba(15,23,42,0.05)`, `color: var(--muted)` — used where the chip is informational rather than accent-worthy.

### Cards / Containers
- **Corner Style:** 24px standard (`.p-card`); see Shapes for the full scale by prominence.
- **Background:** solid white only.
- **Shadow Strategy:** Border tier at rest, Border Hover on interactive hover (see Elevation & Depth).
- **Border:** none — the hairline shadow ring stands in for a border everywhere.

### Navigation
The site nav is a floating glass capsule: transparent at the top of the page, then frosts to `rgba(32,31,27,0.64)` with `backdrop-filter: blur(20px)` once scrolled. Uppercase eyebrow-weight is not used in nav labels; nav items use sentence-case body type and shift to the accent color on hover/active.

### Imagery (signature pattern)
Photography is the system's warmth-carrier and is treated accordingly: images sit desaturated and dimmed at rest (`filter: grayscale(1)`), then warm to full color and scale up slightly on hover/active over ~520ms. This is used across biomarker tiles, process-step photos, and doctor portraits — never applied to flat UI chrome.

## Do's and Don'ts

### Do:
- **Do** keep terracotta (`#b85d35`) as the only brand accent; spend it deliberately (CTAs, emphasis, active state), not decoratively.
- **Do** use fully-round pills (999px) for every button and chip, with no exceptions.
- **Do** use the italic + accent-color pattern for emphasis inside headings — never bold, never a second typeface.
- **Do** keep the three-tier hairline shadow system (Border / Border Hover / Lift) as the only elevation vocabulary — soft and low-contrast always.
- **Do** let doctor/admin portals add semantic status colors (amber, red, green) for workflow states, governed by the One Hue Rule.
- **Do** apply the grayscale-to-color hover treatment to photography, never to flat UI elements.

### Don't:
- **Don't** introduce a second brand/decorative hue, a gradient wash, or a purple — the accent stays singular.
- **Don't** load a webfont; the system-font stack is a deliberate trust/speed signal, not a placeholder.
- **Don't** use a visible solid border on a card; use the hairline shadow ring instead.
- **Don't** use Title Case or ALL-CAPS on a headline — sentence case everywhere except the eyebrow kicker.
- **Don't** promote a portal's semantic status color (doctor amber, admin green) onto the marketing landing page.
