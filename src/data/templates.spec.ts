import { describe, expect, it } from "vitest";

import {
  getDesignLibraryTemplate,
  getTemplateSetsForGoal,
  getVisibleDesignLibraryTemplates,
  visibleDesignLibraryTemplates,
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

  it("looks up only visible design library templates by id", () => {
    const template = getDesignLibraryTemplate("hvac-hac-1000-full-bleed-offer-v1");

    expect(template?.name).toBe("HVAC Neighborhood Offer");
  });
});
