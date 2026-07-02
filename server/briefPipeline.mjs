// ─── Doctor Review Brief · staged SSE pipeline ────────────────────────────────
// Orchestrates the agentic brief build: extract (multimodal, per document) →
// classify (pure JS, zero LLM cost) → compose (one streaming call). Every stage
// emits SSE events so the client can show genuine reasoning progress.
//
// Cost budget is hard: a full run is N docs × 1 extract call + 1 compose call;
// a synthesis rerun is exactly 1 call. The only extra call is a single strict
// JSON repair when compose output can't be parsed.
//
// Safety: extraction reports only what is visibly printed (values, units,
// reference ranges, flags). Compose groups facts for a clinician — it never
// diagnoses, grades severity, or recommends treatment.

import {
  chatCompletion,
  chatCompletionStream,
  isAuthError,
  parseJsonObject,
  resolveModel,
  stringArray,
  stringOrNull,
} from "./openrouterClient.mjs";
import {
  canonicalKeyFor,
  matchRules,
  PANEL_LABELS,
  panelFor,
} from "./questionRules.mjs";

const MAX_DOCUMENTS = 8;
const MAX_TEXT_CHARS = 40_000;
const MAX_IMAGES_PER_DOC = 4;
const EXTRACT_MAX_TOKENS = 5000;
const COMPOSE_MAX_TOKENS = 4000;
const COMPOSE_REPAIR_MAX_TOKENS = 4000;
const EXTRACT_CONCURRENCY = 3;
const SENTINEL = "===BRIEF_JSON===";
const MAX_NEXT_QUESTIONS = 6;

// ─── Input cleaning ───────────────────────────────────────────────────────────

function cleanDocument(doc) {
  if (!doc || typeof doc !== "object") return null;
  const fileId = typeof doc.fileId === "string" ? doc.fileId.slice(0, 80) : "";
  if (!fileId) return null;
  return {
    fileId,
    fileName:
      typeof doc.fileName === "string" && doc.fileName.trim()
        ? doc.fileName.trim().slice(0, 180)
        : "uploaded document",
    category:
      typeof doc.category === "string" ? doc.category.slice(0, 60) : undefined,
    textExcerpt:
      typeof doc.textExcerpt === "string"
        ? doc.textExcerpt.slice(0, MAX_TEXT_CHARS)
        : "",
    images: Array.isArray(doc.images)
      ? doc.images
          .filter(
            (img) => typeof img === "string" && img.startsWith("data:image/"),
          )
          .slice(0, MAX_IMAGES_PER_DOC)
      : [],
    insight:
      doc.insight && typeof doc.insight === "object" ? doc.insight : undefined,
  };
}

function cleanInput(body) {
  const raw = body && typeof body === "object" ? body : {};
  return {
    mode: raw.mode === "synthesis" ? "synthesis" : "full",
    documents: (Array.isArray(raw.documents) ? raw.documents : [])
      .map(cleanDocument)
      .filter(Boolean)
      .slice(0, MAX_DOCUMENTS),
    answers: raw.answers && typeof raw.answers === "object" ? raw.answers : {},
    answeredDynamicQuestions: Array.isArray(raw.answeredDynamicQuestions)
      ? raw.answeredDynamicQuestions.slice(0, 20)
      : [],
    askedQuestionIds: Array.isArray(raw.askedQuestionIds)
      ? raw.askedQuestionIds
          .filter((id) => typeof id === "string")
          .slice(0, 40)
      : [],
  };
}

// ─── Extraction stage ─────────────────────────────────────────────────────────

