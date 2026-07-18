import { writeFile } from "node:fs/promises";

// /docs is gated behind EXPOSE_API_DOCS, but generating the committed spec must
// always work. Set the flag before app.js (and its config parse) is loaded.
process.env.EXPOSE_API_DOCS = "true";
const { buildApp } = await import("../app.js");

const app = await buildApp();
await app.ready();
await writeFile(new URL("../../openapi.json", import.meta.url), `${JSON.stringify(app.swagger(), null, 2)}\n`);
await app.close();
console.info("Generated server/openapi.json");
