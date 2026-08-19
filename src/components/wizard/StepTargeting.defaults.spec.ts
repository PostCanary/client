// POS-213: fresh drafts must start with NO filters (the old always-on HVAC
// demo preset silently collapsed counts and made Data Retriever Consumer
// unreachable). Stored draft filters must still win.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, watchEffect } from 'vue'
import type { TargetingFilters } from '@/types/campaign'

const panelFilters = vi.hoisted(() => ({ current: null as TargetingFilters | null }))

vi.mock('@/components/targeting/TargetingMap.vue', () => ({
  default: {
    name: 'TargetingMap',
    setup(_: unknown, { expose }: { expose: (value: unknown) => void }) {
      expose({ areas: ref([]), selectedCrrt: new Set() })
      return {}
    },
    template: '<div data-testid="targeting-map" />',
  },
}))
vi.mock('@/components/targeting/TargetingPanel.vue', () => ({
  default: {
    name: 'TargetingPanel',
    props: ['filters'],
    setup(props: { filters: TargetingFilters }) {
      watchEffect(() => {
        panelFilters.current = props.filters
      })
      return {}
    },
    template: '<div data-testid="targeting-panel" />',
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

vi.mock('@/composables/useTargetingCapabilities', () => ({
  loadTargetingCapabilities: vi.fn(() =>
    Promise.resolve({
      failed: false,
      capabilities: {
        provider: 'planner' as const,
        strategy: 'per_campaign' as const,
        schemaVersion: 1,
        geographyTypes: ['zip' as const],
        filters: CONSUMER_SUPPORT,
        audienceFilters: { consumer: CONSUMER_SUPPORT, business: null },
        products: [],
        filterCapabilities: {},
      },
    }),
  ),
}))
vi.mock('@/composables/useHouseholdCount', () => ({
  useHouseholdCount: () => ({
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
    invalidate: vi.fn(),
  }),
}))

import StepTargeting from './StepTargeting.vue'
import { useCampaignDraftStore } from '@/stores/useCampaignDraftStore'

function activeConsumerValues(f: TargetingFilters): unknown[] {
  return [
    f.homeowner,
    f.homeValueMin,
    f.homeValueMax,
    f.yearBuiltMin,
    f.yearBuiltMax,
    f.hhageMin,
    f.hhageMax,
    f.incomeMin,
    f.loresMin,
    f.loresMax,
    f.kidsMin,
    f.kidsMax,
    f.squareFootageMin ?? null,
    f.squareFootageMax ?? null,
    f.hasEmail ?? null,
  ].filter((v) => v !== null)
}

describe('StepTargeting default filters (POS-213)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    panelFilters.current = null
  })

  it('starts a fresh draft with no filters applied', async () => {
    const draftStore = useCampaignDraftStore()
    draftStore.$patch({ draft: { targeting: undefined } as any })
    mount(StepTargeting)
    await flushPromises()
    expect(panelFilters.current).not.toBeNull()
    expect(activeConsumerValues(panelFilters.current!)).toEqual([])
    expect(panelFilters.current!.propertyTypes).toEqual([])
  })

  it('keeps stored draft filters instead of resetting them', async () => {
    const draftStore = useCampaignDraftStore()
    draftStore.$patch({
      draft: {
        targeting: {
          areas: [],
          filters: { homeValueMin: 250000, propertyTypes: ['Condo'] },
        },
      } as any,
    })
    mount(StepTargeting)
    await flushPromises()
    expect(panelFilters.current!.homeValueMin).toBe(250000)
    expect(panelFilters.current!.propertyTypes).toEqual(['Condo'])
    // Missing keys from the partial stored object are filled as nulls.
    expect(panelFilters.current!.homeowner).toBeNull()
    expect(panelFilters.current!.yearBuiltMax).toBeNull()
  })
})
