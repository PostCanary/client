import { describe, expect, it } from "vitest";
import { topLevelRouteViewKey } from "@/utils/routeViewKey";

describe("App router-view remount key (POS-190)", () => {
  it("changes when navigation switches between the standard wizard and list review", () => {
    const standardWizard = {
      path: "/app/send/draft-1",
      matched: [{ path: "/app/send/:draftId?" }],
    };
    const listReview = {
      path: "/app/send/draft-1/sttl-step-2",
      matched: [{ path: "/app/send/:draftId/sttl-step-2" }],
    };

    expect(topLevelRouteViewKey(standardWizard)).toBe("/app/send/:draftId?");
    expect(topLevelRouteViewKey(listReview)).toBe(
      "/app/send/:draftId/sttl-step-2",
    );
  });

  it("falls back to the concrete path when no route record is matched", () => {
    const route = {
      path: "/app/send/draft-1/sttl-step-2",
      matched: [],
    };

    expect(topLevelRouteViewKey(route)).toBe(route.path);
  });
});