export function buildExtractSystemPrompt() {
  return `You are a health intake assistant for Gen-H.
Your job is to prepare a Doctor Review Brief for a licensed clinician.
You may extract and summarize factual information that is visibly present in the uploaded health document (text and/or page images).
You must not diagnose, treat, recommend supplements or medications, interpret clinical severity, reassure the patient, or tell the patient what to do medically.
Use cautious doctor-preparation language.
Respond with a single JSON object only. Do not include any reasoning, analysis, or <think> blocks.

Allowed:
- identify document type
- identify provider/lab/clinic name if visible
- identify report date or collection date if visible
- list test categories or report sections if visible
- extract each visible marker with its printed value, unit, and reference range
- set a marker's "flag" ONLY when the report visibly marks it (H, L, High, Low, Abnormal, Out of range) OR the printed value falls outside the printed reference range on the same row; otherwise flag must be null
- generate review areas for the doctor based only on visible sections or flagged marker names
- ask one short context question that helps the doctor interpret the report

Not allowed:
- do not provide diagnosis
- do not provide treatment advice
- do not recommend supplements, medications, tests, or dosages
- do not say a condition is present
- do not say a result is safe, dangerous, urgent, severe, mild, normal, or concerning
- do not infer beyond the visible document content
- do not invent values, units, or reference ranges that are not printed
- do not generate a care plan

If the document is not readable or appears decorative/non-health-related, return the JSON with empty arrays and ask what the user wants the doctor to focus on.
Output valid JSON only.`;
}

export function buildExtractUserPrompt(doc) {
  const catLabel = doc.category
    ? `${doc.category.replace("_", " ")} report`
    : "health document";
  return `File: "${doc.fileName}" (${catLabel})
${doc.images.length > 0 ? `Attached: ${doc.images.length} page image(s) of the document.` : ""}
${doc.textExcerpt ? `Visible extracted text:\n${doc.textExcerpt}` : "No text layer — read the attached page images."}

Classify documentType as the most specific fit, e.g. one of:
"Blood test report", "Lipid panel", "Full blood count", "Metabolic panel",
"Thyroid panel", "Urine test", "Urinalysis", "Gut microbiome test",
"Physical assessment", "Body composition report", "DNA / genetic report",
"Wearable data export", "Health screening report" — or a better specific label.

Return JSON only:
{
  "documentType": "<1-5 word document type>",
  "provider": "<provider/lab/clinic name if visible, else null>",
  "reportDate": "<date if visible, else null>",
  "sections": ["<visible test category or report section>"],
  "markers": [
    {
      "name": "<marker name as printed>",
      "value": "<printed value, else null>",
      "unit": "<printed unit, else null>",
      "referenceRange": "<printed reference range, else null>",
      "flag": "high" | "low" | "abnormal" | null
    }
  ],
  "doctorReviewAreas": ["<safe review area, e.g. Lipid markers, Kidney markers>"],
  "patientFacingSummary": "<1-2 sentences, factual and safe, saying what was added for doctor review>",
  "question": "<one question under 18 words that helps the doctor interpret this report>"
}`;
}

function genericInsight(doc) {
  return {
    fileId: doc.fileId,
    documentType: "Health document",
    provider: null,
    reportDate: null,
    textExcerpt: doc.textExcerpt || "",
    sections: [],
    markers: [],
    visibleMarkers: [],
    flaggedMarkers: [],
    doctorReviewAreas: [],
    patientFacingSummary:
      "This document has been added to your Doctor Review Brief for your doctor to review before the consult.",
    question: "What should your doctor focus on in this document?",
    status: "needs_review",
  };
}

function cleanMarker(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = stringOrNull(raw.name);
  if (!name) return null;
  const flag = ["high", "low", "abnormal"].includes(raw.flag)
    ? raw.flag
    : null;
  return {
    name: name.slice(0, 80),
    value: stringOrNull(String(raw.value ?? "")) ?? undefined,
    unit: stringOrNull(String(raw.unit ?? "")) ?? undefined,
    referenceRange: stringOrNull(String(raw.referenceRange ?? "")) ?? undefined,
    flag,
  };
}

function parseExtractResponse(raw, doc) {
  const parsed = parseJsonObject(raw);
  const markers = (Array.isArray(parsed.markers) ? parsed.markers : [])
    .map(cleanMarker)
    .filter(Boolean)
    .slice(0, 80);
  const flaggedMarkers = markers.filter((m) => m.flag).map((m) => m.name);

  const insight = {
    fileId: doc.fileId,
    documentType:
      stringOrNull(parsed.documentType)?.slice(0, 60) ?? "Health document",
    provider: stringOrNull(parsed.provider),
    reportDate: stringOrNull(parsed.reportDate),
    textExcerpt: doc.textExcerpt || "",
    sections: stringArray(parsed.sections, 30),
    markers,
    visibleMarkers: markers.map((m) => m.name),
    flaggedMarkers,
    doctorReviewAreas: stringArray(parsed.doctorReviewAreas, 12),
    patientFacingSummary:
      stringOrNull(parsed.patientFacingSummary) ??
      "This document has been added to your Doctor Review Brief for doctor review.",
    question:
      stringOrNull(parsed.question) ??
      "Is there anything specific in this document you'd like your doctor to focus on?",
    status: "done",
  };

  const hasStructure =
    insight.sections.length > 0 ||
    insight.markers.length > 0 ||
    insight.doctorReviewAreas.length > 0 ||
    insight.provider ||
    insight.reportDate;
  if (!hasStructure) return genericInsight(doc);
  return insight;
}

