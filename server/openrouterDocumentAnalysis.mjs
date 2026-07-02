const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";
// Default remains free; set OPENROUTER_MODEL to an allowlisted paid model for
// controlled paid test runs.
const DEFAULT_MODEL = "openrouter/free";
const ALLOWED_MODELS = new Set([
  "openrouter/free",
  "nvidia/nemotron-3-nano-omni:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "openai/gpt-4o-mini",
]);
const MAX_TOKENS = 1400;
const RETRY_MAX_TOKENS = 2000;
const SYNTHESIS_MAX_TOKENS = 2200;
const SYNTHESIS_RETRY_MAX_TOKENS = 2600;

const PROVIDER_GUARD = {
  allow_fallbacks: false,
  require_parameters: true,
};

function json(status, payload) {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function isAllowedModel(model) {
  return ALLOWED_MODELS.has(model);
}

function buildSystemPrompt() {
  return `You are a health intake assistant for Gen-H.
Your job is to prepare a Doctor Review Brief for a licensed clinician.
You may extract and summarize factual information that is visibly present in the uploaded health document.
You must not diagnose, treat, recommend supplements or medications, interpret clinical severity, reassure the patient, or tell the patient what to do medically.
Use cautious doctor-preparation language.
Respond with a single JSON object only. Do not include any reasoning, analysis, or <think> blocks.

Allowed:
- identify document type
- identify provider/lab/clinic name if visible
- identify report date or collection date if visible
- list test categories or report sections if visible
- list marker names if visible
- list marker names that are visibly flagged H, L, High, Low, Abnormal, Out of range, or outside reference range
- generate review areas for the doctor based only on visible sections or visibly flagged marker names
- ask one short context question that helps the doctor interpret the report

Not allowed:
- do not provide diagnosis
- do not provide treatment advice
- do not recommend supplements, medications, tests, or dosages
- do not say a condition is present
- do not say a result is safe, dangerous, urgent, severe, mild, normal, or concerning
- do not infer beyond the visible document text
- do not use the phrase "AI analyzed your health"
- do not generate a care plan

If the document is not readable or appears decorative/non-health-related, return a generic health document response and ask what the user wants the doctor to focus on.
Output valid JSON only.`;
}

function buildUserPrompt(fileName, category, textExcerpt) {
  const catLabel = category
    ? `${category.replace("_", " ")} report`
    : "health document";

  return `File: "${fileName}" (${catLabel})

Visible extracted text:
${textExcerpt ? textExcerpt.slice(0, 12_000) : ""}

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
  "visibleMarkers": ["<marker name only, no values>"],
  "flaggedMarkers": ["<marker name only if visibly marked H/L/High/Low/Out of range/Abnormal>"],
  "doctorReviewAreas": ["<safe review area, e.g. Lipid markers, Kidney markers, Blood sugar markers>"],
  "patientFacingSummary": "<1-2 sentences, factual and safe, saying what was added for doctor review>",
  "question": "<one question under 18 words that helps the doctor interpret this report>"
}`;
}

function genericResult() {
  return {
    documentType: "Health document",
    provider: null,
    reportDate: null,
    sections: [],
    visibleMarkers: [],
    flaggedMarkers: [],
    doctorReviewAreas: [],
    patientFacingSummary:
      "This document has been added to your Doctor Review Brief for your doctor to review before the consult.",
    question: "What should your doctor focus on in this document?",
    extractionStatus: "needs_review",
  };
}

function stringOrNull(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value, limit = 12) {
  return Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim())
        .slice(0, limit)
    : [];
}

