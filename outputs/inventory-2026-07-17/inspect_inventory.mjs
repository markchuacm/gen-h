import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/user/Downloads/Template_Inventory List.xlsx";
const outputDir = "/Users/user/Documents/Gen-H/outputs/inventory-2026-07-17";

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: "workbook,sheet,table,region",
  maxChars: 12000,
  tableMaxRows: 50,
  tableMaxCols: 20,
  tableMaxCellChars: 200,
});
console.log(overview.ndjson);

const sheets = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 4000 });
console.log(sheets.ndjson);

const sheet1 = workbook.worksheets.getItemAt(0);
for (const table of sheet1.tables.items) {
  console.log(JSON.stringify({ tableName: table.name, tableStyle: table.style }));
}

const styles = await workbook.inspect({
  kind: "computedStyle",
  sheetId: sheet1.name,
  range: "A1:N4",
  maxChars: 8000,
});
console.log(styles.ndjson);

await fs.mkdir(outputDir, { recursive: true });
for (const sheet of workbook.worksheets.items) {
  const preview = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1.5,
    format: "png",
  });
  const safeName = sheet.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  await fs.writeFile(`${outputDir}/template_${safeName}.png`, new Uint8Array(await preview.arrayBuffer()));
}
