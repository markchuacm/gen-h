# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: proactive, longevity-minded Malaysian professionals (roughly 30s-50s) with disposable income who want to optimize their long-term health *before* anything is wrong — not people already in crisis. They are the audience implied by the RM1,400 personalized panel and "Founding Members" launch framing.

Three portals serve three distinct roles on top of the same product:
- **Member** — the primary user above, going through teleconsult → personalized test → blood draw → care plan → ongoing tracking.
- **Doctor** — functional-medicine doctors who configure personalized panels, review results, and build each member's care plan from a library (`src/doctor/`, `carePlanLibrary`).
- **Admin** — internal staff who manage doctors/patients, ingest lab PDF results (`src/admin/ingest/`), and release results/care plans to members.

## Product Purpose

Verae Health is a doctor-led preventive health and longevity platform. It gives adults a personalized panel of 100+ biomarkers, interpreted by real doctors over virtual consults, turned into a tailored action plan with progress tracked over time. Success is a member understanding where their health is heading early enough to act, not after symptoms appear.

## Positioning

Explicitly **not a clinic** — a health intelligence platform: doctor interpretation plus a personalized, tailored panel (not a fixed standard checkup), a written action plan, and longitudinal tracking. This combination (personalization + doctor interpretation + tracking over time) is the thing a standard lab-panel provider or a one-off checkup could not truthfully copy. Everlab is the external benchmark to beat on member-facing UX quality (see design memory).

## Operating Context

- Core member journey (from landing copy, `src/landing/data.ts`): (1) Teleconsult — share history, goals, lifestyle, family history; (2) Personalized test — doctor configures the panel to the member's needs; (3) Blood draw — routed to a lab partner (currently Innoquest); (4) Care plan — doctor reviews markers with the member and turns them into next actions and follow-up testing.
- Doctor-side workflow: brief → panel → results → plan (care plan starts blank, is library-driven, not AI-generated — see design memory).
- Admin-side workflow: client-side ingestion of lab PDF reports with human review before committing into a draft report (see design memory).
- All conversion CTAs on the marketing site currently route to WhatsApp for booking; there is no in-app checkout/booking flow today. Not confirmed as a permanent constraint — noted as current fact only.
- Backend: Fastify + PostgreSQL on AWS Lightsail (Malaysia region); browser talks only to the typed HTTP API, no direct DB/storage access from the client.

## Capabilities and Constraints

- **Doctor-led, not a clinic** is a binding product/legal distinction — future work must not blur this into clinical/medical-provider framing.
- Care plans are library-driven, assembled by doctors from a defined content library — not AI-generated (confirmed prior direction, still true).
- Current pricing (RM99 teleconsult, RM1,400 full test) is explicitly **launch/Founding Members pricing**, not a committed permanent price — treat as evidence of positioning (premium but accessible), not as a fixed number to design around long-term.
- Lab partner (Innoquest) and WhatsApp-only conversion are current implementation facts, not confirmed as durable constraints — flag rather than silently redesign, but not off-limits.

## Brand Commitments

- Current name: **Verae Health**. The product was formerly named **Gen-H**; that name persists in asset filenames, `DesignSystem.md`, and some internal docs/memory as legacy naming, not current brand identity.
- Real, named doctors with real credentials (e.g. Dr. Deanna Abdul Halim, MBBS Mansoura University School of Medicine) are used as evidence on the marketing site — not placeholder personas.
- Brand voice (per `DesignSystem.md`, still applicable): calm, clinical, reassuring, plain-spoken; refers to itself as "we"/the brand name, never first-person singular; sentence case everywhere.

## Evidence on Hand

- Real biomarker groupings with specific test names and counts (e.g. "Heart & metabolic — 18+ biomarkers: ApoB, LDL/HDL, Triglycerides...") — `src/landing/data.ts`.
- Real doctor roster with credentials and portraits (`assets/doctors/`).
- Real lab partner logo (Innoquest) and other logos (`assets/logo-aafh.png`, `logo-ifm.png`, `logo-medisca.png`, `logo-rcpi.png`, `logo-rcsi.png`) — likely accreditation/affiliation marks; not yet confirmed individually.
- **No testimonials, case studies, or press mentions exist anywhere in the codebase.** Future work must not fabricate these.
- FAQ copy on the landing page is real, confirmed product copy (audience, clinic-status, pricing rationale, consult format, lab location).

## Product Principles

1. Personalization over standardization — the panel, the plan, and the guidance are configured per member, not templated.
2. Doctor interpretation is the product, not a checkbox — every result and plan is mediated by a real doctor, never presented as raw data or AI output.
3. Calm clarity over alarm — the brand reduces health anxiety and confusion rather than amplifying it; reassurance is a design requirement, not just a tone choice.
4. Longitudinal by design — the product's edge is tracking change over time, not a one-off snapshot.
5. Premium but honest — concrete numbers and real evidence (named doctors, real biomarkers) build trust; never invented proof.
