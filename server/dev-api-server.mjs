import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runBriefPipeline } from "./briefPipeline.mjs";
import { DEFAULT_MODEL } from "./openrouterClient.mjs";

const PORT = Number(process.env.API_PORT || 8787);
// Base64-encoded report photos / rendered PDF pages ride in the process body.
const MAX_BODY_BYTES = 25 * 1024 * 1024;
const SSE_PING_INTERVAL_MS = 15_000;

function loadEnvFile(fileName, { override = false } = {}) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (!key || (!override && key in process.env)) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local", { override: true });

function redactedKey(value) {
  if (!value) return "not configured";
  return `${value.slice(0, 12)}...${value.slice(-4)}`;
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw Object.assign(new Error("Request body too large."), {
        status: 413,
      });
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function send(res, response) {
  res.writeHead(response.status, response.headers);
  res.end(response.body);
}

async function handleProcessStream(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    send(res, {
      status: error.status || 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Invalid request.",
      }),
    });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  const abortController = new AbortController();
  const emit = (type, data) => {
    if (res.writableEnded || abortController.signal.aborted) return;
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const ping = setInterval(() => {
    if (!res.writableEnded) res.write(": ping\n\n");
  }, SSE_PING_INTERVAL_MS);
  // Client disconnect cancels in-flight OpenRouter calls (cost control).
  req.on("close", () => abortController.abort());

  try {
    await runBriefPipeline(body, emit, {
      signal: abortController.signal,
    });
  } finally {
    clearInterval(ping);
    if (!res.writableEnded) res.end();
  }
}

const server = createServer(async (req, res) => {
  const route = req.url?.split("?")[0];

  if (route === "/api/doctor-review-brief/process") {
    if (req.method !== "POST") {
      send(res, {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "POST" },
        body: JSON.stringify({ ok: false, error: "Method not allowed." }),
      });
      return;
    }
    await handleProcessStream(req, res);
    return;
  }

  send(res, {
    status: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: false, error: "Not found." }),
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Gen-H API server listening on http://127.0.0.1:${PORT}`);
  console.log(
    `OpenRouter key loaded: ${redactedKey(process.env.OPENROUTER_API_KEY)}`,
  );
  console.log(
    `OpenRouter model loaded: ${process.env.OPENROUTER_MODEL || DEFAULT_MODEL}`,
  );
});