function parseModelResponse(raw) {
  let text = String(raw ?? "");
  // Remove closed reasoning blocks, then any unclosed trailing <think> (reasoning
  // models that run out of tokens leave <think> open with no JSON after it).
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/<think>[\s\S]*$/gi, "");
  // Strip ```json fences if present.
  text = text.replace(/```(?:json)?/gi, "").trim();

  // Prefer the last balanced object (the JSON usually comes after any preamble).
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object in model response.");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    documentType:
      typeof parsed.documentType === "string" && parsed.documentType.trim()
        ? parsed.documentType.trim()
        : "Health document",
    provider: stringOrNull(parsed.provider),
    reportDate: stringOrNull(parsed.reportDate),
    sections: stringArray(parsed.sections, 30),
    visibleMarkers: stringArray(parsed.visibleMarkers, 80),
    flaggedMarkers: stringArray(parsed.flaggedMarkers, 30),
    doctorReviewAreas: stringArray(parsed.doctorReviewAreas, 12),
    patientFacingSummary:
      typeof parsed.patientFacingSummary === "string" &&
      parsed.patientFacingSummary.trim()
        ? parsed.patientFacingSummary.trim()
        : "This document has been added to your Doctor Review Brief for doctor review.",
    question:
      typeof parsed.question === "string" && parsed.question.trim()
        ? parsed.question.trim()
        : "Is there anything specific in this document you'd like your doctor to focus on?",
    extractionStatus: "extracted",
  };
}

function parseJsonObject(raw) {
  let text = String(raw ?? "");
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/<think>[\s\S]*$/gi, "");
  text = text.replace(/```(?:json)?/gi, "").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object in model response.");
  return JSON.parse(jsonMatch[0]);
}

function hasConfidentDocumentStructure(result, input) {
  return (
    !!input.textExcerpt?.trim() &&
    (result.sections.length > 0 ||
      result.visibleMarkers.length > 0 ||
      result.flaggedMarkers.length > 0 ||
      result.doctorReviewAreas.length > 0 ||
      result.provider ||
      result.reportDate)
  );
}

function cleanInput(body) {
  const fileName =
    typeof body.fileName === "string" && body.fileName.trim()
      ? body.fileName.trim().slice(0, 180)
      : "uploaded document";
  const fileType =
    typeof body.fileType === "string"
      ? body.fileType.slice(0, 120)
      : "application/octet-stream";
  const category =
    typeof body.category === "string" ? body.category.slice(0, 60) : undefined;
  const textExcerpt =
    typeof body.textExcerpt === "string"
      ? body.textExcerpt.slice(0, 12_000)
      : undefined;

  return { fileName, fileType, category, textExcerpt };
}

export async function analyzeDocumentWithOpenRouter(body, env = process.env) {
  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const retryOnParseError = env.OPENROUTER_RETRY_ON_PARSE_ERROR === "true";

  if (!apiKey) {
    return json(500, {
      ok: false,
      error: "OpenRouter API key is not configured on the server.",
    });
  }

  if (!isAllowedModel(model)) {
    return json(400, {
      ok: false,
      error: `Blocked OpenRouter model "${model}". Only explicitly allowlisted models are permitted.`,
    });
  }

  let input;
  try {
    input = cleanInput(body ?? {});
  } catch (error) {
    return json(400, { ok: false, error: error.message });
  }

  if (!input.textExcerpt?.trim()) {
    return json(200, { ok: true, result: genericResult() });
  }

  const messages = [
    {
      role: "system",
      content: buildSystemPrompt(),
    },
    {
      role: "user",
      content: buildUserPrompt(
        input.fileName,
        input.category,
        input.textExcerpt,
      ),
    },
  ];

  async function requestCompletion(strict, maxTokens) {
    const requestMessages = strict
      ? [
          ...messages,
          {
            role: "user",
            content:
              "Return ONLY the JSON object described above — no analysis, no <think>, no prose.",
          },
        ]
      : messages;

    const res = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          env.APP_URL || env.OPENROUTER_HTTP_REFERER || "http://localhost:5173",
        "X-Title": "Gen-H Doctor Review Brief",
      },
      body: JSON.stringify({
        model,
        provider: PROVIDER_GUARD,
        messages: requestMessages,
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      const err = new Error(
        `OpenRouter request failed with status ${res.status}.`,
      );
      err.httpStatus = res.status;
      err.detail = errorBody.slice(0, 240);
      throw err;
    }

    const data = await res.json();
    console.log(
      JSON.stringify({
        event: "openrouter_completion",
        id: data?.id,
        model: data?.model,
        prompt_tokens: data?.usage?.prompt_tokens,
        completion_tokens: data?.usage?.completion_tokens,
        total_tokens: data?.usage?.total_tokens,
        cost: data?.usage?.cost,
      }),
    );
    return parseModelResponse(data?.choices?.[0]?.message?.content ?? "");
  }

  let lastError;
  try {
    let result;
    try {
      result = await requestCompletion(false, MAX_TOKENS);
    } catch (firstError) {
      lastError = firstError;
      // A genuine auth/config problem should be visible, not silently degraded.
      if (firstError.httpStatus === 401 || firstError.httpStatus === 403) {
        return json(firstError.httpStatus, {
          ok: false,
          error: "OpenRouter authentication failed — check OPENROUTER_API_KEY.",
          detail: firstError.detail,
        });
      }
      if (!retryOnParseError) throw firstError;
      // Optional: retry once, stricter and with more headroom (covers partial JSON).
      // Keep this disabled for paid test runs unless you intentionally accept the
      // chance of two billable completions for one upload.
      result = await requestCompletion(true, RETRY_MAX_TOKENS);
    }

    if (!hasConfidentDocumentStructure(result, input)) {
      return json(200, { ok: true, result: genericResult() });
    }
    return json(200, { ok: true, result });
  } catch (error) {
    // Never hard-fail the upload: degrade to a "needs review" result so the file
    // still attaches to the brief and the member's flow is never blocked.
    console.log(
      JSON.stringify({
        event: "analysis_degraded",
        error: error instanceof Error ? error.message : String(error),
        first_error: lastError instanceof Error ? lastError.message : undefined,
      }),
    );
    return json(200, { ok: true, result: genericResult() });
  }
}

