import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { omissionCodes, renderInnoquestForm } from "./draw";
import { placeholderPanelCode } from "./panelCodes";
import type { BloodFormPayload } from "./types";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = readFileSync(path.resolve(here, "../../../assets/forms/innoquest-request-form.pdf"));

function payload(overrides: Partial<BloodFormPayload["order"]> = {}): BloodFormPayload {
  return {
    patient: {
      fullName: "Nurul Aisyah",
      icPassportNo: "900215145678",
      dateOfBirth: "1990-02-15",
      age: 36,
      sex: "female",
      address: "12 Jalan Setiabakti, 50490 Kuala Lumpur",
      phone: "0123456789",
    },
    order: {
      clientOrderId: "a1b2c3d4e5f6",
      orderedAt: "2026-07-20T02:00:00Z",
      formReleasedAt: "2026-07-22T02:00:00Z",
      selectedCodes: ["hba1c", "glucose"],
      omittedCodes: ["ferritin", "homocysteine"],
      ...overrides,
    },
    missingFields: [],
  };
}

describe("placeholderPanelCode", () => {
  it("is a stable 4-char alphanumeric code", () => {
    expect(placeholderPanelCode("ferritin")).toMatch(/^[A-Z0-9]{4}$/);
    expect(placeholderPanelCode("ferritin")).toBe(placeholderPanelCode("ferritin"));
  });

  it("differs across distinct biomarkers", () => {
    expect(placeholderPanelCode("ferritin")).not.toBe(placeholderPanelCode("homocysteine"));
  });
});

describe("omissionCodes", () => {
  it("maps each omitted biomarker to its panel code", () => {
    expect(omissionCodes(["ferritin", "homocysteine"])).toEqual([
      placeholderPanelCode("ferritin"),
      placeholderPanelCode("homocysteine"),
    ]);
  });

  it("is empty when nothing was omitted (the full ANS panel)", () => {
    expect(omissionCodes([])).toEqual([]);
  });
});

describe("renderInnoquestForm", () => {
  it("produces a valid PDF from the template", async () => {
    const bytes = await renderInnoquestForm(template, payload());
    expect(bytes.length).toBeGreaterThan(1000);
    // PDF magic bytes "%PDF"
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x25, 0x50, 0x44, 0x46]);
  });

  it("renders a full-panel order (no omissions) without error", async () => {
    const bytes = await renderInnoquestForm(template, payload({ omittedCodes: [] }));
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("tolerates a payload with blank identity fields", async () => {
    const bytes = await renderInnoquestForm(template, {
      patient: { fullName: null, icPassportNo: null, dateOfBirth: null, age: null, sex: null, address: null, phone: null },
      order: payload().order,
      missingFields: ["Full name", "IC / passport number", "Date of birth", "Address"],
    });
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
