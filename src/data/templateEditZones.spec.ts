import { describe, expect, it } from "vitest";
import {
  backEditZonesFor,
  editZonesFor,
  BACK_EDIT_ZONES,
  DEFAULT_BACK_TEMPLATE_ID,
} from "./templateEditZones";

describe("backEditZonesFor (S79 Phase-2)", () => {
  it("returns zones for every shipped back style", () => {
    for (const id of [
      "standard-back-v2",
      "testimonial-back-v1",
      "service-area-back-v1",
      "photo-back-v1",
      "brand-bold-back-v1",
    ]) {
      const zones = backEditZonesFor(id);
      expect(zones.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the standard map for unknown / null ids", () => {
    expect(backEditZonesFor(null)).toEqual(
      BACK_EDIT_ZONES[DEFAULT_BACK_TEMPLATE_ID],
    );
    expect(backEditZonesFor("nope-back-v9")).toEqual(
      BACK_EDIT_ZONES[DEFAULT_BACK_TEMPLATE_ID],
    );
  });

  it("maps the legacy standard-back-v1 to the v2 zones", () => {
    expect(backEditZonesFor("standard-back-v1")).toEqual(
      BACK_EDIT_ZONES["standard-back-v2"],
    );
  });

  it("keeps text-column zones inside the left editable column (clear of the reserved mailing zone)", () => {
    // The right half (x >= ~55%) is the reserved OneVision mailing zone.
    for (const z of backEditZonesFor("standard-back-v2")) {
      expect(z.left + z.width).toBeLessThanOrEqual(56);
    }
  });

  it("photo-back exposes a back-photo zone over the photo column", () => {
    const zones = backEditZonesFor("photo-back-v1");
    expect(zones.some((z) => z.editor === "back-photo")).toBe(true);
  });

  it("every back zone is a valid box within the canvas", () => {
    for (const id of Object.keys(BACK_EDIT_ZONES)) {
      for (const z of BACK_EDIT_ZONES[id]!) {
        expect(z.left).toBeGreaterThanOrEqual(0);
        expect(z.top).toBeGreaterThanOrEqual(0);
        expect(z.left + z.width).toBeLessThanOrEqual(100.001);
        expect(z.top + z.height).toBeLessThanOrEqual(100.001);
      }
    }
  });

  it("front zones are unaffected", () => {
    // sanity: the front map still resolves through the existing helper
    const front = editZonesFor("hac-1000-front-v1", "offer");
    expect(front.some((z) => z.editor === "headline")).toBe(true);
  });
});
