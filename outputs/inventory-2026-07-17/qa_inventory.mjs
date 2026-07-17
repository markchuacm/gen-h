import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const outputDir = "/Users/user/Documents/Gen-H/outputs/inventory-2026-07-17";
const input = await FileBlob.load(`${outputDir}/Verae_Health_Server_Inventory.xlsx`);
const workbook = await SpreadsheetFile.importXlsx(input);

for (const [name, range] of [["left", "A1:G2"], ["right", "H1:N2"]]) {
  const preview = await workbook.render({
    sheetName: "Sheet1",
    range,
    scale: 1.25,
    format: "png",
  });
  await fs.writeFile(`${outputDir}/qa_${name}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const values = await workbook.inspect({
  kind: "table",
  range: "Sheet1!A1:N4",
  include: "values,formulas",
  tableMaxRows: 6,
  tableMaxCols: 14,
  maxChars: 16000,
});
console.log(values.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);
