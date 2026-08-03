import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/api/mailCampaigns", () => ({
  approveMailCampaign: vi.fn(),
}));

vi.mock("@/api/campaignDrafts", () => ({
  listDrafts: vi.fn(),
}));

import { approveMailCampaign } from "@/api/mailCampaigns";
import { listDrafts } from "@/api/campaignDrafts";
import { approveCampaignDraft } from "./approveCampaignDraft";

describe("approveCampaignDraft", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(approveMailCampaign).mockReset();
    vi.mocked(listDrafts).mockReset().mockResolvedValue([]);
  });

  it("refreshes the shared draft list immediately after approval succeeds", async () => {
    const campaign = {
      id: "campaign-1",
      orgId: "org-1",
      status: "approved",
    } as any;
    vi.mocked(approveMailCampaign).mockResolvedValue(campaign);

    await expect(approveCampaignDraft("draft-1")).resolves.toBe(campaign);
    await vi.waitFor(() => expect(listDrafts).toHaveBeenCalledTimes(1));
  });

  it("does not refresh when approval itself fails", async () => {
    vi.mocked(approveMailCampaign).mockRejectedValue(new Error("not approved"));

    await expect(approveCampaignDraft("draft-1")).rejects.toThrow(
      "not approved",
    );
    expect(listDrafts).not.toHaveBeenCalled();
  });
});