async function extractDocument(doc, env, signal, usage) {
  const textPart = buildExtractUserPrompt(doc);
  const content =
    doc.images.length > 0
      ? [
          { type: "text", text: textPart },
          ...doc.images.map((url) => ({
            type: "image_url",
            image_url: { url },
          })),
        ]
      : textPart;

  const { content: raw, usage: callUsage } = await chatCompletion(
    {
      messages: [
        { role: "system", content: buildExtractSystemPrompt() },
        { role: "user", content },
      ],
      maxTokens: EXTRACT_MAX_TOKENS,
      responseFormat: "json",
      tag: "extract",
    },
    env,
    signal,
  );
  usage.calls += 1;
  usage.totalTokens += callUsage?.total_tokens ?? 0;
  return parseExtractResponse(raw, doc);
}

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items.entries()];
  const runners = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length > 0) {
        const [index, item] = queue.shift();
        await worker(item, index);
      }
    },
  );
  await Promise.all(runners);
}

// ─── Classify stage (pure JS) ─────────────────────────────────────────────────

function sourceLabelFor(insight, doc) {
  return (
    [insight.documentType, insight.provider].filter(Boolean).join(" · ") ||
    doc.fileName
  );
}

function classifyFindings(documents, insightsById) {
  const findings = [];
  for (const doc of documents) {
    const insight = insightsById.get(doc.fileId);
    if (!insight) continue;
    const markers = Array.isArray(insight.markers) ? insight.markers : [];
    markers.forEach((marker, index) => {
      const canonicalKey = canonicalKeyFor(marker.name);
      findings.push({
        id: `${doc.fileId}:${canonicalKey ?? "m"}:${index}`,
        name: marker.name,
        canonicalKey,
        value: marker.value,
        unit: marker.unit,
        referenceRange: marker.referenceRange,
        flag: marker.flag ?? null,
        panel: panelFor(canonicalKey),
        sourceFileId: doc.fileId,
        sourceLabel: sourceLabelFor(insight, doc),
      });
    });
  }
  return findings;
}

// ─── Compose stage ────────────────────────────────────────────────────────────

function buildComposeSystemPrompt() {
  return `You are preparing a Doctor Review Brief for a licensed clinician.
Use only the extracted document facts and patient answers provided in JSON.
Use ALL documents together; do not stop after the first one.
Create cautious doctor-preparation synthesis, not diagnosis, treatment, triage, reassurance, or a care plan.

Allowed:
- group visible document facts into safe doctor-review themes
- point out markers whose printed values sit outside their printed reference ranges (factual restatement only)
- note relationships between markers a clinician would review together (e.g. creatinine and eGFR, ALT and GGT, ferritin and haemoglobin) — restate only the printed directions ("X is above its range while Y is below"); never use words like concern, issue, risk, problem, suggest, indicate, or potential
- suggest lifestyle or behavioural context worth investigating, phrased as areas to explore, never as causes
- suggest questions the doctor may want to ask the patient
- propose short context questions to ask the PATIENT now, each tied to specific out-of-range markers; each must gather a NEW lifestyle, diet, supplement, symptom, or history fact that helps interpret that marker (e.g. for high creatinine: "Do you take creatine or train intensively most weeks?"). Never ask whether the patient "wants to discuss" or "has questions about" a result — ask for the fact itself

Not allowed:
- do not say the patient has a condition
- do not say a result is safe, dangerous, urgent, severe, mild, or concerning
- do not recommend supplements, medication, tests, dosages, or treatment
- do not tell the patient what to do medically
- do not invent values, markers, symptoms, or history

Output protocol — follow it EXACTLY:
1. First line: NARRATIVE:
2. Then 2-4 sentences of cautious doctor-prep prose summarising what the brief now understands.
3. Then a line containing exactly: ${SENTINEL}
4. Then one valid JSON object matching the requested schema. Nothing after it.`;
}

