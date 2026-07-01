import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { analyzeDocumentWithOpenRouter } from "./openrouterDocumentAnalysis.mjs";

const PORT = Number(process.env.API_PORT || 8787);
const MAX_BODY_BYTES = 6 * 1024 * 1024;

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
      throw Object.assign(new Error("Request body too large."), { status: 413 });
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

const server = createServer(async (req, res) => {
  if (req.url !== "/api/doctor-review-brief/analyze-document") {
    send(res, {
      status: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Not found." }),
    });
    return;
  }

  if (req.method !== "POST") {
    send(res, {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
      body: JSON.stringify({ ok: false, error: "Method not allowed." }),
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    send(res, await analyzeDocumentWithOpenRouter(body));
  } catch (error) {
    send(res, {
      status: error.status || 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Invalid request.",
      }),
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Gen-H API server listening on http://127.0.0.1:${PORT}`);
  console.log(`OpenRouter key loaded: ${redactedKey(process.env.OPENROUTER_API_KEY)}`);
  console.log(`OpenRouter model loaded: ${process.env.OPENROUTER_MODEL || "openrouter/free"}`);
});
