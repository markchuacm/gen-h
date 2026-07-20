import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const dist = path.resolve("dist");
const manifest = JSON.parse(await readFile(path.join(dist, ".vite", "manifest.json"), "utf8"));
const memberEntry = Object.values(manifest).find((entry) => entry.isEntry && entry.src === "member.html");

if (!memberEntry) throw new Error("Bundle boundary check: member.html entry is missing");

const forbiddenInitialModules = ["AdminApp", "DoctorApp", "IngestModal", "ocr", "pdfExtract"];
const initialEntries = new Set([memberEntry]);
const visitImports = (entry) => {
  for (const key of entry.imports ?? []) {
    const imported = manifest[key];
    if (!imported || initialEntries.has(imported)) continue;
    initialEntries.add(imported);
    visitImports(imported);
  }
};
visitImports(memberEntry);

for (const entry of initialEntries) {
  for (const forbidden of forbiddenInitialModules) {
    if ((entry.src ?? "").includes(forbidden)) {
      throw new Error(`Bundle boundary check: ${forbidden} leaked into ${entry.file}`);
    }
  }
}

const assetsDir = path.join(dist, "assets");
for (const file of await readdir(assetsDir)) {
  if (!file.endsWith(".js")) continue;
  const size = (await stat(path.join(assetsDir, file))).size;
  if (size > 500 * 1024) {
    throw new Error(`Bundle boundary check: ${file} is ${(size / 1024).toFixed(1)} KiB (limit 500 KiB)`);
  }
}

console.info("Bundle boundaries verified");
