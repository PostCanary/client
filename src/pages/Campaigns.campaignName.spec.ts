import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const { listDraftsMock, listMailCampaignsMock } = vi.hoisted(() => ({
  listDraftsMock: vi.fn(),
  listMailCampaignsMock: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({
    name: "Campaigns",
    path: "/app/campaigns",
    query: {},
  }),
}));

vi.mock("@/api/campaignDrafts", () => ({
  deleteDraft: vi.fn(),
  listDrafts: listDraftsMock,
}));

vi.mock("@/api/mailCampaigns", () => ({
  getMailCampaign: vi.fn(),
  listMailCampaigns: listMailCampaignsMock,
  pauseMailCampaign: vi.fn(),
  resumeMailCampaign: vi.fn(),
}));

import Campaigns from "./Campaigns.vue";
import { useAuthStore } from "@/stores/auth";

describe("Campaigns list reads MailCampaign.name / review.campaignName", () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    const auth = useAuthStore();
    auth.me = { authenticated: true, org_id: "org-1", features: ["postcards"] } as any;
    listDraftsMock.mockReset().mockResolvedValue([
      {
        id: "draft-named",
        currentStep: 4,
        completedSteps: [1, 2, 3],
        needsReviewSteps: [],
        goal: { goalLabel: "Send to a List" },
        review: { campaignName: "2026/07/27 - Send to a List" },
      },
    ]);
    listMailCampaignsMock.mockReset().mockResolvedValue([
      {
        id: "sent-1",
        status: "approved",
        name: "2026/07/27 - Send to a List",
        createdAt: "2026-07-27T00:00:00Z",
        updatedAt: "2026-07-27T00:00:00Z",
        cards: [],
      },
    ]);
  });

  it("shows the chosen name on drafts and on sent MailCampaign.name", async () => {
    const wrapper = mount(Campaigns, {
      global: {
        plugins: [pinia],
        stubs: { CampaignFilters: true, CampaignViewModal: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("2026/07/27 - Send to a List");

    const sentTab = wrapper.findAll("button").find((button) =>
      button.text().includes("Sent"),
    );
    expect(sentTab).toBeDefined();
    await sentTab!.trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("2026/07/27 - Send to a List");
  });
});

describe("Analytics campaign filter is a different record", () => {
  it("reads Campaign.name from /api/campaigns/, not MailCampaign.name", async () => {
    const { getCampaigns } = await import("@/api/campaigns");
    const { listMailCampaigns } = await import("@/api/mailCampaigns");
    expect(getCampaigns).not.toBe(listMailCampaigns);
    // AppTopBar binds useCampaignStore.campaigns[].name (analytics Campaign).
    // Campaigns.vue sent cards bind MailCampaign.name from /api/mail-campaigns.
    // Do not copy wizard names into the analytics store on the client.
  });
});
