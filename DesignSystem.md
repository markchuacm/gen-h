# Gen-H Design System

A design system for **Gen-H** — a Malaysian, doctor-led **preventive health & longevity** platform. Gen-H helps adults understand where their health is heading *before* symptoms appear: a personalized panel of **100+ biomarkers**, interpreted by functional-medicine doctors over virtual consults, with a tailored action plan and progress tracking over time.

The brand voice is calm, clinical and reassuring — *"Helping you stay well for life's best moments."* Every conversion path routes to a **WhatsApp** consult.

## Sources

This system was reverse-engineered from the Gen-H marketing site source:

- **GitHub:** https://github.com/markchuacm/gen-h — a single-page React/Vite site (`src/App.tsx` + `src/styles.css`) plus an `assets/` library (hero imagery, biomarker photography, doctor portraits). Explore this repo to build richer or more accurate Gen-H designs — it is the ground truth for copy, structure and imagery.

All colors, type treatments, spacing, imagery treatment and component behaviour below are lifted from that source. No Figma file was provided.

---

## Index / manifest

**Root**

- `styles.css` — global entry point (import manifest only). Consumers link this one file.
- `README.md` — this guide. · `SKILL.md` — Agent-Skills front matter.

**`tokens/`** — `colors.css`, `typography.css`, `spacing.css`, `effects.css` (each `@import`ed by `styles.css`).

**`components/`** — reusable React primitives (namespace `window.DesignSystem_ab3542`):

- `core/` — **Button**, **WhatsAppCta** (+ `WhatsAppIcon`), **Eyebrow**, **Pill**, **Card**
- `sections/` — **SectionHeading**, **ProofRow**, **StatStrip**, **Marquee**
- `cards/` — **BiomarkerCard**, **DoctorCard**, **FutureCard**, **ProcessStep**
- `interactive/` — **FaqItem**, **ComparisonTable**
- `layout/` — **NavHeader**, **Footer**

**`ui_kits/website/`** — full interactive recreation of the Gen-H marketing site (`index.html` + `Hero.jsx` + `data.js`).

**`guidelines/`** — foundation specimen cards (Colors, Type, Spacing, Effects, Brand) shown in the Design System tab.

**`assets/`** — hero image, biomarker photography (`biomarkers/`), doctor portraits (`doctors/`), future-health illustrations (`future-health/`), process-step photos, lab-partner logos (`partners/`).

---

## CONTENT FUNDAMENTALS

**Voice.** Warm, plain-spoken, doctor-calm. Gen-H reassures without hype — it reduces anxiety and confusion rather than amplifying it. Sentences are short and human.

**Person.** Speaks to **"you"** ("Helping *you* stay well", "Learn where *your* health is going"). The brand refers to itself as **"Gen-H"** or **"we"**. Never first-person-singular.

**Casing.** **Sentence case everywhere** — headlines, buttons, nav. The only uppercase is the letter-spaced **eyebrow kicker** (`WHAT WE TEST`, `HOW IT WORKS`). Never Title Case headlines, never ALL-CAPS sentences.

**Emphasis.** Carried entirely by **italic + terracotta** runs inside an otherwise-plain heading — *"The answers are in the **details**"*, *"connects the **dots**"*, *"treat **root causes**"*. Never bold, never a second typeface, never underline.

**Numbers & specifics.** Concrete and honest: "100+ biomarkers", "RM99", "Up to RM1,200". Hedge where the truth hedges ("Pricing may be lower, depending on tests"). Footnoted caveats use a leading asterisk in a neutral pill: "\*100% refundable".

**Tone examples (verbatim from source):**

- Hero: *"Helping you stay well for life's best moments"* / *"It starts with understanding your health early."*
- Section: *"The answers are in the details"*
- Doctors: *"Led by doctors who treat root causes, not just symptoms."*
- Close: *"Do it for the people who matter most"* / *"Take care of yourself, with Gen-H."*

**CTA copy.** Almost always **"Book a consult"** (occasionally "Talk to a doctor"). Every CTA opens WhatsApp.

**Emoji.** **None.** The brand never uses emoji. Icons are thin line glyphs only (see Iconography).

---

## VISUAL FOUNDATIONS

**Overall vibe.** Editorial, airy, clinical-calm. Pure-white page, generous whitespace, one warm accent. Photography carries all the warmth; the UI itself stays quiet and neutral. Feels like a premium health magazine, not a SaaS dashboard.

**Color.** A single brand accent — **terracotta / clay `#B85D35`** (hover `#964829`, soft `#CF7A56`, 8% tint for chips). Text is slate **ink `#111827`**, secondary **muted `#64748B`**. Surfaces are **pure white `#FFFFFF`**. There is no second brand hue, no gradient palette, no purple. Semantic state (the comparison table) reuses the accent as a solid band; "absent" marks are plain ink Xs.

**Typography.** **Native system sans only** (`ui-sans-serif, system-ui, …`) — Gen-H deliberately ships no webfont, for a neutral, trustworthy, fast-loading voice. Headings are **weight 400 (light), line-height \~1**, fluid `clamp()` scale up to \~4.7rem. Body is 1.1rem at line-height 1.65–1.75. The only heavier weights are buttons (\~520) and the uppercase eyebrow (\~800). Mono is unused in product UI.

