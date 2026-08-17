// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
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

vi.mock("@/api/campaignDrafts", () => ({
  saveDraft: vi.fn().mockResolvedValue(undefined),
  loadDraft: vi.fn(),
  createDraft: vi.fn(),
  deleteDraft: vi.fn(),
  listDrafts: vi.fn().mockResolvedValue([]),
}));

import WizardShell from "./WizardShell.vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";

describe("WizardShell design replace (POS-270)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.path = "/app/send/draft-1";
    routeState.query = {};
    setActivePinia(createPinia());
  });

  it("blocks Next after Replace until a new design is set, and the draft design has no stale artwork", async () => {
    const store = useCampaignDraftStore();
    store.draft = {
      id: "draft-1",
      orgId: "org-1",
      currentStep: 3,
      completedSteps: [1, 2],
      needsReviewSteps: [],
      campaignType: "targeted",
      goal: { goalType: "target_area", sequenceLength: 1 },
      targeting: { finalHouseholdCount: 12 },
      audience: null,
      design: null,
      review: null,
      createdAt: "2026-08-17T00:00:00Z",
      updatedAt: "2026-08-17T00:00:00Z",
      schemaVersion: 1,
    };

    store.setUploadedDesign({
      fileName: "old-front.png",
      mimeType: "image/png",
      fileSizeBytes: 10,
      widthPx: 1875,
      heightPx: 2775,
      frontUrl: "/media/old-front.png",
      backUrl: "/media/old-back.png",
    });

    const wrapper = shallowMount(WizardShell);
    const nextButton = () => wrapper.findAll("button").find((button) => button.text() === "Next")!;
    await nextTick();
    expect(nextButton().attributes("disabled")).toBeUndefined();

    store.clearUploadedDesign();
    await nextTick();
    expect(nextButton().attributes("disabled")).toBeDefined();
    expect(store.draft?.design?.uploadedAsset).toBeNull();
    expect(JSON.stringify(store.draft?.design)).not.toContain("/media/old-front.png");

    store.setUploadedDesign({
      fileName: "new-front.png",
      mimeType: "image/png",
      fileSizeBytes: 12,
      widthPx: 1875,
      heightPx: 2775,
      frontUrl: "/media/new-front.png",
      backUrl: null,
    });
    await nextTick();
    expect(nextButton().attributes("disabled")).toBeUndefined();
    expect(store.draft?.design?.uploadedAsset?.frontUrl).toBe("/media/new-front.png");
    expect(JSON.stringify(store.draft?.design)).not.toContain("/media/old-front.png");
  });

  it("keeps Next disabled when designSource is still uploaded but the asset was cleared", async () => {
    const store = useCampaignDraftStore();
    store.draft = {
      id: "draft-1",
      orgId: "org-1",
      currentStep: 3,
      completedSteps: [1, 2, 3],
      needsReviewSteps: [],
      campaignType: "targeted",
      goal: { goalType: "target_area", sequenceLength: 1 },
      targeting: null,
      audience: null,
      design: {
        templateId: "",
        templateLayoutType: "full-bleed",
        isCustomUpload: false,
        customUploadUrl: null,
        sequenceCards: [],
        designSource: "uploaded",
        uploadedAsset: null,
      },
      review: null,
      createdAt: "2026-08-17T00:00:00Z",
      updatedAt: "2026-08-17T00:00:00Z",
      schemaVersion: 1,
    };

    const wrapper = shallowMount(WizardShell);
    await nextTick();
    const nextButton = wrapper.findAll("button").find((button) => button.text() === "Next")!;
    expect(nextButton.attributes("disabled")).toBeDefined();
  });
});
