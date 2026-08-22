import { describe, expect, it } from "vitest";
import {
  extractDesignModerationConflict,
  extractDesignModerationMessage,
  readDesignModeration,
} from "./designModeration";
import { formatRelativeTime } from "./format";

const pendingBody = {
  error: {
    type: "Conflict",
    message: "Your design is being reviewed — usually under an hour.",
    details: { error_code: "design_pending_review" },
  },
};

const rejectedBody = {
  error: {
    type: "Conflict",
    message: "Your design was rejected: Looks like a competitor attack card.",
    details: { error_code: "design_rejected" },
  },
};

describe("extractDesignModerationConflict", () => {
  it("reads the Flask envelope from a normalized HTTP error", () => {
    expect(
      extractDesignModerationConflict({ status: 409, data: pendingBody }),
    ).toEqual({
      code: "design_pending_review",
      message: "Your design is being reviewed — usually under an hour.",
    });
  });

  it("returns the rejected server message verbatim", () => {
    expect(extractDesignModerationMessage({ data: rejectedBody })).toBe(
      "Your design was rejected: Looks like a competitor attack card.",
    );
  });

  it("ignores other 409 codes", () => {
    expect(
      extractDesignModerationConflict({
        status: 409,
        data: {
          error: {
            type: "Conflict",
            message: "Design upload is not pending review",
            details: { error_code: "not_pending" },
          },
        },
      }),
    ).toBeNull();
  });
});

describe("readDesignModeration", () => {
  it("reads camelCase design fields", () => {
    expect(
      readDesignModeration({
        moderationStatus: "pending",
        rejectionReason: null,
      }),
    ).toEqual({ status: "pending", reason: null });
  });

  it("reads snake_case serializer fields", () => {
    expect(
      readDesignModeration({
        moderation_status: "rejected",
        rejection_reason: "blurry",
      }),
    ).toEqual({ status: "rejected", reason: "blurry" });
  });

  it("reads nested uploadedAsset fields", () => {
    expect(
      readDesignModeration({
        uploadedAsset: {
          moderationStatus: "pending",
        },
      }),
    ).toEqual({ status: "pending", reason: null });
  });

  it("returns null when no status is present", () => {
    expect(readDesignModeration({ designSource: "uploaded" })).toEqual({
      status: null,
      reason: null,
    });
  });
});

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-08-22T12:00:00.000Z");

  it("formats minutes compactly", () => {
    expect(formatRelativeTime("2026-08-22T11:48:00.000Z", now)).toBe("12 min ago");
  });

  it("returns a dash for missing dates", () => {
    expect(formatRelativeTime(null, now)).toBe("—");
  });
});
