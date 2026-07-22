import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { placeholderPanelCode } from "./panelCodes";
import type { BloodFormPayload } from "./types";

// Standing particulars that are the same on every Gen H request form. Supplied
// by the business; the doctor's signature itself is left blank (only the name is
// printed on the signature line).
export const GEN_H_PARTICULARS = {
  doctorName: "Dr Deanna Reesha",
  doctorCode: "DEAN3",
  billCode: "GENH2",
  accountName: "Gen H Holdings Sdn Bhd",
  accountNumber: "25398832",
  addressLines: [
    "Level 7, Mercu 3, No. 3, Jalan Bangsar,",
    "KL Eco City, 59200 Kuala Lumpur",
  ],
} as const;

const PAGE_HEIGHT = 841.89;
const INK = rgb(0.06, 0.09, 0.16);

// All coordinates below are measured from the TOP-LEFT of the A4 page (the way
// the scanned form reads); `flip` converts a top-origin y to pdf-lib's
// bottom-origin baseline y at draw time.
const flip = (yTop: number) => PAGE_HEIGHT - yTop;

// Block-letter cell grids (measured from the scan): first cell centre x,
// horizontal pitch, cell count. The name row has 19 cells across two rows; IC
// and Your Reference are single 15-cell rows.
const CELL_X0 = 56.05;
const CELL_PITCH = 14.1;
const NAME_GRID = { x0: CELL_X0, pitch: CELL_PITCH, cells: 20 };
const IC_GRID = { x0: CELL_X0, pitch: CELL_PITCH, cells: 15 };
const REF_GRID = { x0: CELL_X0, pitch: CELL_PITCH, cells: 15 };

type Ctx = { page: PDFPage; font: PDFFont };

function text(ctx: Ctx, value: string, xLeft: number, yTop: number, size = 9): void {
  ctx.page.drawText(value, { x: xLeft, y: flip(yTop), size, font: ctx.font, color: INK });
}

/** Draw a string horizontally centred on a given x. */
function textCentered(ctx: Ctx, value: string, cx: number, yTop: number, size = 9): void {
  const w = ctx.font.widthOfTextAtSize(value, size);
  ctx.page.drawText(value, { x: cx - w / 2, y: flip(yTop), size, font: ctx.font, color: INK });
}

/** Draw a string one character per cell, centred in each cell. Overflow past
 *  the last cell is dropped. */
function cells(ctx: Ctx, value: string, grid: { x0: number; pitch: number; cells: number }, yTop: number, size = 9): void {
  const chars = value.toUpperCase().slice(0, grid.cells).split("");
  chars.forEach((ch, i) => {
    if (ch === " ") return;
    const w = ctx.font.widthOfTextAtSize(ch, size);
    const cx = grid.x0 + i * grid.pitch;
    ctx.page.drawText(ch, { x: cx - w / 2, y: flip(yTop), size, font: ctx.font, color: INK });
  });
}

/** Fill the two-row name grid: the first `grid.cells` characters go on the top
 *  row (baseline `yTop`), the remainder overflow onto the second row. Every full
 *  name is preserved rather than truncated at the first row. */
function nameCells(ctx: Ctx, value: string, grid: { x0: number; pitch: number; cells: number }, yTopRow1: number, yTopRow2: number, size = 9): void {
  const upper = value.toUpperCase();
  cells(ctx, upper.slice(0, grid.cells), grid, yTopRow1, size);
  if (upper.length > grid.cells) cells(ctx, upper.slice(grid.cells, grid.cells * 2), grid, yTopRow2, size);
}

/** A bold "X" centred on a checkbox at the given top-origin centre. */
function tick(ctx: Ctx, cxTop: number, cyTop: number): void {
  const size = 11;
  const w = ctx.font.widthOfTextAtSize("X", size);
  ctx.page.drawText("X", { x: cxTop - w / 2, y: flip(cyTop) - size * 0.36, size, font: ctx.font, color: INK });
}

function wrap(ctx: Ctx, value: string, maxWidth: number, size: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function splitDob(dob: string | null): { d: string; m: string; y: string } | null {
  if (!dob) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return null;
  return { y: match[1]!, m: match[2]!, d: match[3]! };
}

function formatDmy(iso: string | null): { d: string; m: string; y: string } | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return {
    d: String(date.getDate()).padStart(2, "0"),
    m: String(date.getMonth() + 1).padStart(2, "0"),
    y: String(date.getFullYear()),
  };
}

