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
})
