import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

const householdMock = vi.hoisted(() => ({ current: null as any }))
const mapAreasMock = vi.hoisted(() => ({
  current: null as { value: Array<{ type: string; coordinates: unknown[]; zipCode: string }> } | null,
}))

vi.mock('@/components/targeting/TargetingMap.vue', () => {
  const areas = ref([{ type: 'zip', coordinates: [], zipCode: '10001' }])
  mapAreasMock.current = areas
  return {
    default: {
      name: 'TargetingMap',
      setup(_: unknown, { expose }: { expose: (value: unknown) => void }) {
        expose({
          areas,
          selectedCrrt: new Set(),
        })
        return {}
      },
      template: '<div data-testid="targeting-map" />',
    },
  }
})
vi.mock('@/components/targeting/TargetingPanel.vue', () => ({
  default: {
    name: 'TargetingPanel',
    props: ['recipientCapWarning'],
    emits: ['update:audienceType'],
    template:
      '<div data-testid="targeting-panel">' +
      '<div v-if="recipientCapWarning" data-testid="over-recipient-cap-warning">{{ recipientCapWarning }}</div>' +
      '<button data-testid="switch-business" @click="$emit(\'update:audienceType\', \'business\')">Business</button>' +
      '</div>',
  },
}))
vi.mock('@/components/targeting/EddmTargetingPanel.vue', () => ({
  default: { name: 'EddmTargetingPanel', template: '<div data-testid="eddm-panel" />' },
}))
vi.mock('@/composables/usePricing', () => ({
  usePricing: () => ({ payPerSend: 0.99 }),
  payPerSendRateFor: () => 0.99,
}))
vi.mock('@/stores/useBrandKitStore', () => ({
  useBrandKitStore: () => ({ hydrated: true, fetch: vi.fn() }),
}))
vi.mock('@/composables/useTargetingCapabilities', () => ({
  loadTargetingCapabilities: vi.fn(),
}))
vi.mock('@/composables/useHouseholdCount', () => {
  const current = {
    count: ref(0),
    totalCount: ref(0),
    filteredCount: ref(0),
    exclusions: ref({ pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 }),
    loading: ref(false),
    error: ref(null),
    source: ref('melissa'),
    ready: ref(false),
    queryPlan: ref(null),
    fetchCount: vi.fn(),
    fetchTotalIfNeeded: vi.fn(),
  }
  householdMock.current = {
    ...current,
    invalidate: vi.fn(() => {
      current.ready.value = false
      current.queryPlan.value = null
    }),
  }
  return { useHouseholdCount: () => householdMock.current }
})

import StepTargeting from './StepTargeting.vue'
import { loadTargetingCapabilities } from '@/composables/useTargetingCapabilities'
import { useCampaignDraftStore } from '@/stores/useCampaignDraftStore'

const CONSUMER_SUPPORT = {
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
  squareFootageMin: true,
  squareFootageMax: true,
  hasEmail: true,
  dogOwner: true,
  catOwner: true,
  otherPetOwner: true,
}

const BUSINESS_SUPPORT = {
  businessSicCodes: true,
  businessNaicsCodes: true,
  businessJobTitles: true,
  businessManagementLevels: true,
  businessEmployeeMin: true,
  businessEmployeeMax: true,
  businessSalesMin: true,
  businessSalesMax: true,
  businessHasEmail: true,
  businessWorkAtHome: true,
}

const PLANNER_CAPABILITIES = {
  provider: 'planner' as const,
  strategy: 'per_campaign' as const,
  schemaVersion: 1,
  geographyTypes: ['zip' as const],
  filters: CONSUMER_SUPPORT,
  audienceFilters: { consumer: CONSUMER_SUPPORT, business: BUSINESS_SUPPORT },
  products: [{
    id: 'data_retriever_business',
    audienceType: 'business' as const,
    enabled: true,
    implemented: true,
  }],
  filterCapabilities: {},
}

