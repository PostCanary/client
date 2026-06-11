import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

const getMediaFeaturesCached = vi.fn();
vi.mock("@/api/brandKit", () => ({
  getMediaFeaturesCached: (...a: unknown[]) => getMediaFeaturesCached(...a),
}));

import TemplateBrowser from "./TemplateBrowser.vue";

function mountBrowser() {
  return mount(TemplateBrowser, {
    props: {
      goalType: "neighbor_marketing" as const,
      industry: null,
      currentLayout: "full-bleed" as const,
    },
  });
}

describe("TemplateBrowser — neighborhood-map gating (S76)", () => {
  afterEach(() => vi.clearAllMocks());

  it("hides the neighborhood-map layout when maps are not configured", async () => {
    getMediaFeaturesCached.mockResolvedValue({
      stockConfigured: false,
      aiConfigured: false,
      mapsConfigured: false,
    });
    const wrapper = mountBrowser();
    await flushPromises();
    // Reveal the "More styles" section so all non-primary sets render.
    const moreBtn = wrapper.find("button");
    if (wrapper.text().includes("More styles")) {
      await wrapper
        .findAll("button")
        .find((b) => b.text().startsWith("More styles"))
        ?.trigger("click");
      await flushPromises();
    }
    void moreBtn;
    expect(wrapper.text()).not.toContain("Neighborhood Map");
  });

  it("shows the neighborhood-map layout when maps are configured", async () => {
    getMediaFeaturesCached.mockResolvedValue({
      stockConfigured: false,
      aiConfigured: false,
      mapsConfigured: true,
    });
    const wrapper = mountBrowser();
    await flushPromises();
    await wrapper
      .findAll("button")
      .find((b) => b.text().startsWith("More styles"))
      ?.trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Neighborhood Map");
  });
});
