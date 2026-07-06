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

  describe("POS-120: tuned per-style band geometry", () => {
    const BACK_TOP = 12;
    const BACK_BOTTOM = 86;

    // Styles whose zone map is a single vertical stack over the flex content
    // column (top-to-bottom, non-overlapping, ordered by `top`). photo-back-v1
    // is excluded — it interleaves two disjoint back-photo bands around a
    // fixed brand-overlay band, not one ordered stack.
    const stackedStyles = [
      "standard-back-v2",
      "testimonial-back-v1",
      "service-area-back-v1",
      "brand-bold-back-v1",
    ];

    it.each(stackedStyles)("%s bands are ordered and non-overlapping", (id) => {
      const zones = [...BACK_EDIT_ZONES[id]!].sort((a, b) => a.top - b.top);
      for (let i = 1; i < zones.length; i++) {
        const prev = zones[i - 1]!;
        const cur = zones[i]!;
        expect(prev.top + prev.height).toBeCloseTo(cur.top, 5);
      }
    });

    it.each(stackedStyles)("%s bands span exactly BACK_TOP to BACK_BOTTOM", (id) => {
      const zones = [...BACK_EDIT_ZONES[id]!].sort((a, b) => a.top - b.top);
      expect(zones[0]!.top).toBeCloseTo(BACK_TOP, 5);
      const last = zones[zones.length - 1]!;
      expect(last.top + last.height).toBeCloseTo(BACK_BOTTOM, 5);
    });

    it.each(stackedStyles)("%s guarantee band extends to BACK_BOTTOM (no dead gap)", (id) => {
      const guarantee = BACK_EDIT_ZONES[id]!.find(
        (z) => z.editor === "back-guarantee",
      );
      expect(guarantee).toBeDefined();
      expect(guarantee!.top + guarantee!.height).toBeCloseTo(BACK_BOTTOM, 5);
    });

    it("standard-back-v2 gives the benefits list the largest band (tallest rendered section)", () => {
      const zones = BACK_EDIT_ZONES["standard-back-v2"]!;
      const benefits = zones.find((z) => z.editor === "back-benefits")!;
      const others = zones.filter((z) => z.editor !== "back-benefits");
      for (const z of others) {
        expect(benefits.height).toBeGreaterThan(z.height);
      }
    });

    it("photo-back-v1 keeps both back-photo bands over the photo column and the brand-overlay split within its fixed 300-560px band", () => {
      const zones = BACK_EDIT_ZONES["photo-back-v1"]!;
      const photoZones = zones.filter((z) => z.editor === "back-photo");
      expect(photoZones.length).toBe(2);
      const subhead = zones.find((z) => z.editor === "back-subhead")!;
      const guarantee = zones.find((z) => z.editor === "back-guarantee")!;
      expect(subhead.top).toBeCloseTo(37.5, 5);
      expect(subhead.top + subhead.height).toBeCloseTo(guarantee.top, 5);
      expect(guarantee.top + guarantee.height).toBeCloseTo(70, 5);
    });
  });
});
