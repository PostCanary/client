import { beforeEach, describe, expect, it, vi } from "vitest";
import { get, postJson } from "@/api/http";
import {
  approveDesignUpload,
  listPendingDesignUploads,
  rejectDesignUpload,
} from "./designModeration";

vi.mock("@/api/http", () => ({
  get: vi.fn(),
  postJson: vi.fn(),
}));

describe("design moderation admin API", () => {
  beforeEach(() => {
    vi.mocked(get).mockReset();
    vi.mocked(postJson).mockReset();
  });

  it("lists pending uploads with pagination query params", async () => {
    vi.mocked(get).mockResolvedValue({
      uploads: [{ id: "u1", filename: "hero.png" }],
      page: 2,
      per_page: 1,
    });

    const result = await listPendingDesignUploads({ page: 2, per_page: 1 });

    expect(get).toHaveBeenCalledWith(
      "/api/admin/design-moderation/pending?page=2&per_page=1",
    );
    expect(result.uploads).toHaveLength(1);
    expect(result.page).toBe(2);
  });

  it("approves with no body", async () => {
    vi.mocked(postJson).mockResolvedValue({
      id: "u1",
      moderation_status: "approved",
    });

    await approveDesignUpload("u1");

    expect(postJson).toHaveBeenCalledWith(
      "/api/admin/design-moderation/u1/approve",
    );
  });

  it("rejects with a reason body", async () => {
    vi.mocked(postJson).mockResolvedValue({
      id: "u1",
      moderation_status: "rejected",
      rejection_reason: "attack card",
    });

    await rejectDesignUpload("u1", "attack card");

    expect(postJson).toHaveBeenCalledWith(
      "/api/admin/design-moderation/u1/reject",
      { reason: "attack card" },
    );
  });
});
