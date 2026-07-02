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

// Fallbacks are allowed BETWEEN PROVIDERS of the same model (the model itself
// is pinned by the allowlist) so one provider's rate limit doesn't stall the
// brief; OpenRouter's default routing load-balances across healthy providers.
// Cost stays bounded by an explicit max_price ceiling ($/M tokens, comfortably
// above flash-lite's ~$0.10/$0.40 but blocking anything pricey).
// require_parameters is intentionally NOT set — it excludes providers that
// don't advertise every param (streaming, images).
const PROVIDER_GUARD = {
  allow_fallbacks: true,
  max_price: { prompt: 1, completion: 2 },
};

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
      finish_reason: data?.choices?.[0]?.finish_reason ?? data?.finish_reason,
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

async function chatCompletionOnce(
  { messages, maxTokens, temperature = 0.2, responseFormat, tag = "call" },
  env,
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

  // Upstream failures (rate limits, provider errors) arrive inside a 200 as
  // `choices[0].error` with finish_reason "error" and zero billed tokens.
  const choiceError = data?.choices?.[0]?.error ?? data?.error;
  if (choiceError) {
    const err = new Error(
      choiceError.metadata?.error_type === "rate_limit_exceeded"
        ? `OpenRouter ${tag}: provider rate limit hit.`
        : choiceError.message || `OpenRouter ${tag} provider error.`,
    );
    err.httpStatus = choiceError.code;
    throw err;
  }

  return {
    content: data?.choices?.[0]?.message?.content ?? "",
    usage: data?.usage,
    finishReason: data?.choices?.[0]?.finish_reason,
  };
}

/**
 * Non-streaming chat completion. Returns { content, usage }.
 * `responseFormat: "json"` forces a JSON object response.
 *
 * Retries: rate limits (429) and empty/error responses bill zero tokens and
 * get up to two retries with backoff (longer for 429). Auth failures and
 * client aborts never retry.
 */
export async function chatCompletion(options, env = process.env, signal) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const is429 = lastError?.httpStatus === 429;
      await new Promise((r) => setTimeout(r, is429 ? 2500 * attempt : 800));
      if (signal?.aborted) throw lastError;
    }
    try {
      const result = await chatCompletionOnce(options, env, signal);
      if (result.content.trim() && result.finishReason !== "error") {
        return result;
      }
      lastError = new Error(
        `OpenRouter ${options.tag ?? "call"} returned ${
          result.content.trim() ? 'finish_reason "error"' : "no content"
        }.`,
      );
    } catch (error) {
      if (isAuthError(error) || signal?.aborted) throw error;
      lastError = error;
    }
  }
  throw lastError;
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
  let finishReason;

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
      if (parsed.error) {
        // Mid-stream provider errors must surface, not yield silent emptiness.
        const err = new Error(
          parsed.error.message || `OpenRouter ${tag} stream error.`,
        );
        err.httpStatus = parsed.error.code;
        throw err;
      }
      if (parsed.usage) usage = parsed.usage;
      if (parsed.choices?.[0]?.finish_reason)
        finishReason = parsed.choices[0].finish_reason;
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

  logUsage(tag, { id: undefined, model, usage, finish_reason: finishReason });
  if (!content.trim()) {
    throw new Error(`OpenRouter ${tag} stream returned no content.`);
  }
  return { content, usage };
}

// ─── Response parsing helpers ─────────────────────────────────────────────────

/** Strips <think> blocks and markdown fences, then parses the JSON object.
 *  Falls back to truncation repair so a response cut off by a token limit
 *  still yields every complete element instead of failing wholesale. */
export function parseJsonObject(raw) {
  let text = String(raw ?? "");
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/<think>[\s\S]*$/gi, "");
  text = text.replace(/```(?:json)?/gi, "").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      /* fall through to truncation repair */
    }
  }
  return repairTruncatedJson(text);
}

/** Best-effort parse of a truncated JSON object: trims back to the last
 *  complete element boundary and closes any open strings/brackets. */
function repairTruncatedJson(raw) {
  const start = raw.indexOf("{");
  if (start < 0) throw new Error("No JSON object in model response.");
  let text = raw.slice(start);

  for (let attempt = 0; attempt < 60 && text.length > 1; attempt++) {
    const stack = [];
    let inString = false;
    let escaped = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === "{" || ch === "[") stack.push(ch);
      else if (ch === "}" || ch === "]") stack.pop();
    }
    let candidate = text;
    if (inString) candidate += '"';
    candidate = candidate.replace(/,\s*$/, "");
    candidate += stack
      .reverse()
      .map((open) => (open === "{" ? "}" : "]"))
      .join("");
    try {
      return JSON.parse(candidate);
    } catch {
      // Trim back to the previous element boundary and try again.
      const cut = Math.max(
        text.lastIndexOf(","),
        text.lastIndexOf("{", text.length - 2),
        text.lastIndexOf("[", text.length - 2),
      );
      if (cut <= 0) break;
      text = text.slice(0, cut);
    }
  }
  throw new Error("No JSON object in model response.");
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
