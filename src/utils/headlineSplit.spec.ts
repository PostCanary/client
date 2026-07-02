import { describe, expect, it } from "vitest";

import {
  hasAnyLine,
  joinHeadlineLines,
  splitHeadline,
} from "./headlineSplit";

describe("splitHeadline", () => {
  it("splits an em-dash headline into accent / connector / main slots", () => {
    const lines = splitHeadline(
      "Phoenix Homeowners — stay cool this summer with a new A/C system!",
    );
    expect(lines.red1).toBe("Phoenix");
    expect(lines.red2).toBe("Homeowners");
    expect(lines.bridge.length).toBeGreaterThan(0);
    expect(lines.blue1.length).toBeGreaterThan(0);
    // every word survives somewhere
    const joined = [lines.red1, lines.red2, lines.bridge, lines.blue1, lines.blue2]
      .join(" ")
      .replace(/ {2,}/g, " ");
    expect(joined).toContain("new A/C");
  });

  it("never backfills template filler for short headlines (the Brooklyn bug)", () => {
    const lines = splitHeadline("Brooklyn Homeowners: AC Ready?");
    expect(lines.red1).toBe("Brooklyn Homeowners:");
    expect(lines.red2).toBe("AC Ready?");
    expect(lines.bridge).toBe("");
    expect(lines.blue1).toBe("");
    expect(lines.blue2).toBe("");
  });

  it("puts a single word on the first line only", () => {
    const lines = splitHeadline("Hello");
    expect(lines.red1).toBe("Hello");
    expect(hasAnyLine(lines)).toBe(true);
    expect(lines.red2 + lines.bridge + lines.blue1 + lines.blue2).toBe("");
  });

  it("returns all-empty for empty input", () => {
    expect(hasAnyLine(splitHeadline(""))).toBe(false);
    expect(hasAnyLine(splitHeadline(null))).toBe(false);
  });

  it("caps the main lines at 4 words and promotes overflow to the connector", () => {
    const lines = splitHeadline(
      "Neighbors — get your complete furnace and duct system tune-up special today",
    );
    const blueWords = `${lines.blue1} ${lines.blue2}`.trim().split(/\s+/);
    expect(blueWords.length).toBeLessThanOrEqual(4);
  });
});

describe("joinHeadlineLines", () => {
  it("recomposes with an em-dash between accent and main sections", () => {
    expect(
      joinHeadlineLines({
        red1: "Brooklyn Homeowners:",
        red2: "AC Ready?",
        bridge: "Book your",
        blue1: "$79 Safety",
        blue2: "Check Now!",
      }),
    ).toBe("Brooklyn Homeowners: AC Ready? — Book your $79 Safety Check Now!");
  });

  it("omits the dash when one side is empty", () => {
    expect(
      joinHeadlineLines({
        red1: "Brooklyn Homeowners:",
        red2: "AC Ready?",
        bridge: "",
        blue1: "",
        blue2: "",
      }),
    ).toBe("Brooklyn Homeowners: AC Ready?");
  });

  it("round-trips through splitHeadline without losing words", () => {
    const original = "Local Homeowners — save big on a complete system tune-up";
    const rejoined = joinHeadlineLines(splitHeadline(original));
    for (const word of original.replace("—", " ").split(/\s+/).filter(Boolean)) {
      expect(rejoined).toContain(word);
    }
  });
});
