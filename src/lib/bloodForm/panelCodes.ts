// Placeholder Innoquest panel codes for individual biomarkers.
//
// TODO(gen-h): replace with the real Innoquest panel/test codes. The standard
// Gen H panel is submitted as the "ANS" profile (the full 103-biomarker
// package), so these per-marker codes are only ever needed to spell out the
// *omissions* in the ADDITIONAL TESTS box when a doctor drops markers from the
// standard panel. Until Innoquest supplies the real mapping we render a stable,
// deterministic 4-character alphanumeric placeholder derived from the biomarker
// id, so the same marker always shows the same code and QA can eyeball it.

const ALPHABET = "ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789"; // no "O" to avoid 0/O confusion

/** Deterministic 4-char placeholder code for a biomarker catalog id. */
export function placeholderPanelCode(biomarkerId: string): string {
  // FNV-1a hash over the id — stable across runs and platforms.
  let hash = 0x811c9dc5;
  for (let i = 0; i < biomarkerId.length; i += 1) {
    hash ^= biomarkerId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += ALPHABET[hash % ALPHABET.length];
    hash = Math.floor(hash / ALPHABET.length) || Math.imul(hash ^ (i + 1), 0x01000193) >>> 0;
  }
  return code;
}
