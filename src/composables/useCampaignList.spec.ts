import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { useCampaignList } from "./useCampaignList";

vi.mock("@/api/mailCampaigns", () => ({
  listMailCampaigns: vi.fn(async () => [
    { id: "approved", status: "approved", name: "Approved", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    { id: "paused", status: "paused", name: "Paused", createdAt: "2026-01-02", updatedAt: "2026-01-02" },
    { id: "printing", status: "printing", name: "Printing", createdAt: "2026-01-03", updatedAt: "2026-01-03" },
    { id: "transit", status: "in_transit", name: "In transit", createdAt: "2026-01-04", updatedAt: "2026-01-04" },
    { id: "delivered", status: "delivered", name: "Delivered", createdAt: "2026-01-05", updatedAt: "2026-01-05" },
    { id: "results", status: "results_ready", name: "Results", createdAt: "2026-01-06", updatedAt: "2026-01-06" },
    { id: "completed", status: "completed", name: "Completed", createdAt: "2026-01-07", updatedAt: "2026-01-07" },
    { id: "draft-mail", status: "draft", name: "Server Draft", createdAt: "2026-01-08", updatedAt: "2026-01-08" },
  ]),
}));

vi.mock("@/api/campaignDrafts", () => ({
  listDrafts: vi.fn(async () => [
    { id: "draft-1", goal: { goalLabel: "Customer Draft" } },
  ]),
}));

describe("useCampaignList", () => {
  it("defaults to Draft and puts every post-approval status in Sent", async () => {
    const list = useCampaignList();
    expect(list.activeTab.value).toBe("draft");

    await list.fetch();
    await nextTick();

    expect(list.drafts.value).toHaveLength(1);
    expect(list.tabCounts.value).toEqual({ draft: 1, sent: 7 });
    expect(list.activeTab.value).toBe("draft");

    list.activeTab.value = "sent";
    await nextTick();
    expect(list.filtered.value.map((campaign) => campaign.id)).toEqual([
      "completed",
      "results",
      "delivered",
      "transit",
      "printing",
      "paused",
      "approved",
    ]);
  });
});