function sexLetter(sex: string | null): string {
  const first = sex?.trim()[0]?.toUpperCase();
  return first === "M" || first === "F" ? first : "";
}

/** Which biomarker omissions become panel-code lines in the ADDITIONAL TESTS
 *  box. Exported for unit testing the mapping without rendering a PDF. */
export function omissionCodes(omittedCodes: string[]): string[] {
  return omittedCodes.map(placeholderPanelCode);
}

/**
 * Overlay the payload onto the blank Innoquest request form (`templateBytes`)
 * and return the filled PDF bytes. Pure with respect to I/O so it can run in
 * both the browser (template fetched via Vite ?url) and Node tests.
 */
export async function renderInnoquestForm(
  templateBytes: ArrayBuffer | Uint8Array,
  payload: BloodFormPayload,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(templateBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.getPage(0);
  const ctx: Ctx = { page, font };
  const p = payload.patient;

  // --- Patient block -------------------------------------------------------
  if (p.fullName) nameCells(ctx, p.fullName, NAME_GRID, 122.5, 136.5);
  if (p.icPassportNo) cells(ctx, p.icPassportNo, IC_GRID, 163.5);

  const dob = splitDob(p.dateOfBirth);
  if (dob) {
    // Cell centres for D D / M M / Y Y Y Y (the slashes are pre-printed in
    // cells 3 and 6), measured from the scan.
    const cx = [56, 70.2, 98.4, 112.5, 140.8, 154.9, 168.9, 183];
    `${dob.d}${dob.m}${dob.y}`.split("").forEach((ch, i) => {
      const w = font.widthOfTextAtSize(ch, 9);
      page.drawText(ch, { x: cx[i]! - w / 2, y: flip(190.9), size: 9, font, color: INK });
    });
  }
  if (p.age != null) textCentered(ctx, String(p.age), 239.6, 190.9, 9);
  const sex = sexLetter(p.sex);
  if (sex) textCentered(ctx, sex, 299, 190.9, 9);

  // "Your Reference" — the client-facing order id ties the paper form back to
  // the member's order without exposing internal ids.
  cells(ctx, payload.order.clientOrderId.replace(/[^a-z0-9]/gi, "").slice(0, REF_GRID.cells), REF_GRID, 216.3, 8);

  // The patient block is a narrow column (~270pt wide) with a small address
  // area above the pre-printed Telephone row; cap at two lines so it never
  // collides with the telephone line below.
  if (p.address) {
    wrap(ctx, p.address, 268, 7).slice(0, 2).forEach((line, i) => text(ctx, line, 50, 239 + i * 8, 7));
  }
  if (p.phone) text(ctx, p.phone, 138, 255, 8);

  // --- Specimen: Blood + Urine (drawn for every panel), Fasting -----------
  tick(ctx, 54.2, 286.1);
  tick(ctx, 54.25, 305.4);
  tick(ctx, 167, 333);

  // --- Standard package: ANS profile --------------------------------------
  tick(ctx, 350, 384);

  // --- Referring doctor box -----------------------------------------------
  const docLines = [
    GEN_H_PARTICULARS.doctorName,
    `Dr Code: ${GEN_H_PARTICULARS.doctorCode}`,
    `${GEN_H_PARTICULARS.accountName} (Acct ${GEN_H_PARTICULARS.accountNumber})`,
    ...GEN_H_PARTICULARS.addressLines,
  ];
  docLines.forEach((line, i) => text(ctx, line, 342, 133 + i * 11, 8));

  // --- Bill to -------------------------------------------------------------
  text(ctx, GEN_H_PARTICULARS.billCode, 378, 345, 9);

  // --- Additional tests: omissions from the standard ANS panel ------------
  if (payload.order.omittedCodes.length > 0) {
    const codes = omissionCodes(payload.order.omittedCodes).join(", ");
    text(ctx, "Omit from ANS panel (panel codes):", 50, 662, 9);
    wrap(ctx, codes, 500, 9).forEach((line, i) => text(ctx, line, 50, 676 + i * 13, 9));
  }

  // --- Signature line: doctor name printed, signature left blank ----------
  text(ctx, GEN_H_PARTICULARS.doctorName, 260, 769, 9);

  const formDate = formatDmy(payload.order.formReleasedAt ?? payload.order.orderedAt);
  if (formDate) {
    text(ctx, formDate.d, 452, 769, 9);
    text(ctx, formDate.m, 490, 769, 9);
    text(ctx, formDate.y, 516, 769, 9);
  }

  return pdf.save();
}