function cleanSynthesisInput(body) {
  const documents = Array.isArray(body.documents)
    ? body.documents.slice(0, 8)
    : [];
  const answers =
    body.answers && typeof body.answers === "object" ? body.answers : {};
  const answeredDynamicQuestions = Array.isArray(body.answeredDynamicQuestions)
    ? body.answeredDynamicQuestions.slice(0, 20)
    : [];

  return { documents, answers, answeredDynamicQuestions };
}

function uniqueStrings(values, limit = 8) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

function evidenceFor(doc, labels, limit = 5) {
  return uniqueStrings(labels, limit).map((label) => ({
    label,
    source: doc.fileName || doc.documentType || "Uploaded report",
  }));
}

function markerMatches(markers, terms) {
  return uniqueStrings(
    markers.filter((marker) => {
      const normalized = marker.toLowerCase();
      return terms.some((term) => normalized.includes(term));
    }),
    8,
  );
}

function buildFallbackThemes(input) {
  const themes = [];
  const allMarkers = [];
  const markerDocs = new Map();

  for (const doc of input.documents) {
    const visibleMarkers = Array.isArray(doc.visibleMarkers)
      ? doc.visibleMarkers
      : [];
    const flaggedMarkers = Array.isArray(doc.flaggedMarkers)
      ? doc.flaggedMarkers
      : [];
    const reviewAreas = Array.isArray(doc.doctorReviewAreas)
      ? doc.doctorReviewAreas
      : [];
    const sections = Array.isArray(doc.sections) ? doc.sections : [];

    [...visibleMarkers, ...flaggedMarkers].forEach((marker) => {
      if (typeof marker !== "string" || !marker.trim()) return;
      allMarkers.push(marker);
      markerDocs.set(marker.toLowerCase(), doc);
    });

    const flagged = uniqueStrings(flaggedMarkers, 6);
    if (flagged.length > 0) {
      themes.push({
        id: `flagged-${themes.length + 1}`,
        title: "Markers flagged in the uploaded report",
        summary: `The report visibly flags ${flagged.join(", ")} for your doctor to review in context.`,
        evidence: evidenceFor(doc, flagged),
        confidence: "high",
      });
    }

    const areas = uniqueStrings(reviewAreas, 5);
    if (areas.length > 0) {
      themes.push({
        id: `areas-${themes.length + 1}`,
        title: "Report areas prepared for doctor review",
        summary: `The upload includes ${areas.join(", ")} as areas for clinician review.`,
        evidence: evidenceFor(doc, areas),
        confidence: sections.length > 0 ? "high" : "medium",
      });
    }
  }

  const clusters = [
    {
      id: "lipids",
      title: "Lipid and cardiovascular markers to review",
      terms: [
        "cholesterol",
        "ldl",
        "hdl",
        "triglycer",
        "apob",
        "apo b",
        "lp(a)",
      ],
    },
    {
      id: "kidney",
      title: "Kidney and uric acid markers to review",
      terms: ["creatinine", "egfr", "urea", "uric", "albumin/creatinine"],
    },
    {
      id: "blood-count",
      title: "Blood count markers to review",
      terms: [
        "haemoglobin",
        "hemoglobin",
        "haematocrit",
        "hematocrit",
        "mcv",
        "mch",
        "platelet",
        "white blood",
        "neutrophil",
        "lymphocyte",
      ],
    },
    {
      id: "metabolic",
      title: "Blood sugar and metabolic markers to review",
      terms: ["glucose", "hba1c", "insulin", "homa", "fasting"],
    },
    {
      id: "liver",
      title: "Liver enzyme markers to review",
      terms: ["alt", "ast", "ggt", "bilirubin", "alkaline phosphatase"],
    },
    {
      id: "iron",
      title: "Iron status markers to review",
      terms: ["iron", "ferritin", "transferrin", "tibc"],
    },
  ];

  for (const cluster of clusters) {
    if (themes.length >= 6) break;
    const markers = markerMatches(allMarkers, cluster.terms);
    if (markers.length === 0) continue;
    const evidence = markers.slice(0, 5).map((marker) => {
      const doc = markerDocs.get(marker.toLowerCase());
      return {
        label: marker,
        source: doc?.fileName || doc?.documentType || "Uploaded report",
      };
    });
    const duplicate = themes.some((theme) =>
      theme.evidence.some((item) =>
        evidence.some(
          (candidate) =>
            candidate.label.toLowerCase() === item.label.toLowerCase(),
        ),
      ),
    );
    if (duplicate) continue;
    themes.push({
      id: cluster.id,
      title: cluster.title,
      summary: `The uploaded report includes ${markers.slice(0, 5).join(", ")} for doctor review.`,
      evidence,
      confidence: "medium",
    });
  }

  return themes.slice(0, 6);
}

