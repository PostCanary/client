// @ts-nocheck
// Vitest unit test for SttLStep2.vue
// Requires: npm install -D vitest @vue/test-utils happy-dom
// Run: npx vitest run src/components/wizard/strategies/SttLStep2.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SttLStep2 from './SttLStep2.vue'

// ── mock shared sub-components ────────────────────────────────────────────────
vi.mock('@/components/wizard/Step2Header.vue', () => ({
  default: { name: 'Step2Header', template: '<div data-testid="step2-header" />', props: ['stepNumber', 'strategy', 'subText'] },
}))
vi.mock('@/components/wizard/SuppressionStrip.vue', () => ({
  default: { name: 'SuppressionStrip', template: '<div data-testid="suppression-strip" />', props: ['uploaded', 'suppressed', 'deliverable'] },
}))
vi.mock('@/components/wizard/EnrichCostBlock.vue', () => ({
  default: { name: 'EnrichCostBlock', template: '<div data-testid="enrich-cost-block" />', props: ['costPreview'] },
}))
vi.mock('@/components/wizard/AudienceMapPreview.vue', () => ({
  default: { name: 'AudienceMapPreview', template: '<div data-testid="audience-map" />', props: ['points'] },
}))

// ── mock audiences API ────────────────────────────────────────────────────────
const mockCreateAudience = vi.fn()
const mockSuppressAudience = vi.fn()
const mockGetAudienceCost = vi.fn()
const mockGetAudiencePoints = vi.fn()
const mockApproveAudience = vi.fn()

vi.mock('@/api/audiences', () => ({
  createAudience: (...args) => mockCreateAudience(...args),
  suppressAudience: (...args) => mockSuppressAudience(...args),
  getAudienceCost: (...args) => mockGetAudienceCost(...args),
  getAudiencePoints: (...args) => mockGetAudiencePoints(...args),
  approveAudience: (...args) => mockApproveAudience(...args),
}))

// ── fixtures ──────────────────────────────────────────────────────────────────
const AUDIENCE_ID = 'aud-123'
const CAMPAIGN_ID = 'cmp-456'

const suppressionResult = {
  audience_id: AUDIENCE_ID,
  uploaded_count: 500,
  suppressed: { dnm: 10, past_customer: 5, recently_mailed: 3, total_suppressed: 18 },
  deliverable_count: 482,
  precedence: ['dnm', 'past_customer', 'recently_mailed'],
}

const costPreview = {
  audience_id: AUDIENCE_ID,
  deliverable_count: 482,
  per_card_cost_cents: 99,
  per_card_subtotal_cents: 47718,
  enrich_enabled: false,
  melissa_enrich_estimate_cents: null,
  total_cents: 47718,
}

const approvalResponse = {
  audience_id: AUDIENCE_ID,
  status: 'approved',
  campaign_id: CAMPAIGN_ID,
  approved_at: '2026-01-01T00:00:00Z',
}

// ── helpers ───────────────────────────────────────────────────────────────────
function mountCsv(file = new File(['name,address1,city,state,zip\nBob,1 Main,Dallas,TX,75001'], 'list.csv')) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(SttLStep2, {
    props: { audienceSource: 'csv', file, campaignId: CAMPAIGN_ID },
    global: { plugins: [pinia], stubs: { leaflet: true } },
  })
}

function mountExisting() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(SttLStep2, {
    props: { audienceSource: 'existing', existingAudienceId: AUDIENCE_ID, campaignId: CAMPAIGN_ID },
    global: { plugins: [pinia], stubs: { leaflet: true } },
  })
}

