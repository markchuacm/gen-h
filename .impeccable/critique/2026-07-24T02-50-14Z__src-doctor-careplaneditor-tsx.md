---
target: Doctor's guided care-plan flow (CarePlanEditor.tsx)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-07-24T02-50-14Z
slug: src-doctor-careplaneditor-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Save-state pill ("Saved"/"Saving"/"Unsaved") works on desktop, but a confirmed mobile CSS bug overlaps it with the mode-switch control. |
| 2 | Match System / Real World | 4 | Evidence chips, "Focus area" language, and doctor-note voice are identical across prep, consult, review, and the member's own plan — one story told twice. |
| 3 | User Control and Freedom | 2 | Confirmed: deferring a focus area clears already-selected actions with no undo; removing a focus area has no confirm; mobile nav bug blocks reliable mode switching. |
| 4 | Consistency and Standards | 3 | Strong shared-primitive discipline (`.p-btn`/`.p-eyebrow`/pill radii), but the doctor and member category chips use two different undersized values (10.88px vs 10.56px) for what should be one shared visual language. |
| 5 | Error Prevention | 2 | Release-gate validation is solid; but defer silently destroys live-agreed selections, and stale/ready status can visibly contradict itself. |
| 6 | Recognition Rather Than Recall | 3 | Progress rail keeps focus areas visible in Consult; doctor still has to remember which action was "Recommended" in Prep with only a small badge as a bridge. |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts for action selection, despite this being a tool run many times a week and despite the sibling `ProfileFlow.tsx` already having a numbered-shortcut pattern to reuse. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and restrained per the design system, but repeated, measurable contrast failures on the evidence chips (the most clinically important text on the page) undercut "every element earns its pixel." |
| 9 | Error Recovery | 2 | Save-conflict message is clear; release failure surfaces a raw validation string with no guidance on how to fix it. |
| 10 | Help and Documentation | 2 | "Why this works" details are good in-context help; nothing explains what "defer" does to the member-facing plan, or what the basis labels mean, to a first-time doctor. |
| **Total** | | **25/40** | **Acceptable — solid execution, dragged down by confirmed regressions** |

### Design Specificity Verdict

**LLM assessment**: This is authored for Verae specifically, not a generic wizard reskin. Evidence chips carry real biomarker values ("Apolipoprotein B 1.28 g/L · Needs attention"), the "RESULT-DRIVEN / PREVENTION / DOCTOR-ADDED" basis labels model the actual clinical-generation logic, the action library speaks in a real clinician's voice ("I'd rather you make three food swaps you can keep than attempt a strict diet for six weeks and stop"), and the doctor's prep/consult/review structure mirrors the real private-prep → shared-call → sign-off workflow rather than an arbitrary tab set. The Prepare vs. Consult copy ("PRIVATE PREPARATION" vs. "TOGETHER WITH AISYAH") reinforces who's in the room at each stage — a detail a generic template would never think to write.

**Deterministic scan**: `detect.mjs` reported 0 findings against the two component files directly (clean static scan), but the live browser overlay — which evaluates rendered/computed styles the static scanner can't see — found real issues repeated across every view: 27 anti-patterns in Prepare, 10 in Consult, 25 in Review, 30 on the member's released view, holding steady at 27 when re-checked at 390×844 mobile width. The substantive, repeating findings were two `low-contrast` pairs (evidence-chip text) and one `undersized-ui-text` finding (category chips) — both traced to exact CSS tokens below and confirmed directly in source. Two other flagged items — `bounce-easing` on the page-entrance animation and `dark-glow` on `body` — are **false positives**: the "bounce" curve is `var(--ease-spring)`, the exact `cubic-bezier(0.22,1,0.36,1)` reveal easing DESIGN.md documents as the brand's sanctioned motion language ("gentle spring-out... no bounce"), and there is no non-inset accent-colored box-shadow or dark background anywhere in this surface (confirmed by direct search) — the rule appears to be misfiring on a computed value, not catching a real defect. Worth noting as a case where the product's specific, brand-approved choices produced a "miss" from generic heuristics — exactly the opposite of the interchangeable-template failure mode this verdict is meant to catch.

