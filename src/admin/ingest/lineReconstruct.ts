// Turns pdf.js positioned text items into visually-ordered lines. Shared by the
// browser extractor (pdfExtract.ts) and the offline tuning harness so both see
// identical input. Pure — no pdf.js or DOM imports.

export type PositionedItem = { str: string; x: number; y: number; w: number; h: number };

/**
 * Cluster items into lines by y-position, order each line left-to-right, and
 * insert a double space where a large x-gap signals a column boundary (so
 * "Glucose   4.5   mmol/L   (3.9-6.0)" keeps its columns separable downstream).
 */
export function reconstructLines(items: PositionedItem[]): string[] {
  const positioned = items.filter((i) => i.str && i.str.trim());
  if (positioned.length === 0) return [];

  const heights = positioned
    .map((i) => i.h)
    .filter((h) => h > 0)
    .sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)] || 8;
  const tol = medianHeight * 0.5;

  positioned.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: { y: number; items: PositionedItem[] }[] = [];
  for (const item of positioned) {
    const line = lines.find((l) => Math.abs(l.y - item.y) <= tol);
    if (line) {
      line.items.push(item);
      line.y = (line.y * (line.items.length - 1) + item.y) / line.items.length;
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  // Column-gap threshold scales with text size; ~0.9em reads as a new column.
  const gap = medianHeight * 0.9;

  return lines.map((l) => {
    l.items.sort((a, b) => a.x - b.x);
    let out = "";
    let prevEnd: number | null = null;
    for (const it of l.items) {
      const s = it.str.trim();
      if (!s) continue;
      if (prevEnd != null) out += it.x - prevEnd > gap ? "  " : " ";
      out += s;
      prevEnd = it.x + it.w;
    }
    return out.trim();
  });
}