function synthesisFallback(input) {
  const markersRead = input.documents.reduce(
    (n, doc) =>
      n + (Array.isArray(doc.visibleMarkers) ? doc.visibleMarkers.length : 0),
    0,
  );
  const themes = buildFallbackThemes(input);

  return {
    status: "ready",
    narrative:
      themes.length > 0
        ? "Your uploaded report has been read into the Doctor Review Brief. The themes below are based on visible report sections and marker names for your doctor to review in context."
        : "Your documents have been added to the Doctor Review Brief. Add what you want your doctor to focus on so the consult starts with useful context.",
    themes,
    nextQuestion: {
      id: "dyn_focus",
      prompt: "What would you most like your doctor to focus on first?",
      options: [
        "Long-term prevention",
        "Energy, focus, or mood",
        "Body composition or fitness",
        "Understanding flagged markers",
        "Closing possible nutrient gaps",
      ],
      allowFreeText: true,
      whyWeAsk:
        "This helps prioritize the doctor review without interpreting results for you.",
    },
    progress: {
      themesPrepared: themes.length,
      markersRead,
      questionsQueued: 1,
    },
    updatedAt: new Date().toISOString(),
  };
}

function buildSynthesisSystemPrompt() {
  return `You are preparing a Doctor Review Brief for a licensed clinician.
Use only uploaded document facts and patient answers provided in JSON.
Use the full set of uploaded documents together; do not stop after the first document.
Create cautious doctor-preparation synthesis, not diagnosis, treatment, triage, reassurance, or a care plan.

Allowed:
- group visible document facts into safe doctor-review themes
- mention marker names and sections as evidence
- prioritize what the doctor may want to review
- ask one short context question that helps the doctor interpret the reports

Important:
- If textExcerpt is provided, use it as the richer source of visible report context.
- Do not claim that a marker is missing unless all uploaded document text and marker arrays were checked and the marker is truly absent.
- Prefer evidence chips that name the source document and marker or section.

Not allowed:
- do not say the patient has a condition
- do not say a result is safe, dangerous, urgent, severe, mild, or concerning
- do not recommend supplements, medication, tests, dosages, or treatment
- do not tell the patient what to do medically
- do not invent values, markers, symptoms, or history

Tone: useful, calm, direct, clinician-prep. Output valid JSON only.`;
}