**Visual overlays**: injection succeeded and console evidence was captured directly (no user-visible browser tab was left open for this run — findings were pulled via console output during the sub-agent's session).

### Overall Impression

The flow is clearly built for this specific clinical workflow and tells a genuinely consistent story from doctor prep through to what the member sees later — that part is real craft, not decoration. But two concrete regressions pull it down from "polished" to "solid with real gaps": a CSS containing-block bug that breaks the mobile mode-switch navigation, and the exact text carrying flagged biomarker evidence — the most clinically important content on the page — failing contrast on every single screen it appears on. Neither is a matter of taste; both are measurable and fixable in an afternoon.

### What's Working

1. **Evidence chips as connective tissue.** The same amber/red chip (marker name + value + status) appears in Prepare, Consult, Review, and the member's own released plan. It's the single strongest consistency decision in the feature — the doctor and the patient are provably looking at the same evidence.
2. **The three-mode structure models the real workflow, not an arbitrary tab set.** Private Preparation → live Consultation → Review-and-release matches how a clinical relationship actually moves through a decision, and the copy reinforces it at every step.
3. **The clinician supplement-confirmation checkbox** is a specific, thoughtful safety mechanism (not generic UI polish) — it shows the team actually modeled a real clinical-risk moment rather than shipping a decorative checkbox.

### Priority Issues

**[P1] Mobile bottom-nav is broken by a CSS containing-block bug.**
- **Why it matters**: `.guided-plan-topbar` (`src/doctor/doctor.css:2053`) sets `backdrop-filter: blur(18px)`, which per spec makes it the containing block for any `position: fixed` descendant. `.guided-mode-switch` — the Prepare/Consult/Review switcher — is set to `position: fixed; bottom: 14px` at ≤780px (`doctor.css:3522-3532`) intending a thumb-reachable bar at the true bottom of the phone screen. Because its containing block is now the small sticky topbar instead of the viewport, it renders pinned near the top of the screen instead, overlapping the "Saved" status pill. Confirmed directly in source, not just visually — this is a genuine, reproducible bug, not a style preference.
- **Fix**: Move the fixed-position mode-switch out of `.guided-plan-topbar`'s DOM subtree (render as a sibling of `<main>`, not inside `<header>`), or drop `backdrop-filter` from the topbar and find another way to keep its glass effect.
- **Suggested command**: `/impeccable harden`

**[P1] The evidence chips — the most clinically important text on the page — fail contrast on every screen.**
- **Why it matters**: `--doc-amber` (`#c9973d`) on `--doc-amber-soft` and `--doc-red` (`#cd6353`) on `--doc-red-soft` are both used as text color on their own tint background for `.guided-evidence-chip` and `.cp-evidence-chip` (`doctor.css:14-17, 2413-2421`). Measured contrast: ~2.4:1 and ~3.4:1, against a 4.5:1 requirement for body-size text — confirmed by computing the actual blended background against the documented token values. This repeats identically in Prepare, Consult, Review, and the member's released plan, because it's one shared chip component: it's not an edge case, it's the default reading experience for the flagged biomarker evidence that anchors every focus area.
- **Fix**: Darken `--doc-amber`/`--doc-red` for text use specifically (keep the current values for borders/icons), or deepen the tint so the pair clears 4.5:1.
- **Suggested command**: `/impeccable audit` (accessibility pass), then `/impeccable polish`

**[P2] Deferring a focus area silently destroys already-agreed actions.**
- **Why it matters**: `CarePlanEditor.tsx:951-953` clears `actions: []` the instant a focus area is toggled to "deferred" — with no confirmation, unlike the care taken over the Release modal for a much lower-stakes moment. If a doctor taps defer mid-call just to reconsider wording with the patient, live-agreed selections are gone with no way back.
- **Fix**: Warn before clearing, or hide/deprioritize the actions instead of deleting them so they return if the section is un-deferred.
- **Suggested command**: `/impeccable harden`

**[P2] Focus-area explanation textareas silently clip long text.**
- **Why it matters**: `.guided-summary-edit` and `.guided-consult-intro > textarea` (`doctor.css:2376-2387, 2817-2828`) use a fixed `min-height` (60px/68px) with manual drag-resize as the only escape hatch and no auto-grow. Confirmed: the default seeded cardiovascular summary already overflows (118px of content in a 68px box) with zero visual cue anything is hidden. This is the doctor's own clinical framing, silently cut off mid-sentence, during a live conversation with the patient.
- **Fix**: Auto-size the textarea to its content (e.g. `field-sizing: content`, or a resize-on-input effect) instead of relying on a manual handle.
- **Suggested command**: `/impeccable harden`

**[P2] "Ready" and "needs review" status can contradict each other in the same view.**
- **Why it matters**: `generationStatus` (shown as "· Ready" in the ruleset chip) and `evidenceStale` (drives the amber "Newer results are available… Regenerate this draft before it can be released" banner) are tracked as two unrelated booleans (`CarePlanEditor.tsx:165-166, 520, 685`). A draft can show both "Clinical Rules V1.0.0 · Ready" and "regenerate before release" at once — two adjacent signals disagreeing about whether the doctor can proceed, right at the moment they're deciding whether to release.
- **Fix**: Derive the ruleset label from `evidenceStale` (e.g. show "Needs review" while stale) instead of tracking the two independently.
- **Suggested command**: `/impeccable clarify`

### Persona Red Flags

**Alex (repeat power user — the doctor running this flow many times a week)**: Every action selection in Consult is mouse/tap-only. No keyboard path exists despite the sibling member-facing `ProfileFlow.tsx` already having a numbered-shortcut pattern (`pf-chip-key`) that could be reused here. For a tool run dozens of times weekly, this is pure repeated friction with no efficiency ceiling.

**Sam (accessibility-dependent user)**: The evidence chips carrying the flagged biomarker data fail WCAG AA contrast on every screen (see P1 above) — the single piece of information a low-vision user most needs to read clearly is the hardest text on the page to read. Category chips (`.guided-category` at 10.88px, `.cp-category` at 10.56px) sit below a comfortable 11px floor system-wide, not just in one spot.

**Dr. — mid-consult, screen-sharing live with the patient** (project-specific, per the PRD's stated assumption that "the patient participates verbally while the doctor controls the shared screen"): the confirmed defer-clears-actions bug and the truncating textarea both land at the worst possible moment for this persona — live, in front of the patient, with no way to undo a slip of the finger or recover text that just vanished off-screen.

### Minor Observations

- Category-chip font size is not just small, it's inconsistent between the doctor (`0.68rem`) and member (`0.66rem !important`) views — two different too-small values for what's meant to be one shared visual language.
- `detect.mjs`'s `line-length` finding (~86–91 chars/line in Review-mode paragraphs and the member view, against an "aim for <80" heuristic) is soft, not a hard failure, but worth a look if `/impeccable typeset` is run later.
- One near-miss, systemic rather than care-plan-specific: `var(--muted)` (`#64748b`) on a card background measured at 4.4:1 against a 4.5:1 requirement in the member view — a 0.1 miss shared with the rest of the product, not something to fix locally.
- `AlternativeLibrary` pulls alternatives from every focus-area template regardless of the current focus area's clinical theme (`CarePlanEditor.tsx:995-998`) — browsing "Cardiovascular" alternatives can surface an unrelated Sleep-category action with no filtering.
- `basisLabel()` silently absorbs any unrecognized `basis_type` into "DOCTOR-ADDED" with no distinct handling — fine today, worth a note if new basis types are ever added.

### Questions to Consider

- If screen-sharing during a live consult happens almost entirely on desktop, is the mobile mode-switch bug actually P1 for the consult itself — or is it P0 for the private-preparation step, which a doctor is more likely to do from a phone between patients?
- What would it take to make "defer" feel like a considered decision rather than a delete button — should the member ever see that a focus area was discussed and deliberately deferred, instead of it just not existing in their released plan?
- Has this flow been used on a real phone during a real consult, or only reviewed on desktop so far?
