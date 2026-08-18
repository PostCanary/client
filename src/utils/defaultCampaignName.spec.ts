import { describe, expect, it } from "vitest";
import { CAMPAIGN_GOALS } from "@/data/campaignGoals";
import {
  campaignGoalLabels,
  draftListDisplayName,
  formatDefaultCampaignName,
  looksLikeGeneratedCampaignName,
  resolveCampaignName,
} from "./defaultCampaignName";

const noon = new Date(2026, 6, 27, 12, 0, 0);

describe("formatDefaultCampaignName", () => {
  it("uses YYYY/MM/DD - <goal label> for every current goal", () => {
    expect(campaignGoalLabels()).toEqual(CAMPAIGN_GOALS.map((goal) => goal.label));
    for (const goal of CAMPAIGN_GOALS) {
      expect(formatDefaultCampaignName(goal.label, noon)).toBe(
        `2026/07/27 - ${goal.label}`,
      );
    }
  });

  it("zero-pads month and day and falls back when the label is empty", () => {
    expect(formatDefaultCampaignName("Send to a List", new Date(2026, 2, 4))).toBe(
      "2026/03/04 - Send to a List",
    );
    expect(formatDefaultCampaignName("   ", noon)).toBe("2026/07/27 - Campaign");
    expect(formatDefaultCampaignName(null, noon)).toBe("2026/07/27 - Campaign");
  });

  it("does not include city, ZIP, or brand-kit location", () => {
    const name = formatDefaultCampaignName("Send to a List", noon);
    expect(name).not.toMatch(/anoka|burnsville|92618/i);
    expect(name).toBe("2026/07/27 - Send to a List");
  });
});

describe("resolveCampaignName — POS-188 stale name leak", () => {
  it("does not keep a prior campaign's generated city name on a new send-to-list draft", () => {
    const name = resolveCampaignName({
      savedName: "Send to a List — anoka — Jul 27",
      isCustom: false,
      goalLabel: "Send to a List",
      now: noon,
      staleTokens: ["Anoka, MN", "anoka", "55303"],
    });
    expect(name).toBe("2026/07/27 - Send to a List");
    expect(name.toLowerCase()).not.toContain("anoka");
  });

  it("regenerates a bare leftover city such as anoka when the custom flag is off", () => {
    const name = resolveCampaignName({
      savedName: "anoka",
      isCustom: undefined,
      goalLabel: "Send to a List",
      now: noon,
      staleTokens: ["Anoka, MN"],
    });
    expect(name).toBe("2026/07/27 - Send to a List");
  });

  it("regenerates when startNew left review empty even if a previous in-memory name existed", () => {
    const previous = "Send to a List — anoka — Jul 27";
    const next = resolveCampaignName({
      savedName: null,
      isCustom: undefined,
      goalLabel: "Send to a List",
      now: noon,
      staleTokens: ["anoka"],
    });
    expect(next).not.toBe(previous);
    expect(next).toBe("2026/07/27 - Send to a List");
  });

  it("keeps a user-edited name across regeneration, reload, and draft resume", () => {
    const edited = "2026/03/14 - 20% off Installation";
    expect(
      resolveCampaignName({
        savedName: edited,
        isCustom: true,
        goalLabel: "Send to a List",
        now: noon,
        staleTokens: ["anoka"],
      }),
    ).toBe(edited);

    // Reload / resume: same persisted flag + name.
    expect(
      resolveCampaignName({
        savedName: edited,
        isCustom: true,
        goalLabel: "Target an Area",
        now: new Date(2026, 7, 17),
        staleTokens: ["Burnsville"],
      }),
    ).toBe(edited);
  });

  it("does not overwrite a legacy user-typed name that does not look generated", () => {
    expect(
      resolveCampaignName({
        savedName: "Spring AC Tune-Up",
        isCustom: undefined,
        goalLabel: "Seasonal Tune-Up",
        now: noon,
      }),
    ).toBe("Spring AC Tune-Up");
  });

  it("regenerates a persisted default of the new format when the flag is not custom", () => {
    expect(
      resolveCampaignName({
        savedName: "2026/07/01 - Neighbor Marketing",
        isCustom: false,
        goalLabel: "Target an Area",
        now: noon,
      }),
    ).toBe("2026/07/27 - Target an Area");
  });
});

describe("looksLikeGeneratedCampaignName", () => {
  it("detects new and legacy generated forms", () => {
    expect(looksLikeGeneratedCampaignName("2026/07/27 - Send to a List")).toBe(true);
    expect(
      looksLikeGeneratedCampaignName("Send to a List — Anoka — Jul 27"),
    ).toBe(true);
    expect(looksLikeGeneratedCampaignName("Promo weekend")).toBe(false);
  });
});

describe("draftListDisplayName", () => {
  it("prefers the chosen review name, then the goal label", () => {
    expect(
      draftListDisplayName({
        review: { campaignName: "2026/07/27 - Send to a List" } as any,
        goal: { goalLabel: "Send to a List" } as any,
      }),
    ).toBe("2026/07/27 - Send to a List");
    expect(
      draftListDisplayName({
        review: null,
        goal: { goalLabel: "Target an Area" } as any,
      }),
    ).toBe("Target an Area");
    expect(draftListDisplayName({ review: null, goal: null })).toBe(
      "Untitled Draft",
    );
  });
});