**Imagery.** Real, warm photography — Malaysian people, nature, food, clinical close-ups. The signature treatment: images sit **desaturated/grayscale and dimmed at rest**, then **warm to full colour, brighten and scale up \~6%** on hover/active (`--genh-img-rest` → `--genh-img-active`, \~520ms). Full-bleed hero inside a 34px rounded frame with a multi-stop dark overlay for legibility. Biomarker tiles and process panels are photographic with bottom-anchored white captions.

**Backgrounds.** Plain white — **no patterns, no textures, no gradient washes** behind content. Gradients appear only as **legibility overlays on top of photography** (dark protection scrims), never as decoration. Dark sections use a near-black warm slate (`#1a1714`-ish) sparingly.

**Spacing & layout.** Generous. Section vertical rhythm \~**112px**. Container `min(1280px, 100% − clamp(32px,5vw,96px))`. Centered heading blocks with `text-wrap: balance`. Grids use `gap`, not margins.

**Corner radii.** Pills/buttons/chips are **fully round (999px)**. Cards round softly: images 14px, rows 18px, header/range 24px, profile cards 28px, hero & process panels **34px**. Nothing is sharp-cornered.

**Cards.** White surface, a layered **hairline + soft-lift shadow** (`--genh-shadow-border`), no visible border line. On hover, profile/partner cards rise **−3px** into a deeper shadow (`--genh-shadow-border-hover`). No colored left-border accents. No flat outlines.

**Shadows.** Three tiers: `border` (hairline ring + faint drop) at rest, `border-hover` (lifts), and `lift` (big soft 60px ambient shadow for hero/process panels). Always soft and low-contrast — never hard or dark.

**Transparency & blur.** Used for **glass**: the nav capsule frosts to `rgba(32,31,27,0.64)` + `blur(20px)` once scrolled; biomarker test pills are `rgba(255,255,255,0.13)` glass over photos; the FutureCard number badge is a `blur(18px) saturate(1.2)` frosted square. Blur is reserved for elements floating over imagery — never on flat white.

**Motion.** Calm and confident. Standard UI ease `cubic-bezier(0.2,0,0,1)` (\~160–220ms for buttons, links, header morph). Reveals use a gentle spring-out `cubic-bezier(0.22,1,0.36,1)` (\~380–720ms) — image warm-ups, card expansion, scroll-in panels. **No bounce, no infinite decorative loops** except the two opposing disease **marquees**. Buttons lift **−1px** on hover (no shrink-on-press). Respect `prefers-reduced-motion`.

**Hover / press states.** Buttons: darken accent + −1px lift. Links/FAQ rows: shift to accent color. Cards: lift + deepen shadow. Biomarker tiles: warm to colour + reveal test pills. Press: no explicit scale-down — the brand stays gentle.

---

## ICONOGRAPHY

- **Style:** thin, rounded **line icons** — Lucide-family geometry at **stroke-width \~1.3**, 24px viewBox, `round` caps/joins, no fill. They read as quiet medical/diagnostic glyphs (heart-pulse, activity, shield, droplets, sparkles, waves, circle-dot). Icons are monochrome, inheriting `currentColor` (white over imagery, ink/accent on white).
- **Source:** the Gen-H repo uses **`lucide-react`**. This system reproduces the handful actually used as inline SVG paths (see `ui_kits/website/data.js → ICONS`) so cards have no runtime dependency. **To extend, pull more icons from Lucide** (https://lucide.dev) at stroke-width 1.3 to match — this is a faithful match to the source, not a substitution.
- **Check / X marks** (ProofRow, ComparisonTable) are drawn at stroke \~2.4 for clarity; the ProofRow check sits inside a thin accent ring.
- **No emoji. No unicode-glyph icons. No filled/duotone icon sets.** Don't hand-draw decorative SVG illustrations — use the real photographic and illustration assets in `assets/`.
- **Logos:** Gen-H has no graphic mark — the brand is the **text wordmark "Gen-H"** (system sans, weight \~560). Lab-partner logos (BP Healthcare, Innoquest) live in `assets/partners/`.

---

## Using this system

Consumers link the one stylesheet and read components off the global namespace:

```html
<link rel="stylesheet" href="styles.css" />
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, WhatsAppCta, BiomarkerCard, SectionHeading } = window.DesignSystem_ab3542;
</script>
```

Build pages from `SectionHeading` + the card components on a plain white background; lead with photography; keep headings light with italic-accent emphasis; route every CTA to `WhatsAppCta`.

### Caveats

- **No webfont to ship** — Gen-H intentionally uses system fonts, so there are no `@font-face` rules. If a future brand font is adopted, add it under `tokens/` and a `@font-face` file.
- **Icons** are reproduced as inline SVG from the source's `lucide-react` usage; add more from Lucide (stroke 1.3) as needed.
- A couple of process/platform images came from the repo's `assets/generated/` folder (AI-generated in the original project) — swap for real photography when available.