function buildSynthesisUserPrompt(input) {
  return `Input JSON:
${JSON.stringify(input).slice(0, 32_000)}

Return JSON only:
{
  "narrative": "<2-4 sentences explaining what the brief has understood so far, using cautious doctor-prep language>",
  "briefThemes": [
    {
      "id": "<stable short id>",
      "title": "<doctor-review topic, e.g. Methylation-related markers to review>",
      "summary": "<1-2 sentences, factual, not diagnostic>",
      "evidence": [{"label":"<marker/section/answer>", "source":"<document or patient answer>"}],
      "confidence": "high|medium|low"
    }
  ],
  "nextQuestion": {
    "id": "<stable short id>",
    "prompt": "<one question under 18 words>",
    "options": ["<option>", "<option>", "<option>"],
    "allowFreeText": true,
    "whyWeAsk": "<one sentence>"
  },
  "progress": {
    "themesPrepared": <number>,
    "markersRead": <number>,
    "questionsQueued": <number>
  }
}`;
}

function buildStrictSynthesisRepairPrompt(raw, input) {
  return `The previous response was not accepted as the required JSON object.
Return a corrected JSON object only. No markdown, no prose.

Previous response:
${String(raw ?? "").slice(0, 4_000)}

Input JSON:
${JSON.stringify(input).slice(0, 24_000)}

Required JSON shape:
{
  "narrative": "<2-4 cautious doctor-prep sentences>",
  "briefThemes": [
    {
      "id": "<stable short id>",
      "title": "<doctor-review topic>",
      "summary": "<1-2 factual sentences, not diagnostic>",
      "evidence": [{"label":"<marker/section/answer>", "source":"<document or patient answer>"}],
      "confidence": "high|medium|low"
    }
  ],
  "nextQuestion": {
    "id": "<stable short id>",
    "prompt": "<one question under 18 words>",
    "options": ["<option>", "<option>", "<option>"],
    "allowFreeText": true,
    "whyWeAsk": "<one sentence>"
  },
  "progress": {
    "themesPrepared": <number>,
    "markersRead": <number>,
    "questionsQueued": <number>
  }
}`;
}

