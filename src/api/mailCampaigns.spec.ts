import { beforeEach, describe, expect, it, vi } from "vitest";

import { postJson } from "@/api/http";
import { createApprovalArtifact } from "@/api/mailCampaigns";

vi.mock("@/api/http", () => ({
  api: vi.fn(),
  get: vi.fn(),
  postJson: vi.fn(),
}));

describe("mail campaign approval artifacts", () => {
  beforeEach(() => {
    vi.mocked(postJson).mockReset();
  });

  it("creates an approval artifact with the acknowledgement timestamp and terms version", async () => {
    vi.mocked(postJson).mockResolvedValue({
      ok: true,
      id: "artifact-1",
      org_id: "org-1",
      mail_campaign_id: "campaign-1",
      created_by: "user-1",
      source_draft_id: "draft-1",
      artifact_type: "approval_proof",
      storage_backend: "railway_volume",
      storage_key: "orgs/org-1/mail-campaigns/campaign-1/artifact-1",
      manifest: {},
      manifest_sha256: "a".repeat(64),
      terms_version: "accuracy-rights-v1",
      acknowledged_at: "2026-05-25T02:20:00.000Z",
      created_at: "2026-05-25T02:20:01.000Z",
    });

    await createApprovalArtifact("campaign-1", {
      acknowledgedAt: "2026-05-25T02:20:00.000Z",
      termsVersion: "accuracy-rights-v1",
    });

    expect(postJson).toHaveBeenCalledWith(
      "/api/mail-campaigns/campaign-1/approval-artifact",
      {
        acknowledged_at: "2026-05-25T02:20:00.000Z",
        terms_version: "accuracy-rights-v1",
      },
    );
  });
});
