// @ts-nocheck
// Vitest unit test for SttLStep2Route.vue — post-approval navigation (POS-137).
// Run: npx vitest run src/pages/SttLStep2Route.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const pushMock = vi.fn()
const backMock = vi.fn()
const routeState: { params: Record<string, string>; query: Record<string, string> } = {
  params: { draftId: 'draft-1' },
  query: {},
}

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({ push: (...args: unknown[]) => pushMock(...args), back: (...args: unknown[]) => backMock(...args) }),
}))

// Stub the orchestrator child — this spec only exercises the route's
// reaction to the 'approved' event, not the upload/suppress/cost flow
// (that's covered by SttLStep2.spec.ts).
vi.mock('@/components/wizard/strategies/SttLStep2.vue', () => ({
  default: {
    name: 'SttLStep2',
    props: ['audienceSource', 'file', 'existingAudienceId', 'campaignId'],
    emits: ['state-change', 'approved', 'back'],
    template: '<div data-testid="sttl-step2-stub" />',
  },
}))

const loadDraftMock = vi.fn()
const saveDraftMock = vi.fn().mockResolvedValue(undefined)
vi.mock('@/api/campaignDrafts', () => ({
  loadDraft: (...args: unknown[]) => loadDraftMock(...args),
  saveDraft: (...args: unknown[]) => saveDraftMock(...args),
  createDraft: vi.fn(),
  deleteDraft: vi.fn(),
}))

import SttLStep2Route from './SttLStep2Route.vue'
import { useCampaignDraftStore } from '@/stores/useCampaignDraftStore'

function makeDraft(overrides: Record<string, any> = {}) {
  return {
    id: 'draft-1',
    orgId: 'org-1',
    currentStep: 2,
    completedSteps: [1],
    needsReviewSteps: [],
    campaignType: 'targeted',
    goal: { goalType: 'send_to_list' },
    targeting: null,
    audience: null,
    design: null,
    review: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    schemaVersion: 1,
    ...overrides,
  }
}

function mountRoute() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(SttLStep2Route, { global: { plugins: [pinia] } })
}

describe('SttLStep2Route — post-approval navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.params = { draftId: 'draft-1' }
    // existingAudienceId via query keeps the route past the upload
    // dropzone gate so the SttLStep2 stub renders immediately.
    routeState.query = { audienceId: 'aud-123' }
    loadDraftMock.mockResolvedValue(makeDraft())
  })

  it('resumes the wizard at step 3 after approval (completes step 2, advances currentStep, saves, navigates)', async () => {
    const wrapper = mountRoute()
    await flushPromises()

    const draftStore = useCampaignDraftStore()
    expect(draftStore.draft?.completedSteps).toEqual([1])

    const child = wrapper.findComponent({ name: 'SttLStep2' })
    child.vm.$emit('approved', 'aud-123', 'draft-1')
    await flushPromises()

    expect(draftStore.draft?.completedSteps).toEqual([1, 2])
    expect(draftStore.currentStep).toBe(3)
    expect(saveDraftMock).toHaveBeenCalled()
    const lastSavedDraft = saveDraftMock.mock.calls.at(-1)![0]
    expect(lastSavedDraft.currentStep).toBe(3)
    expect(pushMock).toHaveBeenCalledWith('/app/send/draft-1')
  })

  it('persists the advanced step before navigating (save resolves prior to router.push)', async () => {
    let resolveSave: () => void
    saveDraftMock.mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveSave = resolve }),
    )

    const wrapper = mountRoute()
    await flushPromises()

    const child = wrapper.findComponent({ name: 'SttLStep2' })
    child.vm.$emit('approved', 'aud-123', 'draft-1')
    await flushPromises()

    // Save is still pending — navigation must not have happened yet.
    expect(pushMock).not.toHaveBeenCalled()

    resolveSave!()
    await flushPromises()

    expect(pushMock).toHaveBeenCalledWith('/app/send/draft-1')
  })

  it('shows the approved banner immediately (before the save/navigate settles)', async () => {
    saveDraftMock.mockImplementationOnce(() => new Promise(() => {})) // never resolves

    const wrapper = mountRoute()
    await flushPromises()

    const child = wrapper.findComponent({ name: 'SttLStep2' })
    child.vm.$emit('approved', 'aud-123', 'draft-1')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="sttl-approved-banner"]').exists()).toBe(true)
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('accepts a CSV dropped on the upload zone instead of letting the browser open it', async () => {
    routeState.params = {}
    routeState.query = {}
    loadDraftMock.mockResolvedValue(makeDraft())
    const wrapper = mountRoute()
    await flushPromises()

    const csv = new File(
      ['first_name,last_name,address,city,state,zip\nAda,Lovelace,1 Main St,Buffalo,NY,14201'],
      'audience.csv',
      { type: 'text/csv' },
    )
    await wrapper.find('[data-testid="sttl-upload-dropzone"]').trigger('drop', {
      dataTransfer: { files: [csv] },
    })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'SttLStep2' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SttLStep2' }).props('file')).toMatchObject({
      name: 'audience.csv',
      type: 'text/csv',
    })
    expect(wrapper.find('[data-testid="sttl-file-error"]').exists()).toBe(false)
  })

  it('Back from the upload dropzone returns to Choose Your Goal, not history.back', async () => {
    routeState.params = { draftId: 'draft-1' }
    routeState.query = {}
    loadDraftMock.mockResolvedValue(makeDraft())
    const wrapper = mountRoute()
    await flushPromises()

    const draftStore = useCampaignDraftStore()
    expect(draftStore.currentStep).toBe(2)

    await wrapper.get('[data-testid="sttl-back-btn"]').trigger('click')
    await flushPromises()

    expect(draftStore.currentStep).toBe(1)
    expect(draftStore.draft?.goal?.goalType).toBe('send_to_list')
    expect(backMock).not.toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/app/send/draft-1')
    expect(saveDraftMock).toHaveBeenCalled()
    const saved = saveDraftMock.mock.calls.at(-1)![0]
    expect(saved.currentStep).toBe(1)
  })

  it('Back from the review child returns to Choose Your Goal', async () => {
    const wrapper = mountRoute()
    await flushPromises()

    const child = wrapper.findComponent({ name: 'SttLStep2' })
    child.vm.$emit('back')
    await flushPromises()

    const draftStore = useCampaignDraftStore()
    expect(draftStore.currentStep).toBe(1)
    expect(backMock).not.toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/app/send/draft-1')
  })

  it('rejects a non-CSV dropped on the upload zone', async () => {
    routeState.params = {}
    routeState.query = {}
    loadDraftMock.mockResolvedValue(makeDraft())
    const wrapper = mountRoute()
    await flushPromises()

    const image = new File(['not a csv'], 'artwork.png', { type: 'image/png' })
    await wrapper.find('[data-testid="sttl-upload-dropzone"]').trigger('drop', {
      dataTransfer: { files: [image] },
    })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'SttLStep2' }).exists()).toBe(false)
    expect(wrapper.get('[data-testid="sttl-file-error"]').text()).toBe('Choose a CSV file.')
  })
})
