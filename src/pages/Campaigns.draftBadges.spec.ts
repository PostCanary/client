import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const {
  deleteDraftMock,
  listDraftsMock,
  listMailCampaignsMock,
  pushMock,
} = vi.hoisted(() => ({
  deleteDraftMock: vi.fn(),
  listDraftsMock: vi.fn(),
  listMailCampaignsMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({
    name: "Campaigns",
    path: "/app/campaigns",
    query: {},
  }),
}));

vi.mock("@/composables/usePostHog", () => ({
  captureEvent: vi.fn(),
}));

vi.mock("@/api/campaignDrafts", () => ({
  deleteDraft: deleteDraftMock,
  listDrafts: listDraftsMock,
}));

vi.mock("@/api/mailCampaigns", () => ({
  getMailCampaign: vi.fn(),
  listMailCampaigns: listMailCampaignsMock,
  pauseMailCampaign: vi.fn(),
  resumeMailCampaign: vi.fn(),
}));

import AppSidebar from "@/components/layout/AppSidebar.vue";
import Campaigns from "./Campaigns.vue";
import { useAuthStore } from "@/stores/auth";

function draft(id: string, currentStep: number) {
  return {
    id,
    currentStep,
    completedSteps: [],
    needsReviewSteps: currentStep === 4 ? [3, 4] : [],
    goal: { goalLabel: id },
  } as any;
}

describe("POS-170 campaign draft badges", () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    localStorage.setItem("pc:sidebar:collapsed", "true");
    pinia = createPinia();
    setActivePinia(pinia);
    const auth = useAuthStore();
    auth.me = {
      authenticated: true,
      org_id: "org-1",
      features: ["postcards"],
    } as any;

    deleteDraftMock.mockReset().mockResolvedValue(undefined);
    listMailCampaignsMock.mockReset().mockResolvedValue([]);
    listDraftsMock
      .mockReset()
      .mockResolvedValueOnce([
        draft("returned-to-step-2", 2),
        draft("review-required", 4),
      ])
      .mockResolvedValue([draft("review-required", 4)]);
    pushMock.mockReset();
  });

  it("renders the same shared count on both surfaces and updates both after delete", async () => {
    const Harness = defineComponent({
      components: { AppSidebar, Campaigns },
      template: "<AppSidebar /><Campaigns />",
    });
    const wrapper = mount(Harness, {
      global: {
        plugins: [pinia],
        stubs: {
          CampaignFilters: true,
          CampaignListCard: true,
          CampaignViewModal: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.get('[data-testid="sidebar-draft-count"]').text()).toBe("2");
    expect(wrapper.get('[data-testid="campaigns-draft-count"]').text()).toBe("2");
    expect(
      wrapper.get('button[aria-label="Campaigns, 2 campaign drafts"]').attributes("title"),
    ).toBe("Campaigns, 2 campaign drafts");

    const deleteButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "Delete");
    expect(deleteButton).toBeDefined();
    await deleteButton!.trigger("click");
    await flushPromises();

    expect(deleteDraftMock).toHaveBeenCalledWith("returned-to-step-2");
    expect(wrapper.get('[data-testid="sidebar-draft-count"]').text()).toBe("1");
    expect(wrapper.get('[data-testid="campaigns-draft-count"]').text()).toBe("1");
  });
});
