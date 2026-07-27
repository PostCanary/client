import { beforeEach, describe, expect, it, vi } from "vitest";

import { get, postJson } from "@/api/http";
import {
  createApprovalArtifact,
  getMailScheduleAvailability,
} from "@/api/mailCampaigns";

vi.mock("@/api/http", () => ({
  api: vi.fn(),
  get: vi.fn(),
  postJson: vi.fn(),
}));

describe("mail campaign approval artifacts", () => {
  beforeEach(() => {
    vi.mocked(get).mockReset();
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

  it("gets the authenticated organization's authoritative schedule availability", async () => {
    vi.mocked(get).mockResolvedValue({
      ok: true,
      earliest_mailing_date: "2026-07-29",
      timezone: "America/Los_Angeles",
      approval_cutoff_local: "17:00:00",
      cutoff_inclusive: true,
      processing_business_days: 1,
      holiday_calendar: "us_federal_observed_nationwide",
    });

    const result = await getMailScheduleAvailability();

    expect(get).toHaveBeenCalledWith(
      "/api/mail-campaigns/schedule-availability",
    );
    expect(result.earliest_mailing_date).toBe("2026-07-29");
    expect(result.timezone).toBe("America/Los_Angeles");
  });
});
