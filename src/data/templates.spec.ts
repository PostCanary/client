import { describe, expect, it } from "vitest";

import {
  getDesignLibraryTemplate,
  getRecommendedTemplateSet,
  getTemplateSetsForGoal,
  getVisibleDesignLibraryTemplates,
  visibleDesignLibraryTemplates,
  useCaseLabel,
} from "./templates";

describe("design library templates", () => {
  it("exposes only render-worker-backed curated launch templates", () => {
    expect(visibleDesignLibraryTemplates).toHaveLength(3);

    for (const template of visibleDesignLibraryTemplates) {
      expect(template.status).toBe("visible");
      expect(template.source).toBe("curated");
      expect(template.industry).toBe("hvac");
      expect(template.layoutType).toBe("full-bleed");
      expect(template.renderTemplateId).toBe("hac-1000-front-v1");
      expect(template.previewStrategy).toBe("render-worker");
      expect(template.cardPositions).toContain(template.cardPosition);
      expect(template.goalTypes).toEqual(
        expect.arrayContaining([
          "neighbor_marketing",
          "send_to_list",
          "seasonal_tuneup",
        ]),
      );
      expect(template.tags.length).toBeGreaterThan(0);
    }
  });

  it("returns one visible launch template for each sequence card", () => {
    expect(visibleDesignLibraryTemplates.map((template) => template.cardPosition)).toEqual(
      ["offer", "proof", "last_chance"],
    );
  });

  it("feeds the customer-facing template browser from visible library entries", () => {
    const [set] = getTemplateSetsForGoal("send_to_list");

    if (!set) throw new Error("expected a visible template set");
    expect(set.layout).toBe("full-bleed");
    expect(set.templates.map((template) => template.id)).toEqual(
      visibleDesignLibraryTemplates.map((template) => template.id),
    );
  });

  it("falls back to the launch set for goals without a separate approved family", () => {
    const templates = getVisibleDesignLibraryTemplates("target_area");

    expect(templates).toEqual(visibleDesignLibraryTemplates);
  });

  it("recommends each goal's mapped layout now that the 4-layout set shipped", () => {
    // GOAL_TEMPLATE_MAP routes these goals to the new worker-backed layouts.
    expect(
      getRecommendedTemplateSet("target_area").map((template) => template.id),
    ).toEqual([
      "bold-graphic-offer",
      "bold-graphic-proof",
      "bold-graphic-last_chance",
    ]);
    expect(
      getRecommendedTemplateSet("seasonal_tuneup").map((template) => template.id),
    ).toEqual([
      "side-split-offer",
      "side-split-proof",
      "side-split-last_chance",
    ]);
    expect(
      getRecommendedTemplateSet("win_back").map((template) => template.id),
    ).toEqual([
      "review-forward-offer",
      "review-forward-proof",
      "review-forward-last_chance",
    ]);
    // Goals mapped to full-bleed keep getting the curated library set.
    expect(
      getRecommendedTemplateSet("neighbor_marketing").map((template) => template.id),
    ).toEqual(visibleDesignLibraryTemplates.map((template) => template.id));

    const targetAreaSets = getTemplateSetsForGoal("target_area");
    expect(targetAreaSets.map((set) => set.layout)).toEqual([
      "full-bleed",
      "side-split",
      "photo-top",
      "photo-hero",
      "new-mover",
      "bold-graphic",
      "before-after",
      "review-forward",
      "service-checklist",
      "urgency-notice",
      "tips",
    ]);
    expect(
      targetAreaSets.find((set) => set.recommended)?.layout,
    ).toBe("bold-graphic");
  });

  it("looks up only visible design library templates by id", () => {
    const template = getDesignLibraryTemplate("hvac-hac-1000-full-bleed-offer-v1");

    expect(template?.name).toBe("HVAC Neighborhood Offer");
  });
});

describe("industry recommendations (S75-C)", () => {
  it("roofing storm response recommends before-after", () => {
    const sets = getTemplateSetsForGoal("storm_response", "roofing");
    expect(sets.find((s) => s.recommended)?.layout).toBe("before-after");
  });

  it("no industry keeps the goal default", () => {
    const sets = getTemplateSetsForGoal("storm_response", null);
    expect(sets.find((s) => s.recommended)?.layout).toBe("bold-graphic");
  });

  it("unknown industry keeps the goal default", () => {
    const sets = getTemplateSetsForGoal("seasonal_tuneup", "carrier-pigeons");
    expect(sets.find((s) => s.recommended)?.layout).toBe("side-split");
  });

  it("recommended set follows the industry override", () => {
    const set = getRecommendedTemplateSet("seasonal_tuneup", "hvac");
    expect(set[0]?.layoutType).toBe("photo-top");
  });

  it("use-case labels sharpen per trade", () => {
    expect(useCaseLabel("storm_response", "roofing")).toBe("Storm Damage Response");
    expect(useCaseLabel("seasonal_tuneup", "hvac")).toBe("Beat-the-Season Tune-Up");
    expect(useCaseLabel("win_back", null)).toBe("Win-Back Campaign");
  });
});
