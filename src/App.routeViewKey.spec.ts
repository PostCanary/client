import { describe, expect, it } from "vitest";
import { applicationRouteViewKey } from "@/utils/routeViewKey";

describe("App router-view remount key (POS-190)", () => {
  it("changes when navigation switches between the standard wizard and list review", () => {
    const standardWizard = {
      path: "/app/send/draft-1",
      matched: [{ path: "/app/send/:draftId?" }],
    };
    const listReview = {
      path: "/app/send/draft-1/sttl-step-2",
      // Vue Router can retain the standard wizard's record identity during
      // this replace, which is the live regression this key must survive.
      matched: [{ path: "/app/send/:draftId?" }],
    };

    expect(applicationRouteViewKey(standardWizard)).toBe("send-wizard");
    expect(applicationRouteViewKey(listReview)).toBe("send-list-review");
  });

  it("falls back to the concrete path when no route record is matched", () => {
    const route = {
      path: "/app/send/draft-1/sttl-step-2",
      matched: [],
    };

    expect(applicationRouteViewKey(route)).toBe("send-list-review");
  });
});
