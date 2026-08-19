import { beforeEach, describe, expect, it, vi } from "vitest"
import { flushPromises, mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import { ref } from "vue"
import type { CampaignDraft, CardDesign } from "@/types/campaign"

const mockedCap = 13

vi.mock("vue-router", () => ({
  useRoute: () => ({ fullPath: "/app/send/draft-1", query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/composables/useTargetingCapabilities", () => ({
  loadTargetingCapabilities: vi.fn(),
}))

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
}))

vi.mock("@/api/billing", () => ({
  createSetupSession: vi.fn(),
  fetchPaymentMethodSummary: vi.fn().mockResolvedValue({
    billing_type: "pay_per_send",
    currency: "usd",
    unit_rate_cents: 89,
    plan_code: null,
    required: true,
    has_payment_method: true,
    brand: "visa",
    last4: "4242",
    exp_month: 12,
    exp_year: 2030,
    label: "Visa 4242",
  }),
}))

vi.mock("@/api/orgs", () => ({
  getReturnAddress: vi.fn().mockResolvedValue({
    name: "Acme HVAC",
    address: "1 Main St",
    address2: null,
    city: "Irvine",
    state: "CA",
    zip: "92618",
  }),
}))

vi.mock("@/api/campaignDrafts", () => ({
  saveDraft: vi.fn().mockResolvedValue({}),
  loadDraft: vi.fn(),
  createDraft: vi.fn(),
  deleteDraft: vi.fn(),
}))

vi.mock("@/composables/approveCampaignDraft", () => ({
  approveCampaignDraft: vi.fn().mockResolvedValue({ id: "campaign-1" }),
}))

vi.mock("@/composables/useRenderJob", () => ({
  useRenderJob: () => ({
    phase: ref("idle"),
    progress: ref(null),
    cards: ref([]),
    error: ref(null),
    start: vi.fn(),
  }),
}))

vi.mock("@/stores/useBrandKitStore", () => ({
  useBrandKitStore: () => ({
    brandKit: { location: "Irvine", address: "1 Main St" },
    hydrated: true,
    fetch: vi.fn(),
  }),
}))

vi.mock("@/components/review/ReviewSummary.vue", () => ({
  default: { name: "ReviewSummary", template: "<div />" },
}))
vi.mock("@/components/review/ScheduleEditor.vue", () => ({
  default: { name: "ScheduleEditor", template: "<div />" },
}))
vi.mock("@/components/review/CostBreakdown.vue", () => ({
  default: { name: "CostBreakdown", template: "<div />" },
}))

import StepReview from "./StepReview.vue"
import { loadTargetingCapabilities } from "@/composables/useTargetingCapabilities"
import { purchaseCampaignRecords } from "@/api/mailCampaigns"
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore"

function draftWithHouseholds(finalHouseholdCount: number): CampaignDraft {
  const now = "2026-08-16T00:00:00Z"
  return {
    id: "draft-1",
    orgId: "org-1",
    currentStep: 4,
    completedSteps: [1, 2, 3],
    needsReviewSteps: [],
    campaignType: "targeted",
    goal: {
      goalType: "neighbor_marketing",
      goalLabel: "Neighbor marketing",
      serviceType: null,
      sequenceLength: 1,
      sequenceSpacingDays: 14,
      otherGoalText: null,
    },
    targeting: {
      campaignGoal: "neighbor_marketing",
      serviceType: null,
      sequenceLength: 1,
      sequenceSpacingDays: 14,
      areas: [{ type: "zip", coordinates: [], zipCode: "92618" }],
      method: "zip",
      filters: {
        homeowner: null,
        homeValueMin: null,
        homeValueMax: null,
        yearBuiltMin: null,
        yearBuiltMax: null,
        propertyTypes: [],
        hhageMin: null,
        hhageMax: null,
        incomeMin: null,
        loresMin: null,
        loresMax: null,
      kidsMin: null,
      kidsMax: null,
      },
      jobsUsed: null,
      jobRadiusMiles: null,
      excludePastCustomers: true,
      excludeMailedWithinDays: 30,
      doNotMailCount: 0,
      totalHouseholds: finalHouseholdCount,
      excludedPastCustomers: 0,
      excludedRecentlyMailed: 0,
      excludedDoNotMail: 0,
      finalHouseholdCount,
      pastCustomersInArea: 0,
      recipientBreakdown: {
        newProspects: finalHouseholdCount,
        pastCustomers: 0,
        pastCustomersIncluded: false,
      },
      estimatedCostSingle: finalHouseholdCount,
      estimatedCostSequence: finalHouseholdCount,
      countSource: "melissa",
      queryPlan: null,
      savedAudienceName: null,
      eddmSelection: null,
    },
    audience: null,
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
  }
}

async function mountReview(finalHouseholdCount: number) {
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
      kidsMin: true,
      kidsMax: true,
      },
      purchase_records_max_qty: mockedCap,
    },
    failed: false,
  })
  const store = useCampaignDraftStore()
  store.draft = draftWithHouseholds(finalHouseholdCount)
  store.error = null
  const wrapper = mount(StepReview)
  await flushPromises()
  const checkbox = wrapper.get("#accuracy-ack")
  await checkbox.setValue(true)
  await flushPromises()
  return { wrapper, store }
}

describe("StepReview stale over-cap draft (POS-262)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it("shows the cap warning and blocks Approve when a loaded draft is over the live cap", async () => {
    const { wrapper } = await mountReview(mockedCap + 8)
    const warning = wrapper.get('[data-testid="over-recipient-cap-warning"]')
    expect(warning.text()).toContain(mockedCap.toLocaleString())
    expect(wrapper.get('[data-testid="review-approve"]').attributes("disabled")).toBeDefined()
  })

  it("does not show the cap warning and allows Approve when the draft is at the live cap", async () => {
    const { wrapper } = await mountReview(mockedCap)
    expect(wrapper.find('[data-testid="over-recipient-cap-warning"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="review-approve"]').attributes("disabled")).toBeUndefined()
  })

  it("replaces the catch-all purchase copy only for OverRecipientCap", async () => {
    const requestedQty = mockedCap + 6
    vi.mocked(purchaseCampaignRecords).mockRejectedValue({
      status: 400,
      data: {
        error: {
          type: "OverRecipientCap",
          message: "Quantity exceeds the current recipient cap",
          details: { max_qty: mockedCap, requested_qty: requestedQty },
        },
      },
    })
    const { wrapper, store } = await mountReview(mockedCap)
    await wrapper.get('[data-testid="review-approve"]').trigger("click")
    await flushPromises()
    expect(store.error).toContain(requestedQty.toLocaleString())
    expect(store.error).toContain(mockedCap.toLocaleString())
    expect(store.error).toMatch(/Go back to Targeting/i)
    expect(store.error).not.toMatch(/could not be safely confirmed/)
  })

  it("keeps the catch-all purchase copy for other ambiguous failures", async () => {
    vi.mocked(purchaseCampaignRecords).mockRejectedValue({
      status: 500,
      data: { error: { type: "InternalError", message: "boom" } },
    })
    const { wrapper, store } = await mountReview(mockedCap)
    await wrapper.get('[data-testid="review-approve"]').trigger("click")
    await flushPromises()
    expect(store.error).toMatch(/could not be safely confirmed/)
    expect(store.error).toMatch(/do not approve or retry/)
  })
})
