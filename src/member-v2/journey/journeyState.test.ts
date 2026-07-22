import { describe, expect, it } from "vitest";
import {
  INNOQUEST_HQ_ADDRESS_SHORT,
  INNOQUEST_HQ_MAPS_URL,
  INNOQUEST_HQ_WAZE_URL,
  JOURNEY_STATES,
  resolveJourneyConfig,
} from "./journeyState";

describe("BLOOD_FORM_READY blood-draw card", () => {
  it("always points at Innoquest HQ with maps and waze links", () => {
    const card = JOURNEY_STATES.BLOOD_FORM_READY.contextCard;
    expect(card.type).toBe("bloodDraw");
    if (card.type !== "bloodDraw") return;
    expect(card.labAddress).toBe(INNOQUEST_HQ_ADDRESS_SHORT);
    expect(card.labAddress).toContain("PJ");
    expect(card.mapsUrl).toBe(INNOQUEST_HQ_MAPS_URL);
    expect(card.wazeUrl).toBe(INNOQUEST_HQ_WAZE_URL);
    expect(card.mapsUrl).toContain("google.com/maps");
    expect(card.wazeUrl).toContain("waze.com");
  });

  it("fills the appointment once a blood-draw time is scheduled", () => {
    const config = resolveJourneyConfig("BLOOD_FORM_READY", null, "2026-08-01T02:00:00.000Z");
    const card = config.contextCard;
    expect(card.type).toBe("bloodDraw");
    if (card.type !== "bloodDraw") return;
    expect(card.appointment).toBeTruthy();
    expect(config.hero.body).toMatch(/blood draw is booked/i);
  });

  it("leaves the appointment empty until one is scheduled", () => {
    const config = resolveJourneyConfig("BLOOD_FORM_READY", null, null);
    const card = config.contextCard;
    if (card.type !== "bloodDraw") return;
    expect(card.appointment).toBeNull();
  });
});