function buildComposeUserPrompt(input, findings) {
  const outOfRange = findings.filter((f) => f.flag);
  const inRangeNames = findings
    .filter((f) => !f.flag)
    .map((f) => f.name)
    .slice(0, 60);

  // Richest 2 excerpts give the model surrounding context without re-sending
  // every document body.
  const excerpts = input.documents
    .map((doc) => ({
      fileName: doc.fileName,
      text: (doc.insight?.textExcerpt ?? doc.textExcerpt ?? "").slice(0, 8000),
    }))
    .filter((d) => d.text.length > 200)
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 2);

  const composeInput = {
    documents: input.documents.map((doc) => ({
      fileName: doc.fileName,
      documentType: doc.insight?.documentType,
      provider: doc.insight?.provider,
      sections: doc.insight?.sections ?? [],
    })),
    outOfRangeMarkers: outOfRange.map((f) => ({
      name: f.name,
      value: f.value,
      unit: f.unit,
      referenceRange: f.referenceRange,
      flag: f.flag,
      panel: f.panel,
      source: f.sourceLabel,
    })),
    inRangeMarkerNames: inRangeNames,
    patientAnswers: input.answers,
    answeredContextQuestions: input.answeredDynamicQuestions,
    doNotRepeatQuestionIds: input.askedQuestionIds,
    excerpts,
  };

  return `Input JSON:
${JSON.stringify(composeInput).slice(0, 32_000)}

After the ${SENTINEL} line, return this JSON object:
{
  "relationships": [
    {
      "id": "<stable short id>",
      "title": "<pattern a clinician reviews together, e.g. Creatinine and eGFR move together>",
      "markers": ["<marker name>", "<marker name>"],
      "note": "<1-2 factual sentences, no severity or diagnosis>"
    }
  ],
  "lifestyleContext": ["<lifestyle/behavioural area worth investigating, tied to the data>"],
  "doctorQuestions": ["<question the doctor may want to ask the patient>"],
  "themes": [
    {
      "id": "<stable short id>",
      "title": "<doctor-review topic phrased as markers/areas to review, e.g. Kidney markers to review — never words like abnormality, deficiency, disease, or disorder>",
      "summary": "<1-2 sentences, factual, not diagnostic>",
      "evidence": [{"label":"<marker/section/answer>", "source":"<document or patient answer>"}],
      "confidence": "high|medium|low"
    }
  ],
  "nextQuestions": [
    {
      "id": "<stable short id>",
      "prompt": "<one question to the patient, under 18 words>",
      "options": ["<option>", "<option>", "<option>"],
      "allowFreeText": true,
      "whyWeAsk": "<one sentence>",
      "triggeredBy": ["<marker name that prompted this>"]
    }
  ]
}
Do not repeat any question whose id is in doNotRepeatQuestionIds or whose topic the patient already answered.
Limit: up to 4 relationships, 5 lifestyleContext items, 5 doctorQuestions, 6 themes, 3 nextQuestions.`;
}

function buildComposeRepairPrompt(raw, input, findings) {
  return `The previous response did not follow the required output protocol.
Return ONLY the corrected JSON object (the schema previously requested, plus a "narrative" string field with 2-4 cautious doctor-prep sentences). No markdown, no prose, no sentinel.

Previous response:
${String(raw ?? "").slice(0, 4000)}

${buildComposeUserPrompt(input, findings).slice(0, 24_000)}`;
}

function cleanEvidence(value) {
  return Array.isArray(value)
    ? value
        .slice(0, 5)
        .map((e) => ({
          label: typeof e?.label === "string" ? e.label.trim() : "",
          source: stringOrNull(e?.source) ?? undefined,
        }))
        .filter((e) => e.label)
    : [];
}