// ── tests ─────────────────────────────────────────────────────────────────────
describe('SttLStep2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mockCreateAudience.mockResolvedValue({ status: 201, data: { audience: { id: AUDIENCE_ID } } })
    mockSuppressAudience.mockResolvedValue(suppressionResult)
    mockGetAudienceCost.mockResolvedValue(costPreview)
    mockGetAudiencePoints.mockResolvedValue({ points: [], total_zips: 0, unmatched_zips: 0 })
    mockApproveAudience.mockResolvedValue(approvalResponse)
  })

  it('renders all 4 sub-component sections', async () => {
    const wrapper = mountCsv()
    await flushPromises()

    expect(wrapper.find('[data-testid="step2-header"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="suppression-strip"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="audience-map"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="enrich-cost-block"]').exists()).toBe(true)
  })

  it('calls createAudience → suppressAudience → getAudienceCost in sequence for csv mode', async () => {
    const wrapper = mountCsv()
    await flushPromises()

    expect(mockCreateAudience).toHaveBeenCalledOnce()
    expect(mockSuppressAudience).toHaveBeenCalledWith(AUDIENCE_ID)
    expect(mockGetAudienceCost).toHaveBeenCalledWith(AUDIENCE_ID)
    expect(wrapper.emitted('state-change')).toEqual([
      [
        {
          audienceId: AUDIENCE_ID,
          audienceSource: 'csv',
          suppressionResult: null,
          costPreview: null,
        },
      ],
      [
        {
          audienceId: AUDIENCE_ID,
          audienceSource: 'csv',
          suppressionResult,
        },
      ],
      [
        {
          audienceId: AUDIENCE_ID,
          audienceSource: 'csv',
          costPreview,
        },
      ],
    ])
  })

  it('emits audience source, resolved audience, suppression, and cost preview for wrapper persistence', async () => {
    const wrapper = mountCsv()
    await flushPromises()

    expect(wrapper.emitted('state-change')).toEqual([
      [
        {
          audienceId: AUDIENCE_ID,
          audienceSource: 'csv',
          suppressionResult: null,
          costPreview: null,
        },
      ],
      [
        {
          audienceId: AUDIENCE_ID,
          audienceSource: 'csv',
          suppressionResult,
        },
      ],
      [
        {
          audienceId: AUDIENCE_ID,
          audienceSource: 'csv',
          costPreview,
        },
      ],
    ])
  })

  it('skips createAudience for existing mode and uses existingAudienceId', async () => {
    mountExisting()
    await flushPromises()

    expect(mockCreateAudience).not.toHaveBeenCalled()
    expect(mockSuppressAudience).toHaveBeenCalledWith(AUDIENCE_ID)
    expect(mockGetAudienceCost).toHaveBeenCalledWith(AUDIENCE_ID)
  })

  it('approve button is disabled while loading', () => {
    const wrapper = mountCsv()
    // Before flushPromises: still loading
    const btn = wrapper.find('[data-testid="approve-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('approve button is enabled after flow completes', async () => {
    const wrapper = mountCsv()
    await flushPromises()

    const btn = wrapper.find('[data-testid="approve-btn"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('emits approved event with audienceId and campaignId on approve click', async () => {
    const wrapper = mountCsv()
    await flushPromises()

    await wrapper.find('[data-testid="approve-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('approved')).toBeTruthy()
    const [emittedAudienceId, emittedCampaignId] = wrapper.emitted('approved')![0]
    expect(emittedAudienceId).toBe(AUDIENCE_ID)
    expect(emittedCampaignId).toBe(CAMPAIGN_ID)
    expect(wrapper.emitted('state-change')?.at(-1)?.[0]).toMatchObject({
      audienceId: AUDIENCE_ID,
      audienceSource: 'csv',
      suppressionResult,
      costPreview,
    })
  })

  it('emits back event when back button is clicked', async () => {
    const wrapper = mountCsv()
    await wrapper.find('[data-testid="back-btn"]').trigger('click')

    expect(wrapper.emitted('back')).toBeTruthy()
  })

  it('shows error banner when upload fails', async () => {
    mockCreateAudience.mockResolvedValue({ status: 500, data: { message: 'Server error' } })
    const wrapper = mountCsv()
    await flushPromises()

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error-banner"]').text()).toContain('Server error')
  })

  it('stops before suppression when column mapping is required', async () => {
    mockCreateAudience.mockResolvedValue({
      status: 409,
      data: { missing: ['zip', 'address1'] },
    })
    const wrapper = mountCsv()
    await flushPromises()

    expect(mockSuppressAudience).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="error-banner"]').text()).toContain('Column mapping required')
    expect(wrapper.find('[data-testid="error-banner"]').text()).toContain('zip, address1')
  })

  it('shows cost retry state and retries cost preview without rerunning suppression', async () => {
    mockGetAudienceCost
      .mockRejectedValueOnce(new Error('Cost API unavailable'))
      .mockResolvedValueOnce(costPreview)

    const wrapper = mountCsv()
    await flushPromises()

    expect(mockSuppressAudience).toHaveBeenCalledOnce()
    expect(mockGetAudienceCost).toHaveBeenCalledOnce()
    expect(wrapper.find('[data-testid="cost-retry-banner"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="approve-btn"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[data-testid="retry-cost-btn"]').trigger('click')
    await flushPromises()

    expect(mockSuppressAudience).toHaveBeenCalledOnce()
    expect(mockGetAudienceCost).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="cost-retry-banner"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="approve-btn"]').attributes('disabled')).toBeUndefined()
  })

  it('maps audience points into AudienceMapPreview pin shape with labels', async () => {
    mockGetAudiencePoints.mockResolvedValue({
      points: [
        { zip: '55317', lat: 44.8547, lng: -93.5312, count: 12 },
        { zip: '75001', lat: 32.9483, lng: -96.8397, count: 1 },
      ],
      total_zips: 2,
      unmatched_zips: 0,
    })

    const wrapper = mountCsv()
    await flushPromises()

    expect(mockGetAudiencePoints).toHaveBeenCalledWith(AUDIENCE_ID)
    const map = wrapper.findComponent({ name: 'AudienceMapPreview' })
    expect(map.props('points')).toEqual([
      { lat: 44.8547, lng: -93.5312, label: '55317 — 12 addresses' },
      { lat: 32.9483, lng: -96.8397, label: '75001 — 1 address' },
    ])
    expect(wrapper.find('[data-testid="unmatched-zips-note"]').exists()).toBe(false)
  })

  it('shows an unmatched-ZIPs note when the server reports some', async () => {
    mockGetAudiencePoints.mockResolvedValue({
      points: [{ zip: '55317', lat: 44.8547, lng: -93.5312, count: 12 }],
      total_zips: 3,
      unmatched_zips: 2,
    })

    const wrapper = mountCsv()
    await flushPromises()

    const note = wrapper.find('[data-testid="unmatched-zips-note"]')
    expect(note.exists()).toBe(true)
    expect(note.text()).toContain('2 ZIPs')
  })

  it('soft-fails when the points fetch errors — map stays empty, rest of flow proceeds', async () => {
    mockGetAudiencePoints.mockRejectedValue(new Error('points endpoint down'))

    const wrapper = mountCsv()
    await flushPromises()

    const map = wrapper.findComponent({ name: 'AudienceMapPreview' })
    expect(map.props('points')).toEqual([])
    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="approve-btn"]').attributes('disabled')).toBeUndefined()
  })

  it('reuses the same fetched points after suppression without re-fetching', async () => {
    mockGetAudiencePoints.mockResolvedValue({
      points: [{ zip: '55317', lat: 44.8547, lng: -93.5312, count: 12 }],
      total_zips: 1,
      unmatched_zips: 0,
    })

    const wrapper = mountCsv()
    await flushPromises()

    expect(mockGetAudiencePoints).toHaveBeenCalledOnce()
    const map = wrapper.findComponent({ name: 'AudienceMapPreview' })
    expect(map.props('points')).toHaveLength(1)
  })

  it('passes enrich_enabled=false from costPreview to EnrichCostBlock (Phase 1 wiring)', async () => {
    const wrapper = mountCsv()
    await flushPromises()

    // EnrichCostBlock is mocked — verify parent passes the full costPreview (enrich_enabled=false inside)
    const block = wrapper.findComponent({ name: 'EnrichCostBlock' })
    expect(block.props('costPreview')).toMatchObject({ enrich_enabled: false })
  })
})
