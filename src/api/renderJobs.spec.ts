import { beforeEach, describe, expect, it, vi } from "vitest";

import { http } from "@/api/http";
import { previewBack } from "@/api/renderJobs";

vi.mock("@/api/http", () => ({
  get: vi.fn(),
  postJson: vi.fn(),
  http: { post: vi.fn() },
}));

describe("previewBack (S76 Phase-5)", () => {
  beforeEach(() => {
    vi.mocked(http.post).mockReset();
  });

  it("POSTs to the per-draft preview-back endpoint as a blob", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    vi.mocked(http.post).mockResolvedValue({
      data: blob,
      headers: { "x-render-warnings": "" },
    });

    const result = await previewBack("draft-7");

    expect(http.post).toHaveBeenCalledWith(
      "/api/campaign-drafts/draft-7/preview-back",
      {},
      expect.objectContaining({ responseType: "blob" }),
    );
    expect(result.blob).toBe(blob);
    expect(result.warnings).toEqual([]);
  });

  it("parses the X-Render-Warnings header into an array", async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: new Blob(["png"]),
      headers: {
        "x-render-warnings": "PERMIT_TEXT_MISSING, BACK_ADDRESS_MISSING",
      },
    });

    const result = await previewBack("draft-7");

    expect(result.warnings).toEqual([
      "PERMIT_TEXT_MISSING",
      "BACK_ADDRESS_MISSING",
    ]);
  });

  it("forwards an abort signal to the request", async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: new Blob(["png"]),
      headers: {},
    });
    const controller = new AbortController();

    await previewBack("draft-7", controller.signal);

    expect(http.post).toHaveBeenCalledWith(
      "/api/campaign-drafts/draft-7/preview-back",
      {},
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