function cleanThemes(value) {
  return (Array.isArray(value) ? value : []).slice(0, 6).map((theme, i) => ({
    id: stringOrNull(theme?.id) ?? `theme-${i + 1}`,
    title: stringOrNull(theme?.title) ?? "Topic for doctor review",
    summary:
      stringOrNull(theme?.summary) ??
      "Prepared as a topic for your doctor to review.",
    evidence: cleanEvidence(theme?.evidence),
    confidence: ["high", "medium", "low"].includes(theme?.confidence)
      ? theme.confidence
      : "medium",
  }));
}

function cleanRelationships(value) {
  return (Array.isArray(value) ? value : [])
    .slice(0, 4)
    .map((rel, i) => ({
      id: stringOrNull(rel?.id) ?? `rel-${i + 1}`,
      title: stringOrNull(rel?.title) ?? "",
      markers: stringArray(rel?.markers, 6),
      note: stringOrNull(rel?.note) ?? "",
    }))
    .filter((rel) => rel.title && rel.markers.length > 0);
}

function cleanNextQuestions(value, askedIds) {
  return (Array.isArray(value) ? value : [])
    .slice(0, 4)
    .map((q, i) => ({
      id: stringOrNull(q?.id) ?? `ai_q_${i + 1}`,
      prompt: stringOrNull(q?.prompt) ?? "",
      options: stringArray(q?.options, 6),
      allowFreeText: q?.allowFreeText !== false,
      whyWeAsk:
        stringOrNull(q?.whyWeAsk) ??
        "This helps your doctor interpret your results in context.",
      triggeredBy: stringArray(q?.triggeredBy, 6),
      origin: "ai",
    }))
    .filter((q) => q.prompt && !askedIds.includes(q.id));
}