describe('StepTargeting capability gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    householdMock.current.count.value = 0
    householdMock.current.totalCount.value = 0
    householdMock.current.filteredCount.value = 0
    householdMock.current.exclusions.value = {
      pastCustomers: 0,
      recentlyMailed: 0,
      doNotMail: 0,
    }
    householdMock.current.loading.value = false
    householdMock.current.error.value = null
    householdMock.current.source.value = 'melissa'
    householdMock.current.ready.value = false
    householdMock.current.queryPlan.value = null
    if (mapAreasMock.current) {
      mapAreasMock.current.value = [{ type: 'zip', coordinates: [], zipCode: '10001' }]
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fails closed and retries before rendering targeting controls', async () => {
    vi.mocked(loadTargetingCapabilities)
      .mockResolvedValueOnce({ capabilities: null, failed: true })
      .mockResolvedValueOnce({ capabilities: PLANNER_CAPABILITIES, failed: false })

    const wrapper = mount(StepTargeting)
    await flushPromises()

    expect(wrapper.get('[data-testid="targeting-capabilities-error"]').text())
      .toContain('could not be verified')
    expect(wrapper.find('[data-testid="targeting-panel"]').exists()).toBe(false)
    expect(wrapper.emitted('targeting-validity')).toEqual([[false]])

    await wrapper.get('[data-testid="retry-targeting-capabilities"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="targeting-capabilities-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="targeting-panel"]').exists()).toBe(true)
    expect(loadTargetingCapabilities).toHaveBeenCalledTimes(2)
  })

  it('invalidates Consumer readiness on a Business switch until its matching plan is stored', async () => {
    vi.useFakeTimers()
    vi.mocked(loadTargetingCapabilities).mockResolvedValue({
      capabilities: PLANNER_CAPABILITIES,
      failed: false,
    })
    const store = useCampaignDraftStore()
    const now = '2026-08-14T00:00:00Z'
    store.draft = {
      id: '',
      orgId: 'org-1',
      currentStep: 2,
      completedSteps: [1],
      needsReviewSteps: [],
      campaignType: 'targeted',
      goal: null,
      targeting: null,
      audience: null,
      design: null,
      review: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    }
    const wrapper = mount(StepTargeting)
    await flushPromises()
    const area = { type: 'zip', coordinates: [], zipCode: '10001' }
    const consumerPlan = {
      schemaVersion: 1,
      audienceType: 'consumer',
      provider: 'melissa',
      product: 'leadgen_property',
      areas: [area],
      // POS-213: fresh drafts carry no filters, so the attested plan's
      // active-filter snapshot is empty.
      filters: {},
      suppressionPolicy: { excludePastCustomers: true, excludeMailedWithinDays: 30 },
      requests: [],
      outputColumns: [],
      fingerprint: 'a'.repeat(64),
      countProof: {
        filteredCount: 1,
        finalCount: 1,
        exclusions: { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 },
        source: 'melissa',
      },
      attestation: 'b'.repeat(64),
    }
    householdMock.current.count.value = 1
    householdMock.current.filteredCount.value = 1
    householdMock.current.queryPlan.value = consumerPlan
    householdMock.current.ready.value = true
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    let validityEvents = wrapper.emitted('targeting-validity') ?? []
    expect(validityEvents[validityEvents.length - 1]).toEqual([true])
    expect(store.draft?.targeting?.audienceType).toBe('consumer')

    await wrapper.get('[data-testid="switch-business"]').trigger('click')

    validityEvents = wrapper.emitted('targeting-validity') ?? []
    expect(validityEvents[validityEvents.length - 1]).toEqual([false])
    expect(store.draft?.targeting?.audienceType).toBe('consumer')

    householdMock.current.source.value = 'melissa_data_retriever'
    householdMock.current.queryPlan.value = {
      ...consumerPlan,
      audienceType: 'business',
      product: 'data_retriever_business',
      filters: {},
      fingerprint: 'c'.repeat(64),
      countProof: {
        ...consumerPlan.countProof,
        source: 'melissa_data_retriever',
      },
      attestation: 'd'.repeat(64),
    }
    householdMock.current.ready.value = true
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    validityEvents = wrapper.emitted('targeting-validity') ?? []
    expect(validityEvents[validityEvents.length - 1]).toEqual([true])
    expect(store.draft?.targeting?.audienceType).toBe('business')
  })

  it('shows the over-cap warning and keeps Next disabled when the count exceeds the server cap', async () => {
    vi.useFakeTimers()
    const mockedCap = 11
    vi.mocked(loadTargetingCapabilities).mockResolvedValue({
      capabilities: { ...PLANNER_CAPABILITIES, purchase_records_max_qty: mockedCap },
      failed: false,
    })
    const store = useCampaignDraftStore()
    const now = '2026-08-16T00:00:00Z'
    store.draft = {
      id: '',
      orgId: 'org-1',
      currentStep: 2,
      completedSteps: [1],
      needsReviewSteps: [],
      campaignType: 'targeted',
      goal: null,
      targeting: null,
      audience: null,
      design: null,
      review: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    }
    const wrapper = mount(StepTargeting)
    await flushPromises()

    const area = { type: 'zip', coordinates: [], zipCode: '10001' }
    const overCapCount = mockedCap + 3
    householdMock.current.count.value = overCapCount
    householdMock.current.filteredCount.value = overCapCount
    householdMock.current.queryPlan.value = {
      schemaVersion: 1,
      audienceType: 'consumer',
      provider: 'melissa',
      product: 'leadgen_property',
      areas: [area],
      filters: {},
      suppressionPolicy: { excludePastCustomers: true, excludeMailedWithinDays: 30 },
      requests: [],
      outputColumns: [],
      fingerprint: 'a'.repeat(64),
      countProof: {
        filteredCount: overCapCount,
        finalCount: overCapCount,
        exclusions: { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 },
        source: 'melissa',
      },
      attestation: 'b'.repeat(64),
    }
    householdMock.current.ready.value = true
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    const warning = wrapper.get('[data-testid="over-recipient-cap-warning"]')
    expect(warning.text()).toContain(mockedCap.toLocaleString())
    expect(warning.text()).toMatch(/narrow your filters/i)
    const validityEvents = wrapper.emitted('targeting-validity') ?? []
    expect(validityEvents[validityEvents.length - 1]).toEqual([false])
  })

  it('does not show the over-cap warning when the count is at the server cap', async () => {
    vi.useFakeTimers()
    const mockedCap = 11
    vi.mocked(loadTargetingCapabilities).mockResolvedValue({
      capabilities: { ...PLANNER_CAPABILITIES, purchase_records_max_qty: mockedCap },
      failed: false,
    })
    const store = useCampaignDraftStore()
    const now = '2026-08-16T00:00:00Z'
    store.draft = {
      id: '',
      orgId: 'org-1',
      currentStep: 2,
      completedSteps: [1],
      needsReviewSteps: [],
      campaignType: 'targeted',
      goal: null,
      targeting: null,
      audience: null,
      design: null,
      review: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    }
    const wrapper = mount(StepTargeting)
    await flushPromises()

    const area = { type: 'zip', coordinates: [], zipCode: '10001' }
    householdMock.current.count.value = mockedCap
    householdMock.current.filteredCount.value = mockedCap
    householdMock.current.queryPlan.value = {
      schemaVersion: 1,
      audienceType: 'consumer',
      provider: 'melissa',
      product: 'leadgen_property',
      areas: [area],
      filters: {},
      suppressionPolicy: { excludePastCustomers: true, excludeMailedWithinDays: 30 },
      requests: [],
      outputColumns: [],
      fingerprint: 'a'.repeat(64),
      countProof: {
        filteredCount: mockedCap,
        finalCount: mockedCap,
        exclusions: { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 },
        source: 'melissa',
      },
      attestation: 'b'.repeat(64),
    }
    householdMock.current.ready.value = true
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(wrapper.find('[data-testid="over-recipient-cap-warning"]').exists()).toBe(false)
    const validityEvents = wrapper.emitted('targeting-validity') ?? []
    expect(validityEvents[validityEvents.length - 1]).toEqual([true])
  })

  it('POS-269: a same-query area resync does not drop an attested count', async () => {
    vi.useFakeTimers()
    vi.mocked(loadTargetingCapabilities).mockResolvedValue({
      capabilities: PLANNER_CAPABILITIES,
      failed: false,
    })
    const store = useCampaignDraftStore()
    const now = '2026-08-17T00:00:00Z'
    store.draft = {
      id: 'draft-1',
      orgId: 'org-1',
      currentStep: 2,
      completedSteps: [1],
      needsReviewSteps: [],
      campaignType: 'targeted',
      goal: null,
      targeting: null,
      audience: null,
      design: null,
      review: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    }
    const wrapper = mount(StepTargeting)
    await flushPromises()

    const area = { type: 'zip', coordinates: [], zipCode: '10001' }
    const attestedPlan = {
      schemaVersion: 1,
      audienceType: 'consumer',
      provider: 'melissa',
      product: 'leadgen_property',
      areas: [area],
      filters: {},
      suppressionPolicy: { excludePastCustomers: true, excludeMailedWithinDays: 30 },
      requests: [],
      outputColumns: [],
      fingerprint: 'a'.repeat(64),
      countProof: {
        filteredCount: 12,
        finalCount: 12,
        exclusions: { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 },
        source: 'melissa',
      },
      attestation: 'b'.repeat(64),
    }
    householdMock.current.count.value = 12
    householdMock.current.filteredCount.value = 12
    householdMock.current.queryPlan.value = attestedPlan
    householdMock.current.ready.value = true
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    let validityEvents = wrapper.emitted('targeting-validity') ?? []
    expect(validityEvents[validityEvents.length - 1]).toEqual([true])
    const fetchCountCalls = householdMock.current.fetchCount.mock.calls.length
    const invalidateCalls = householdMock.current.invalidate.mock.calls.length

    // Document mouseup rebuilds a new array with the same geometry.
    mapAreasMock.current!.value = [{ type: 'zip', coordinates: [], zipCode: '10001' }]
    await flushPromises()

    validityEvents = wrapper.emitted('targeting-validity') ?? []
    expect(validityEvents[validityEvents.length - 1]).toEqual([true])
    expect(householdMock.current.fetchCount).toHaveBeenCalledTimes(fetchCountCalls)
    expect(householdMock.current.invalidate).toHaveBeenCalledTimes(invalidateCalls)

    mapAreasMock.current!.value = [{ type: 'zip', coordinates: [], zipCode: '10002' }]
    await flushPromises()

    validityEvents = wrapper.emitted('targeting-validity') ?? []
    expect(validityEvents[validityEvents.length - 1]).toEqual([false])
    expect(householdMock.current.fetchCount.mock.calls.length).toBeGreaterThan(fetchCountCalls)
  })
})
