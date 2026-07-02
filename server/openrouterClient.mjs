// ─── OpenRouter client ────────────────────────────────────────────────────────
// The only module that talks to OpenRouter. Owns the model allowlist, spend
// logging, auth-failure short-circuits, and response parsing helpers shared by
// the brief pipeline.

const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";

// gemini-2.5-flash-lite is the working default (multimodal — reads report
// photos and scanned PDFs). It is a paid model at a very low rate; every call
// is logged below as an `openrouter_completion` line with token counts + cost.
export const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";
const ALLOWED_MODELS = new Set([
  "google/gemini-2.5-flash-lite",
  "openai/gpt-4o-mini",
  "openrouter/free",
  "nvidia/nemotron-3-nano-omni:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
]);

// allow_fallbacks stays off so an allowlisted model can never silently swap to
// another provider/price. require_parameters is intentionally NOT set — it
// excludes providers that don't advertise every param (streaming, image parts).
const PROVIDER_GUARD = { allow_fallbacks: false };

export function resolveModel(env = process.env) {
  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;
  if (!apiKey) {
    throw withStatus(
      new Error("OpenRouter API key is not configured on the server."),
      500,
    );
  }
  if (!ALLOWED_MODELS.has(model)) {
    throw withStatus(
      new Error(
        `Blocked OpenRouter model "${model}". Only explicitly allowlisted models are permitted.`,
      ),
      400,
    );
  }
  return { apiKey, model };
}

function withStatus(error, status) {
  error.httpStatus = status;
  return error;
}

function requestHeaders(apiKey, env) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer":
      env.APP_URL || env.OPENROUTER_HTTP_REFERER || "http://localhost:5173",
    "X-Title": "Gen-H Doctor Review Brief",
  };
}

function logUsage(tag, data) {
  console.log(
    JSON.stringify({
      event: "openrouter_completion",
      tag,
      id: data?.id,
      model: data?.model,
      prompt_tokens: data?.usage?.prompt_tokens,
      completion_tokens: data?.usage?.completion_tokens,
      total_tokens: data?.usage?.total_tokens,
      cost: data?.usage?.cost,
    }),
  );
}

async function throwHttpError(res, tag) {
  const errorBody = await res.text().catch(() => "");
  const err = new Error(
    res.status === 401 || res.status === 403
      ? "OpenRouter authentication failed — check OPENROUTER_API_KEY."
      : `OpenRouter ${tag} request failed with status ${res.status}.`,
  );
  err.httpStatus = res.status;
  err.detail = errorBody.slice(0, 240);
  throw err;
}

/** True for auth/config errors that must surface, never silently degrade. */
export function isAuthError(error) {
  return error?.httpStatus === 401 || error?.httpStatus === 403;
}

/**
 * Non-streaming chat completion. Returns { content, usage }.
 * `responseFormat: "json"` forces a JSON object response.
 */
export async function chatCompletion(
  { messages, maxTokens, temperature = 0.2, responseFormat, tag = "call" },
  env = process.env,
  signal,
) {
  const { apiKey, model } = resolveModel(env);
  const res = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    signal,
    headers: requestHeaders(apiKey, env),
    body: JSON.stringify({
      model,
      provider: PROVIDER_GUARD,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...(responseFormat === "json"
        ? { response_format: { type: "json_object" } }
        : {}),
    }),
  });
  if (!res.ok) await throwHttpError(res, tag);

  const data = await res.json();
  logUsage(tag, data);
  return {
    content: data?.choices?.[0]?.message?.content ?? "",
    usage: data?.usage,
  };
}

/**
 * Streaming chat completion. Calls onDelta(text) per content chunk and returns
 * { content, usage } once the stream finishes.
 */
export async function chatCompletionStream(
  { messages, maxTokens, temperature = 0.2, onDelta, tag = "stream" },
  env = process.env,
  signal,
) {
  const { apiKey, model } = resolveModel(env);
  const res = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    signal,
    headers: requestHeaders(apiKey, env),
    body: JSON.stringify({
      model,
      provider: PROVIDER_GUARD,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });
  if (!res.ok) await throwHttpError(res, tag);

  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let usage;

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue; // partial keep-alive noise — never fatal
      }
      if (parsed.usage) usage = parsed.usage;
      const delta = parsed.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) {
        content += delta;
        try {
          onDelta?.(delta);
        } catch {
          /* consumer errors must not kill the stream */
        }
      }
    }
  }

  logUsage(tag, { id: undefined, model, usage });
  return { content, usage };
}

// ─── Response parsing helpers ─────────────────────────────────────────────────

/** Strips <think> blocks and markdown fences, then parses the JSON object. */
export function parseJsonObject(raw) {
  let text = String(raw ?? "");
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/<think>[\s\S]*$/gi, "");
  text = text.replace(/```(?:json)?/gi, "").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object in model response.");
  return JSON.parse(jsonMatch[0]);
}

export function stringOrNull(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function stringArray(value, limit = 12) {
  return Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim())
        .slice(0, limit)
    : [];
}