function normalizePrompt(prompt) {
  return prompt.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

/** Curated rule questions take precedence (they encode the product's clinical
 *  examples verbatim); AI questions backfill markers the rule bank doesn't
 *  cover. Dedupe by id, normalized prompt, and trigger overlap. */
function mergeQuestions(ruleQuestions, aiQuestions, askedIds) {
  const merged = [];
  const seenPrompts = new Set();
  const coveredTriggers = new Set();

  for (const q of [...ruleQuestions, ...aiQuestions]) {
    if (merged.length >= MAX_NEXT_QUESTIONS) break;
    if (askedIds.includes(q.id)) continue;
    const promptKey = normalizePrompt(q.prompt);
    if (!promptKey || seenPrompts.has(promptKey)) continue;
    const triggers = (q.triggeredBy ?? []).map((t) => t.toLowerCase());
    if (triggers.length > 0 && triggers.every((t) => coveredTriggers.has(t)))
      continue;
    seenPrompts.add(promptKey);
    triggers.forEach((t) => coveredTriggers.add(t));
    merged.push(q);
  }
  return merged;
}

// ─── Deterministic fallback (no LLM) ──────────────────────────────────────────

function fallbackThemes(findings, documents, insightsById) {
  const themes = [];
  const outOfRange = findings.filter((f) => f.flag);

  if (outOfRange.length > 0) {
    const byPanel = new Map();
    for (const f of outOfRange) {
      const panel = f.panel ?? "other";
      if (!byPanel.has(panel)) byPanel.set(panel, []);
      byPanel.get(panel).push(f);
    }
    for (const [panel, group] of byPanel) {
      if (themes.length >= 6) break;
      const label = PANEL_LABELS[panel] ?? "Markers";
      themes.push({
        id: `fb-${panel}`,
        title: `${label} outside printed ranges`,
        summary: `The report shows ${group
          .slice(0, 5)
          .map((f) => f.name)
          .join(", ")} outside the printed reference range, prepared for your doctor to review in context.`,
        evidence: group.slice(0, 5).map((f) => ({
          label: f.name,
          source: f.sourceLabel,
        })),
        confidence: "high",
      });
    }
  }

  if (themes.length === 0) {
    for (const doc of documents) {
      const insight = insightsById.get(doc.fileId);
      const areas = stringArray(insight?.doctorReviewAreas, 5);
      if (areas.length === 0) continue;
      themes.push({
        id: `fb-areas-${doc.fileId.slice(0, 6)}`,
        title: "Report areas prepared for doctor review",
        summary: `The upload includes ${areas.join(", ")} as areas for clinician review.`,
        evidence: areas.map((a) => ({
          label: a,
          source: insight ? sourceLabelFor(insight, doc) : doc.fileName,
        })),
        confidence: "medium",
      });
      if (themes.length >= 6) break;
    }
  }
  return themes;
}

function buildFallbackSynthesis(input, findings, insightsById) {
  const outOfRange = findings.filter((f) => f.flag);
  const themes = fallbackThemes(findings, input.documents, insightsById);
  const ruleQuestions = matchRules(outOfRange);
  const nextQuestions = mergeQuestions(ruleQuestions, [], input.askedQuestionIds);

  return {
    status: "ready",
    narrative:
      findings.length > 0
        ? `Your ${input.documents.length > 1 ? "reports have" : "report has"} been read into the Doctor Review Brief — ${findings.length} markers captured, ${outOfRange.length} outside their printed ranges. The sections below group what your doctor will review in context.`
        : "Your documents have been added to the Doctor Review Brief. Add what you want your doctor to focus on so the consult starts with useful context.",
    themes,
    outOfRange,
    relationships: [],
    lifestyleContext: [],
    doctorQuestions: [],
    nextQuestions,
    progress: {
      documentsRead: input.documents.length,
      markersRead: findings.length,
      outOfRangeCount: outOfRange.length,
      questionsQueued: nextQuestions.length,
    },
    updatedAt: new Date().toISOString(),
  };
}

// ─── Pipeline entry point ─────────────────────────────────────────────────────

export async function runBriefPipeline(body, emit, options = {}) {
  const env = options.env ?? process.env;
  const signal = options.signal;
  const usage = { calls: 0, totalTokens: 0 };
  const input = cleanInput(body);

  try {
    resolveModel(env); // fail fast + visibly on key/model config problems
  } catch (error) {
    emit("error", {
      stage: "extract",
      message: error.message,
      recoverable: false,
    });
    emit("done", { usage });
    return;
  }

  const insightsById = new Map();
  // Synthesis mode reuses prior insights so extraction never re-runs when only
  // answers changed.
  for (const doc of input.documents) {
    if (doc.insight) insightsById.set(doc.fileId, doc.insight);
  }

  try {
    // ── Stage 1: extract ──────────────────────────────────────────────────────
    if (input.mode === "full") {
      const pending = input.documents.filter(
        (doc) => !insightsById.has(doc.fileId),
      );
      if (pending.length > 0) {
        emit("stage", {
          stage: "extract",
          status: "start",
          label: "Reading your documents",
          detail: `${pending.length} ${pending.length === 1 ? "file" : "files"}`,
        });

        await runWithConcurrency(pending, EXTRACT_CONCURRENCY, async (doc) => {
          emit("doc", { fileId: doc.fileId, status: "extracting" });
          if (!doc.textExcerpt.trim() && doc.images.length === 0) {
            const insight = genericInsight(doc);
            insightsById.set(doc.fileId, insight);
            emit("doc", {
              fileId: doc.fileId,
              status: "needs_review",
              insight,
            });
            return;
          }
          try {
            const insight = await extractDocument(doc, env, signal, usage);
            insightsById.set(doc.fileId, insight);
            emit("doc", { fileId: doc.fileId, status: insight.status, insight });
          } catch (error) {
            if (isAuthError(error) || signal?.aborted) throw error;
            console.log(
              JSON.stringify({
                event: "extract_degraded",
                fileId: doc.fileId,
                error: error instanceof Error ? error.message : String(error),
              }),
            );
            const insight = genericInsight(doc);
            insightsById.set(doc.fileId, insight);
            emit("error", {
              stage: "extract",
              fileId: doc.fileId,
              message: "This document couldn't be read automatically — it stays attached for your doctor.",
              recoverable: true,
            });
            emit("doc", {
              fileId: doc.fileId,
              status: "needs_review",
              insight,
            });
          }
        });

        const markerTotal = [...insightsById.values()].reduce(
          (n, i) => n + (i.markers?.length ?? 0),
          0,
        );
        emit("stage", {
          stage: "extract",
          status: "done",
          label: "Documents read",
          detail: `${markerTotal} ${markerTotal === 1 ? "marker" : "markers"} found`,
        });
      }
    }

    // ── Stage 2: classify (zero LLM cost) ─────────────────────────────────────
    emit("stage", {
      stage: "classify",
      status: "start",
      label: "Checking markers against reference ranges",
    });
    const findings = classifyFindings(input.documents, insightsById);
    const outOfRange = findings.filter((f) => f.flag);
    for (const finding of outOfRange) emit("finding", { finding });
    emit("stage", {
      stage: "classify",
      status: "done",
      label: "Reference ranges checked",
      detail:
        findings.length > 0
          ? `${outOfRange.length} of ${findings.length} markers outside printed ranges`
          : "No structured markers found",
    });

    // ── Stage 3: compose ──────────────────────────────────────────────────────
    emit("stage", {
      stage: "compose",
      status: "start",
      label: "Connecting the dots across your reports",
    });

    const hasAnswerSignal =
      Object.values(input.answers).some((v) =>
        Array.isArray(v)
          ? v.length > 0
          : typeof v === "string"
            ? v.trim()
            : v && typeof v === "object"
              ? Object.values(v).some((x) => typeof x === "string" && x.trim())
              : false,
      ) || input.answeredDynamicQuestions.length > 0;
    const hasDocSignal = [...insightsById.values()].some(
      (i) =>
        (i.markers?.length ?? 0) > 0 ||
        (i.sections?.length ?? 0) > 0 ||
        (i.textExcerpt ?? "").trim().length > 200,
    );

    let synthesis;
    let degraded = false;

    if (!hasDocSignal && !hasAnswerSignal) {
      // Nothing to synthesize — deterministic minimal brief, zero LLM cost.
      synthesis = buildFallbackSynthesis(input, findings, insightsById);
    } else {
      // Attach fresh insights so compose sees extraction output from this run.
      const composeDocs = input.documents.map((doc) => ({
        ...doc,
        insight: insightsById.get(doc.fileId) ?? doc.insight,
      }));
      const composeInput = { ...input, documents: composeDocs };

      try {
        synthesis = await composeBrief(composeInput, findings, emit, env, signal, usage);
      } catch (error) {
        if (isAuthError(error) || signal?.aborted) throw error;
        console.log(
          JSON.stringify({
            event: "compose_degraded",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
        emit("error", {
          stage: "compose",
          message:
            "The full synthesis pass didn't complete — the brief below was prepared with basic matching instead.",
          recoverable: true,
        });
        synthesis = buildFallbackSynthesis(input, findings, insightsById);
        degraded = true;
      }
    }

    emit("stage", {
      stage: "compose",
      status: "done",
      label: "Brief prepared",
      detail: [
        `${synthesis.progress.markersRead} markers read`,
        `${synthesis.progress.outOfRangeCount} outside ranges`,
        `${synthesis.progress.questionsQueued} ${synthesis.progress.questionsQueued === 1 ? "question" : "questions"} for you`,
      ].join(" · "),
    });
    emit("brief", { synthesis, degraded });
    emit("done", { usage });
  } catch (error) {
    if (signal?.aborted) return; // client left — nothing to emit to
    emit("error", {
      stage: "compose",
      message: isAuthError(error)
        ? error.message
        : "Something went wrong while preparing the brief. Your uploads are safe — try again.",
      recoverable: !isAuthError(error),
    });
    emit("done", { usage });
  }
}

/** One streaming compose call (+ at most one strict repair). Emits deltas + partial events. */
async function composeBrief(input, findings, emit, env, signal, usage) {
  const messages = [
    { role: "system", content: buildComposeSystemPrompt() },
    { role: "user", content: buildComposeUserPrompt(input, findings) },
  ];

  let acc = "";
  let narrativeStart = -1;
  let sentinelIndex = -1;
  let emittedChars = 0;

  const streamOnce = () =>
    chatCompletionStream(
    {
      messages,
      maxTokens: COMPOSE_MAX_TOKENS,
      tag: "compose",
      onDelta: (delta) => {
        acc += delta;
        if (narrativeStart < 0) {
          const idx = acc.indexOf("NARRATIVE:");
          if (idx < 0) return;
          narrativeStart = idx + "NARRATIVE:".length;
        }
        if (sentinelIndex < 0) {
          const idx = acc.indexOf(SENTINEL);
          if (idx >= 0) sentinelIndex = idx;
        }
        // Hold back a sentinel-length tail so a split sentinel never leaks into
        // the streamed narrative.
        const safeEnd =
          sentinelIndex >= 0
            ? sentinelIndex
            : Math.max(narrativeStart, acc.length - SENTINEL.length);
        const chunk = acc.slice(narrativeStart + emittedChars, safeEnd);
        if (chunk) {
          emittedChars += chunk.length;
          emit("narrative_delta", { text: chunk });
        }
      },
    },
    env,
    signal,
    );

  let content = "";
  let callUsage;
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await streamOnce();
      content = result.content;
      callUsage = result.usage;
      break;
    } catch (error) {
      if (isAuthError(error) || signal?.aborted) throw error;
      if (attempt === 0 && emittedChars === 0) {
        // Nothing reached the client yet — wait out a rate-limit window and
        // retry once (an errored stream bills nothing).
        acc = "";
        narrativeStart = -1;
        sentinelIndex = -1;
        await new Promise((r) =>
          setTimeout(r, error?.httpStatus === 429 ? 2500 : 800),
        );
        continue;
      }
      // Mid-stream failure after content arrived — salvage what streamed; the
      // parse → repair chain below recovers the JSON from the partial output.
      content = acc;
      break;
    }
  }
  usage.calls += 1;
  usage.totalTokens += callUsage?.total_tokens ?? 0;

  let narrative = "";
  let parsed;
  const finalSentinel = content.indexOf(SENTINEL);
  if (narrativeStart >= 0 && finalSentinel >= 0) {
    narrative = content.slice(narrativeStart, finalSentinel).trim();
    // Flush any narrative held back before the sentinel was confirmed.
    const remaining = content
      .slice(narrativeStart + emittedChars, finalSentinel)
      .trimEnd();
    if (remaining) emit("narrative_delta", { text: remaining });
    try {
      parsed = parseJsonObject(content.slice(finalSentinel + SENTINEL.length));
    } catch {
      parsed = undefined;
    }
  } else {
    // Protocol not followed — the whole payload may still contain the object.
    try {
      parsed = parseJsonObject(content);
      narrative = stringOrNull(parsed?.narrative) ?? "";
    } catch {
      parsed = undefined;
    }
  }

  if (!parsed) {
    // One strict, non-streaming repair pass.
    const { content: repaired, usage: repairUsage } = await chatCompletion(
      {
        messages: [
          { role: "system", content: buildComposeSystemPrompt() },
          {
            role: "user",
            content: buildComposeRepairPrompt(content, input, findings),
          },
        ],
        maxTokens: COMPOSE_REPAIR_MAX_TOKENS,
        responseFormat: "json",
        tag: "compose_repair",
      },
      env,
      signal,
    );
    usage.calls += 1;
    usage.totalTokens += repairUsage?.total_tokens ?? 0;
    parsed = parseJsonObject(repaired);
    if (!narrative) narrative = stringOrNull(parsed?.narrative) ?? "";
    if (narrative && emittedChars === 0)
      emit("narrative_delta", { text: narrative });
  }

  const outOfRange = findings.filter((f) => f.flag);
  const themes = cleanThemes(parsed.themes);
  const relationships = cleanRelationships(parsed.relationships);
  const lifestyleContext = stringArray(parsed.lifestyleContext, 5);
  const doctorQuestions = stringArray(parsed.doctorQuestions, 5);
  const aiQuestions = cleanNextQuestions(
    parsed.nextQuestions,
    input.askedQuestionIds,
  );
  const ruleQuestions = matchRules(outOfRange);
  const nextQuestions = mergeQuestions(
    ruleQuestions,
    aiQuestions,
    input.askedQuestionIds,
  );

  for (const relationship of relationships) emit("relationship", { relationship });
  for (const theme of themes) emit("theme", { theme });
  for (const question of nextQuestions) emit("question", { question });

  return {
    status: "ready",
    narrative:
      narrative ||
      "Your uploads and answers have been read into the Doctor Review Brief for your doctor to review in context.",
    themes,
    outOfRange,
    relationships,
    lifestyleContext,
    doctorQuestions,
    nextQuestions,
    progress: {
      documentsRead: input.documents.length,
      markersRead: findings.length,
      outOfRangeCount: outOfRange.length,
      questionsQueued: nextQuestions.length,
    },
    updatedAt: new Date().toISOString(),
  };
}
