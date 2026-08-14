// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from "vitest";
import { shallowMount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";

const replaceMock = vi.fn();
const routeState = {
  path: "/app/send/draft-1",
  query: {},
  params: { draftId: "draft-1" },
};

vi.mock("vue-router", () => ({
  onBeforeRouteLeave: vi.fn(),
  useRoute: () => routeState,
  useRouter: () => ({
    replace: (...args: unknown[]) => replaceMock(...args),
    push: vi.fn(),
  }),
}));

vi.mock("@/composables/useScrapeRegenWatcher", () => ({
  useScrapeRegenWatcher: () => ({
    bannerVisible: false,
    bannerRefreshing: false,
    toastMessage: null,
    refresh: vi.fn(),
    keep: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));

import WizardShell from "./WizardShell.vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";

describe("WizardShell Send-to-a-List Step 2 routing (POS-190)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.path = "/app/send/draft-1";
    routeState.query = {};
    const pinia = createPinia();
    setActivePinia(pinia);
  });

  it("returns a persisted list draft to its list review instead of area targeting", async () => {
    const store = useCampaignDraftStore();
    store.draft = {
      id: "draft-1",
      orgId: "org-1",
      currentStep: 2,
      completedSteps: [1, 2, 3],
      needsReviewSteps: [],
      campaignType: "targeted",
      goal: { goalType: "send_to_list", sequenceLength: 1 },
      targeting: null,
      audience: {
        audienceId: "aud-123",
        audienceSource: "csv",
        suppressionResult: null,
        costPreview: null,
      },
      design: null,
      review: null,
      createdAt: "2026-07-28T00:00:00Z",
      updatedAt: "2026-07-28T00:00:00Z",
      schemaVersion: 1,
    };

    shallowMount(WizardShell);
    await flushPromises();

    expect(replaceMock).toHaveBeenCalledWith({
      path: "/app/send/draft-1/sttl-step-2",
      query: { audienceId: "aud-123" },
    });
  });

  it("does not redirect an area-targeting draft", async () => {
    const store = useCampaignDraftStore();
    store.draft = {
      id: "draft-1",
      orgId: "org-1",
      currentStep: 2,
      completedSteps: [1],
      needsReviewSteps: [],
      campaignType: "targeted",
      goal: { goalType: "target_area", sequenceLength: 1 },
      targeting: null,
      audience: null,
      design: null,
      review: null,
      createdAt: "2026-07-28T00:00:00Z",
      updatedAt: "2026-07-28T00:00:00Z",
      schemaVersion: 1,
    };

    shallowMount(WizardShell);
    await flushPromises();

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("disables Next again as soon as the targeting query becomes stale", async () => {
    const store = useCampaignDraftStore();
    store.draft = {
      id: "draft-1",
      orgId: "org-1",
      currentStep: 2,
      completedSteps: [1, 2],
      needsReviewSteps: [],
      campaignType: "targeted",
      goal: { goalType: "target_area", sequenceLength: 1 },
      targeting: null,
      audience: null,
      design: null,
      review: null,
      createdAt: "2026-07-28T00:00:00Z",
      updatedAt: "2026-07-28T00:00:00Z",
      schemaVersion: 1,
    };
    const wrapper = shallowMount(WizardShell);
    const nextButton = () => wrapper.findAll("button").find((button) => button.text() === "Next")!;
    const targetingStep = wrapper.findComponent({ name: "StepTargeting" });

    expect(nextButton().attributes("disabled")).toBeDefined();

    targetingStep.vm.$emit("targeting-validity", true);
    await nextTick();
    expect(nextButton().attributes("disabled")).toBeUndefined();

    targetingStep.vm.$emit("targeting-validity", false);
    await nextTick();
    expect(nextButton().attributes("disabled")).toBeDefined();
  });
});
