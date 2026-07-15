import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(target));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}

const targets = [...await sourceFiles("src"), "package.json"];
const forbidden = ["@supabase/supabase-js", "supabaseClient", "VITE_SUPABASE"];
const violations = [];
for (const file of targets) {
  const content = await readFile(file, "utf8");
  for (const token of forbidden) {
    if (content.includes(token)) violations.push(`${file}: ${token}`);
  }
}
if (violations.length) {
  console.error(`Production boundary check failed:\n${violations.join("\n")}`);
  process.exit(1);
}
console.info("Production boundary check passed: frontend has no Supabase client or credentials");
