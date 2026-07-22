import formUrl from "../../../assets/forms/innoquest-request-form.pdf?url";
import { renderInnoquestForm } from "./draw";
import type { BloodFormPayload } from "./types";

export { GEN_H_PARTICULARS } from "./draw";

let templateBytesPromise: Promise<ArrayBuffer> | null = null;
function loadTemplate(): Promise<ArrayBuffer> {
  if (!templateBytesPromise) {
    templateBytesPromise = fetch(formUrl).then((res) => {
      if (!res.ok) throw new Error(`Failed to load request-form template (${res.status})`);
      return res.arrayBuffer();
    });
  }
  return templateBytesPromise;
}

/**
 * Overlay the payload onto the blank Innoquest request form and return the
 * filled PDF bytes. The blank form is a flattened scan, so every value is drawn
 * as absolutely-positioned text on top of it.
 */
export async function fillInnoquestForm(payload: BloodFormPayload): Promise<Uint8Array> {
  const templateBytes = await loadTemplate();
  return renderInnoquestForm(templateBytes, payload);
}
