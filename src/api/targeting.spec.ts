import { beforeEach, describe, expect, it, vi } from 'vitest'
import { get, postJson } from '@/api/http'
import { getHouseholdCount, getTargetingCapabilities } from './targeting'

vi.mock('@/api/http', () => ({
  get: vi.fn(),
  postJson: vi.fn(),
}))

const DATA_RETRIEVER_CAPABILITIES = {
  provider: 'data_retriever',
  geographyTypes: ['zip', 'circle', 'job_radius', 'polygon', 'rectangle'],
  filters: {
    homeowner: false,
    homeValueMin: false,
    homeValueMax: false,
    yearBuiltMin: false,
    yearBuiltMax: false,
    propertyTypes: false,
    hhageMin: true,
    hhageMax: true,
    incomeMin: false,
    loresMin: false,
    loresMax: false,
  },
} as const

const LEADGEN_CAPABILITIES = {
  provider: 'leadgen',
  geographyTypes: ['zip', 'circle', 'job_radius', 'polygon', 'rectangle'],
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
} as const

describe('targeting API contracts', () => {
  beforeEach(() => {
    vi.mocked(get).mockReset()
    vi.mocked(postJson).mockReset()
  })

  it('loads the exact Data Retriever capabilities contract', async () => {
    vi.mocked(get).mockResolvedValue(DATA_RETRIEVER_CAPABILITIES)
    const signal = new AbortController().signal

    await expect(getTargetingCapabilities(signal)).resolves.toEqual(DATA_RETRIEVER_CAPABILITIES)
    expect(get).toHaveBeenCalledWith('/api/targeting/capabilities', { signal })
  })

  it('accepts the LeadGen capabilities contract', async () => {
    vi.mocked(get).mockResolvedValue(LEADGEN_CAPABILITIES)

    await expect(getTargetingCapabilities()).resolves.toEqual(LEADGEN_CAPABILITIES)
    expect(get).toHaveBeenCalledWith('/api/targeting/capabilities', undefined)
  })

  it('rejects a response that does not include every individual filter flag', async () => {
    vi.mocked(get).mockResolvedValue({
      ...LEADGEN_CAPABILITIES,
      filters: { homeowner: true },
    })

    await expect(getTargetingCapabilities()).rejects.toThrow(
      'Invalid targeting capabilities response',
    )
  })

  it('accepts the staging Data Retriever count source', async () => {
    vi.mocked(postJson).mockResolvedValue({
      ok: true,
      filteredCount: 10,
      exclusions: { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 },
      finalCount: 10,
      source: 'melissa_data_retriever',
    })

    await expect(
      getHouseholdCount([
        { type: 'zip', coordinates: [], zipCode: '92688' },
      ], {
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
      }),
    ).resolves.toMatchObject({ source: 'melissa_data_retriever' })
  })
})
