const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";
const ALLOWED_FREE_MODELS = new Set([
  "openrouter/free",
  "nvidia/nemotron-3-nano-omni:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
]);

const ZERO_COST_PROVIDER_GUARD = {
  allow_fallbacks: false,
  require_parameters: true,
  max_price: {
    prompt: 0,
    completion: 0,
    request: 0,
    image: 0,
  },
};

function json(status, payload) {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function isAllowedFreeModel(model) {
  if (!ALLOWED_FREE_MODELS.has(model)) return false;
  return model === "openrouter/free" || model.endsWith(":free");
}

function buildSystemPrompt() {
  return `You are a health intake assistant for Gen-H.
Your job is to prepare a Doctor Review Brief for a licensed clinician.
You may extract and summarize factual information that is visibly present in the uploaded health document.
You must not diagnose, treat, recommend supplements or medications, interpret clinical severity, reassure the patient, or tell the patient what to do medically.
Use cautious doctor-preparation language.

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
  const catLabel = category ? `${category.replace("_", " ")} report` : "health document";

  return `File: "${fileName}" (${catLabel})

Visible extracted text:
${textExcerpt ? textExcerpt.slice(0, 4_000) : ""}

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
    ? value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()).slice(0, limit)
    : [];
}

function parseModelResponse(raw) {
  const stripped = String(raw ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object in model response.");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    documentType: typeof parsed.documentType === "string" && parsed.documentType.trim()
      ? parsed.documentType.trim()
      : "Health document",
    provider: stringOrNull(parsed.provider),
    reportDate: stringOrNull(parsed.reportDate),
    sections: stringArray(parsed.sections, 12),
    visibleMarkers: stringArray(parsed.visibleMarkers, 20),
    flaggedMarkers: stringArray(parsed.flaggedMarkers, 12),
    doctorReviewAreas: stringArray(parsed.doctorReviewAreas, 8),
    patientFacingSummary: typeof parsed.patientFacingSummary === "string" && parsed.patientFacingSummary.trim()
      ? parsed.patientFacingSummary.trim()
      : "This document has been added to your Doctor Review Brief for doctor review.",
    question: typeof parsed.question === "string" && parsed.question.trim()
      ? parsed.question.trim()
      : "Is there anything specific in this document you'd like your doctor to focus on?",
    extractionStatus: "extracted",
  };
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
  const fileName = typeof body.fileName === "string" && body.fileName.trim()
    ? body.fileName.trim().slice(0, 180)
    : "uploaded document";
  const fileType = typeof body.fileType === "string" ? body.fileType.slice(0, 120) : "application/octet-stream";
  const category = typeof body.category === "string" ? body.category.slice(0, 60) : undefined;
  const textExcerpt = typeof body.textExcerpt === "string" ? body.textExcerpt.slice(0, 4_000) : undefined;

  return { fileName, fileType, category, textExcerpt };
}

export async function analyzeDocumentWithOpenRouter(body, env = process.env) {
  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return json(500, { ok: false, error: "OpenRouter API key is not configured on the server." });
  }

  if (!isAllowedFreeModel(model)) {
    return json(400, {
      ok: false,
      error: `Blocked OpenRouter model "${model}". Only explicitly allowlisted free models are permitted.`,
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
      content: buildUserPrompt(input.fileName, input.category, input.textExcerpt),
    },
  ];

  try {
    const res = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.APP_URL || env.OPENROUTER_HTTP_REFERER || "http://localhost:5173",
        "X-Title": "Gen-H Doctor Review Brief",
      },
      body: JSON.stringify({
        model,
        provider: ZERO_COST_PROVIDER_GUARD,
        messages,
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      return json(res.status, {
        ok: false,
        error: `OpenRouter request failed with status ${res.status}.`,
        detail: errorBody.slice(0, 240),
      });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const result = parseModelResponse(content);
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

    if (!hasConfidentDocumentStructure(result, input)) {
      return json(200, { ok: true, result: genericResult() });
    }

    return json(200, { ok: true, result });
  } catch (error) {
    return json(502, {
      ok: false,
      error: error instanceof Error ? error.message : "Document analysis failed.",
    });
  }
}
