import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/user/Downloads/Template_Inventory List.xlsx";
const outputDir = "/Users/user/Documents/Gen-H/outputs/inventory-2026-07-17";
const outputPath = `${outputDir}/Verae_Health_Server_Inventory.xlsx`;

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItemAt(0);

sheet.getRange("A2:N2").values = [[
  1,
  "VeraeMain",
  "Single production server for the Verae Health backend. Hosts the API, authentication, PostgreSQL database, background jobs, reverse proxy and document malware scanning. Frontends are hosted separately on Vercel.",
  "OS: Ubuntu 24.04.4 LTS\nKernel: Linux 6.8.0-117-generic\nRuntime: Docker Engine 29.6.1 / Compose 5.3.1\nApplication: Node.js 24.18.0 / Fastify / Better Auth\nReverse proxy: Caddy 2.10.2\nDatabase: PostgreSQL 17.6\nWorker: pg-boss\nMalware scanner: ClamAV 1.4.5",
  "Virtual\nIPServerOne NovaCloud / KVM",
  1,
  3.75,
  "3-second snapshot average: ~5%\n3-second snapshot peak: 11%\nHistorical average/peak: not available",
  "Current: 59%\nHistorical peak: not available",
  "OS volume: 30 GiB\nPostgreSQL volume: 20 GiB\nTotal: 50 GiB",
  "OS: 6.6 GiB (24%)\nPostgreSQL volume: 0.09 GiB (1%)\nSnapshot: 2026-07-17",
  "Production",
  "IPServerOne plan: GeneralOpt-C1\nOS hostname: veraeprod\nRAM: 3.75 GiB provisioned; 3.58 GiB visible to OS\nPublic IPv4: 103.40.207.95\nPublic IPv6: 2403:1cc0:1002:1907::11a\nAPI: https://api.veraehealth.com\nRunning containers (5): Caddy, Fastify API, PostgreSQL, worker and ClamAV\nFirewall: default-deny inbound; only SSH/HTTP/HTTPS exposed. PostgreSQL is not public.\nPostgreSQL data: /srv/verae via Docker volume verae_postgres_data\nObject storage: verae-documents and verae-backups\nObject-storage endpoint: https://ap-southeast-mys1.oss.ips1cloud.com (region ap-southeast-mys1)\nBackups: hourly incremental, daily differential/check and weekly full; latest repository check succeeded 2026-07-17\nNo swap configured\nCreated: 2026-07-15 07:26 MYT\nSource: IPServerOne portal and live server inspection on 2026-07-17",
  "Malaysia\n(IPServerOne region; exact data-centre site not displayed in portal)",
]];

// Remove the example content while retaining the template's spare inventory rows.
sheet.getRange("A3:N4").clear({ applyTo: "contents" });

sheet.getRange("A1:N1").format = {
  font: { name: "Arial", fontSize: 8, bold: true, color: "#000000" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: "#000000" },
};

sheet.getRange("A2:N2").format = {
  font: { name: "Arial", fontSize: 8, color: "#000000" },
  verticalAlignment: "top",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: "#B7B7B7" },
};

sheet.getRange("A3:N4").format = {
  font: { name: "Arial", fontSize: 8, color: "#000000" },
  verticalAlignment: "top",
  wrapText: true,
};

sheet.getRange("A2:B2").format.horizontalAlignment = "left";
sheet.getRange("F2:G2").format.horizontalAlignment = "center";
sheet.getRange("L2:L2").format.horizontalAlignment = "center";
sheet.getRange("F2:F2").format.numberFormat = "0";
sheet.getRange("G2:G2").format.numberFormat = "0.00";

const widths = {
  A: 7,
  B: 17,
  C: 38,
  D: 36,
  E: 18,
  F: 8,
  G: 11,
  H: 21,
  I: 19,
  J: 20,
  K: 22,
  L: 15,
  M: 56,
  N: 22,
};
for (const [column, width] of Object.entries(widths)) {
  sheet.getRange(`${column}:${column}`).format.columnWidth = width;
}

sheet.getRange("1:1").format.rowHeight = 34;
sheet.getRange("2:2").format.rowHeight = 230;
sheet.getRange("3:4").format.rowHeight = 18;
sheet.freezePanes.freezeRows(1);

await fs.mkdir(outputDir, { recursive: true });

const preview = await workbook.render({
  sheetName: sheet.name,
  range: "A1:N2",
  scale: 1.5,
  format: "png",
});
await fs.writeFile(`${outputDir}/Verae_Health_Server_Inventory_preview.png`, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

const check = await workbook.inspect({
  kind: "table",
  range: "Sheet1!A1:N4",
  include: "values,formulas",
  tableMaxRows: 6,
  tableMaxCols: 14,
  maxChars: 16000,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);
console.log(outputPath);
