const target = process.argv[2];
if (target !== "staging" && target !== "production") {
  throw new Error("Usage: pnpm deploy:check-env <staging|production>");
}

const required = [
  "VITE_API_URL",
  "VITE_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) throw new Error(`${target} deployment is missing: ${missing.join(", ")}`);
if (process.env.REQUIRE_TURNSTILE !== "true") throw new Error("REQUIRE_TURNSTILE must be true");
if (process.env.REQUIRE_STAFF_MFA !== "true") throw new Error("REQUIRE_STAFF_MFA must be true");

const expectedApi = target === "staging"
  ? "https://api-uat.veraehealth.com"
  : "https://api.veraehealth.com";
if (process.env.VITE_API_URL?.replace(/\/$/, "") !== expectedApi) {
  throw new Error(`VITE_API_URL must be ${expectedApi} for ${target}`);
}

console.info(`${target} authentication environment contract verified`);