function parseSynthesisResponse(raw, input) {
  const parsed = parseJsonObject(raw);
  const fallback = synthesisFallback(input);
  const themes = Array.isArray(parsed.briefThemes)
    ? parsed.briefThemes.slice(0, 6).map((theme, index) => ({
        id:
          typeof theme.id === "string" && theme.id.trim()
            ? theme.id.trim()
            : `theme-${index + 1}`,
        title:
          typeof theme.title === "string" && theme.title.trim()
            ? theme.title.trim()
            : "Topic for doctor review",
        summary:
          typeof theme.summary === "string" && theme.summary.trim()
            ? theme.summary.trim()
            : "Prepared as a topic for your doctor to review.",
        evidence: Array.isArray(theme.evidence)
          ? theme.evidence
              .slice(0, 5)
              .map((e) => ({
                label: typeof e.label === "string" ? e.label.trim() : "",
                source:
                  typeof e.source === "string" && e.source.trim()
                    ? e.source.trim()
                    : undefined,
              }))
              .filter((e) => e.label)
          : [],
        confidence: ["high", "medium", "low"].includes(theme.confidence)
          ? theme.confidence
          : "medium",
      }))
    : fallback.themes;
  const safeThemes = themes.length > 0 ? themes : fallback.themes;

  const next =
    parsed.nextQuestion && typeof parsed.nextQuestion === "object"
      ? parsed.nextQuestion
      : fallback.nextQuestion;
  const markersRead = input.documents.reduce(
    (n, doc) =>
      n + (Array.isArray(doc.visibleMarkers) ? doc.visibleMarkers.length : 0),
    0,
  );

  return {
    status: "ready",
    narrative:
      typeof parsed.narrative === "string" && parsed.narrative.trim()
        ? parsed.narrative.trim()
        : fallback.narrative,
    themes: safeThemes,
    nextQuestion: {
      id:
        typeof next.id === "string" && next.id.trim()
          ? next.id.trim()
          : "dyn_focus",
      prompt:
        typeof next.prompt === "string" && next.prompt.trim()
          ? next.prompt.trim()
          : fallback.nextQuestion.prompt,
      options: Array.isArray(next.options)
        ? next.options
            .filter((o) => typeof o === "string" && o.trim())
            .slice(0, 6)
        : fallback.nextQuestion.options,
      allowFreeText: next.allowFreeText !== false,
      whyWeAsk:
        typeof next.whyWeAsk === "string" && next.whyWeAsk.trim()
          ? next.whyWeAsk.trim()
          : fallback.nextQuestion.whyWeAsk,
    },
    progress: {
      themesPrepared: safeThemes.length,
      markersRead: Number(parsed.progress?.markersRead) || markersRead,
      questionsQueued: 1,
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function synthesizeBriefWithOpenRouter(body, env = process.env) {
  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return json(500, {
      ok: false,
      error: "OpenRouter API key is not configured on the server.",
    });
  }
  if (!isAllowedModel(model)) {
    return json(400, {
      ok: false,
      error: `Blocked OpenRouter model "${model}". Only explicitly allowlisted models are permitted.`,
    });
  }

  const input = cleanSynthesisInput(body ?? {});
  const hasExtractedDocs = input.documents.some(
    (doc) =>
      doc.status === "done" ||
      (typeof doc.textExcerpt === "string" && doc.textExcerpt.trim()) ||
      (Array.isArray(doc.visibleMarkers) && doc.visibleMarkers.length > 0) ||
      (Array.isArray(doc.flaggedMarkers) && doc.flaggedMarkers.length > 0) ||
      (Array.isArray(doc.doctorReviewAreas) &&
        doc.doctorReviewAreas.length > 0),
  );
  if (!hasExtractedDocs && input.answeredDynamicQuestions.length === 0) {
    return json(200, { ok: true, result: synthesisFallback(input) });
  }

  try {
    async function requestSynthesis(messages, maxTokens) {
      const res = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            env.APP_URL ||
            env.OPENROUTER_HTTP_REFERER ||
            "http://localhost:5173",
          "X-Title": "Gen-H Doctor Review Brief",
        },
        body: JSON.stringify({
          model,
          provider: PROVIDER_GUARD,
          messages,
          response_format: { type: "json_object" },
          max_tokens: maxTokens,
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        const err = new Error(
          `OpenRouter synthesis failed with status ${res.status}.`,
        );
        err.httpStatus = res.status;
        err.detail = errorBody.slice(0, 240);
        throw err;
      }

      const data = await res.json();
      console.log(
        JSON.stringify({
          event: "openrouter_synthesis",
          id: data?.id,
          model: data?.model,
          prompt_tokens: data?.usage?.prompt_tokens,
          completion_tokens: data?.usage?.completion_tokens,
          total_tokens: data?.usage?.total_tokens,
          cost: data?.usage?.cost,
        }),
      );
      return data?.choices?.[0]?.message?.content ?? "";
    }

    const messages = [
      { role: "system", content: buildSynthesisSystemPrompt() },
      { role: "user", content: buildSynthesisUserPrompt(input) },
    ];
    let raw = await requestSynthesis(messages, SYNTHESIS_MAX_TOKENS);
    try {
      return json(200, {
        ok: true,
        result: parseSynthesisResponse(raw, input),
      });
    } catch (parseError) {
      console.log(
        JSON.stringify({
          event: "synthesis_parse_retry",
          error:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
        }),
      );
      raw = await requestSynthesis(
        [
          { role: "system", content: buildSynthesisSystemPrompt() },
          {
            role: "user",
            content: buildStrictSynthesisRepairPrompt(raw, input),
          },
        ],
        SYNTHESIS_RETRY_MAX_TOKENS,
      );
      return json(200, {
        ok: true,
        result: parseSynthesisResponse(raw, input),
      });
    }
  } catch (error) {
    console.log(
      JSON.stringify({
        event: "synthesis_degraded",
        error: error instanceof Error ? error.message : String(error),
        http_status: error?.httpStatus,
        detail: error?.detail,
      }),
    );
    return json(200, { ok: true, result: synthesisFallback(input) });
  }
}
