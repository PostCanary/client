import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import type { CampaignDraft, CardDesign, GoalSelection } from "@/types/campaign";
import { formatDefaultCampaignName } from "@/utils/defaultCampaignName";

vi.mock("vue-router", () => ({
  useRoute: () => ({ fullPath: "/app/send/draft-1", query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/composables/useTargetingCapabilities", () => ({
  loadTargetingCapabilities: vi.fn(),
}));

vi.mock("@/api/mailCampaigns", () => ({
  createApprovalArtifact: vi.fn().mockResolvedValue({ ok: true }),
  isKnownPreProviderPurchaseError: vi.fn().mockReturnValue(false),
  normalizeOrderProjection: vi.fn().mockReturnValue(null),
  purchaseCampaignRecords: vi.fn(),
  getMailScheduleAvailability: vi.fn().mockResolvedValue({
    ok: true,
    earliest_mailing_date: "2026-08-17",
    timezone: "America/Los_Angeles",
    approval_cutoff_local: "17:00:00",
    cutoff_inclusive: true,
    processing_business_days: 1,
    holiday_calendar: "us_federal_observed_nationwide",
  }),
}));

vi.mock("@/api/billing", () => ({
  createSetupSession: vi.fn(),
  fetchPaymentMethodSummary: vi.fn().mockResolvedValue({
    billing_type: "pay_per_send",
    currency: "usd",
    unit_rate_cents: 99,
    plan_code: null,
    required: true,
    has_payment_method: true,
    brand: "visa",
    last4: "4242",
    exp_month: 12,
    exp_year: 2030,
    label: "Visa 4242",
  }),
}));

vi.mock("@/api/orgs", () => ({
  getReturnAddress: vi.fn().mockResolvedValue({
    name: "Acme HVAC",
    address: "1 Main St",
    address2: null,
    city: "Anoka",
    state: "MN",
    zip: "55303",
  }),
}));

vi.mock("@/api/campaignDrafts", () => ({
  saveDraft: vi.fn().mockResolvedValue({}),
  loadDraft: vi.fn(),
  createDraft: vi.fn(),
  deleteDraft: vi.fn(),
}));

vi.mock("@/composables/approveCampaignDraft", () => ({
  approveCampaignDraft: vi.fn().mockResolvedValue({ id: "campaign-1" }),
}));

vi.mock("@/composables/useRenderJob", () => ({
  useRenderJob: () => ({
    phase: ref("idle"),
    progress: ref(null),
    cards: ref([]),
    error: ref(null),
    start: vi.fn(),
  }),
}));

const brandKitState = { location: "Anoka, MN", address: "1 Main St" };
vi.mock("@/stores/useBrandKitStore", () => ({
  useBrandKitStore: () => ({
    brandKit: brandKitState,
    hydrated: true,
    fetch: vi.fn(),
  }),
}));

vi.mock("@/components/review/ReviewSummary.vue", () => ({
  default: { name: "ReviewSummary", template: "<div />" },
}));
vi.mock("@/components/review/ScheduleEditor.vue", () => ({
  default: { name: "ScheduleEditor", template: "<div />" },
}));
vi.mock("@/components/review/CostBreakdown.vue", () => ({
  default: { name: "CostBreakdown", template: "<div />" },
}));

import StepReview from "./StepReview.vue";
import { loadTargetingCapabilities } from "@/composables/useTargetingCapabilities";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";

function goal(label: string, type: GoalSelection["goalType"] = "send_to_list"): GoalSelection {
  return {
    goalType: type,
    goalLabel: label,
    serviceType: null,
    sequenceLength: 1,
    sequenceSpacingDays: 14,
    otherGoalText: null,
  };
}

function listDraft(overrides: Partial<CampaignDraft> = {}): CampaignDraft {
  const now = "2026-08-16T00:00:00Z";
  return {
    id: "draft-1",
    orgId: "org-1",
    currentStep: 4,
    completedSteps: [1, 2, 3],
    needsReviewSteps: [],
    campaignType: "targeted",
    goal: goal("Send to a List"),
    targeting: null,
    audience: {
      audienceId: "aud-1",
      audienceSource: "csv",
      suppressionResult: {
        uploaded_count: 1,
        suppressed_count: 0,
        deliverable_count: 1,
      } as any,
      costPreview: null,
    },
    design: {
      templateId: "t1",
      templateLayoutType: "full-bleed",
      isCustomUpload: false,
      customUploadUrl: null,
      sequenceCards: [
        {
          cardNumber: 1,
          cardPurpose: "offer",
          templateId: "t1",
          previewImageUrl: "https://example.com/p.png",
          overrides: {},
          resolvedContent: {
            headline: "Hello",
            offerText: "Offer",
            offerTeaser: "Offer",
            offerItems: [],
            photoUrl: "",
            reviewQuote: "",
            reviewerName: "",
            phoneNumber: "",
            urgencyText: "",
            riskReversal: "",
            trustSignals: [],
          },
          backContent: {
            guarantee: "",
            certifications: [],
            licenseNumber: "",
            companyAddress: "",
            websiteUrl: "",
            qrCodeUrl: "",
          },
          headlineCandidates: [],
          offerReason: "",
          reviewReason: "",
          templateReason: "",
        } satisfies CardDesign,
      ],
    },
    review: null,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    ...overrides,
    createdBy: overrides.createdBy ?? null,
  };
}

async function mountReview(draft: CampaignDraft) {
  vi.mocked(loadTargetingCapabilities).mockResolvedValue({
    capabilities: {
      provider: "planner",
      strategy: "per_campaign",
      schemaVersion: 1,
      geographyTypes: ["zip"],
      filters: {
        homeowner: true,
        homeValueMin: true,
        homeValueMax: true,
        yearBuiltMin: true,
        yearBuiltMax: true,
        propertyTypes: true,
        hhageMin: true,
        hhageMax: true,
        incomeMin: true,
        loresMin: true,
        loresMax: true,
      },
      purchase_records_max_qty: 13,
    },
    failed: false,
  });
  const store = useCampaignDraftStore();
  store.draft = draft;
  const wrapper = mount(StepReview);
  await flushPromises();
  return { wrapper, store };
}

describe("StepReview campaign name (POS-188)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    brandKitState.location = "Anoka, MN";
  });

  it("defaults to YYYY/MM/DD - current goal and ignores brand-kit Anoka", async () => {
    const { wrapper, store } = await mountReview(listDraft());
    const input = wrapper.get('[data-testid="review-campaign-name"]');
    const expected = formatDefaultCampaignName("Send to a List");
    expect((input.element as HTMLInputElement).value).toBe(expected);
    expect((input.element as HTMLInputElement).value.toLowerCase()).not.toContain("anoka");
    expect(store.draft!.review?.campaignName).toBe(expected);
    expect(store.draft!.review?.campaignNameIsCustom).toBe(false);
    expect(input.classes()).toContain("text-gray-400");
  });

  it("does not leak a stale generated name from a previous campaign into a new one", async () => {
    const store = useCampaignDraftStore();
    store.draft = listDraft({
      review: {
        campaignName: "Send to a List — anoka — Jul 27",
        campaignNameIsCustom: false,
        schedules: [],
        sendSeedCopy: true,
        seedAddress: "",
        additionalSeeds: [],
        paymentMethodId: null,
        paymentMethodLabel: null,
        agreedToTerms: false,
      },
    });
    await store.startNew("org-1");
    store.draft = {
      ...listDraft({ id: "", review: null }),
      ...store.draft,
      goal: goal("Send to a List"),
    };

    const wrapper = mount(StepReview);
    await flushPromises();
    const value = (wrapper.get('[data-testid="review-campaign-name"]')
      .element as HTMLInputElement).value;
    expect(value).toBe(formatDefaultCampaignName("Send to a List"));
    expect(value.toLowerCase()).not.toContain("anoka");
  });

  it("keeps a user-edited name after regeneration, reload, and draft resume", async () => {
    const edited = "2026/03/14 - 20% off Installation";
    const { wrapper, store } = await mountReview(
      listDraft({
        review: {
          campaignName: edited,
          campaignNameIsCustom: true,
          schedules: [],
          sendSeedCopy: true,
          seedAddress: "",
          additionalSeeds: [],
          paymentMethodId: null,
          paymentMethodLabel: null,
          agreedToTerms: false,
        },
      }),
    );
    const input = wrapper.get('[data-testid="review-campaign-name"]');
    expect((input.element as HTMLInputElement).value).toBe(edited);
    expect(input.classes()).toContain("text-[var(--pc-navy,#1c2430)]");

    store.draft!.goal = goal("Target an Area", "target_area");
    await flushPromises();
    expect((input.element as HTMLInputElement).value).toBe(edited);

    const remounted = mount(StepReview);
    await flushPromises();
    expect(
      (remounted.get('[data-testid="review-campaign-name"]').element as HTMLInputElement)
        .value,
    ).toBe(edited);
    expect(store.draft!.review?.campaignNameIsCustom).toBe(true);
  });

  it("persists a typed name so a later generate cannot overwrite it", async () => {
    const { wrapper, store } = await mountReview(listDraft());
    const input = wrapper.get('[data-testid="review-campaign-name"]');
    await input.setValue("Labor Day furnace special");
    await input.trigger("input");
    await flushPromises();

    expect(store.draft!.review?.campaignName).toBe("Labor Day furnace special");
    expect(store.draft!.review?.campaignNameIsCustom).toBe(true);

    store.draft!.goal = goal("Neighbor Marketing", "neighbor_marketing");
    await flushPromises();
    expect((input.element as HTMLInputElement).value).toBe(
      "Labor Day furnace special",
    );
  });
});
