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
    kidsMin: false,
    kidsMax: false,
    squareFootageMin: false,
    squareFootageMax: false,
    hasEmail: false,
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
    kidsMin: true,
    kidsMax: true,
    squareFootageMin: false,
    squareFootageMax: false,
    hasEmail: false,
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

  it('threads purchase_records_max_qty from the capabilities response', async () => {
    const purchaseRecordsMaxQty = 17
    vi.mocked(get).mockResolvedValue({
      ...DATA_RETRIEVER_CAPABILITIES,
      purchase_records_max_qty: purchaseRecordsMaxQty,
    })

    await expect(getTargetingCapabilities()).resolves.toMatchObject({
      purchase_records_max_qty: purchaseRecordsMaxQty,
    })
  })

  it('omits a non-integer purchase_records_max_qty rather than inventing a cap', async () => {
    vi.mocked(get).mockResolvedValue({
      ...DATA_RETRIEVER_CAPABILITIES,
      purchase_records_max_qty: 'unlimited',
    })

    const result = await getTargetingCapabilities()
    expect(result.purchase_records_max_qty).toBeUndefined()
  })

  it('accepts product-specific Business planner capabilities', async () => {
    const businessFilters = {
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
    const response = {
      ...LEADGEN_CAPABILITIES,
      provider: 'planner',
      strategy: 'per_campaign',
      schemaVersion: 1,
      audienceFilters: {
        consumer: LEADGEN_CAPABILITIES.filters,
        business: businessFilters,
      },
      filterCapabilities: Object.fromEntries(
        Object.keys(LEADGEN_CAPABILITIES.filters).map((key) => [
          key,
          { mode: 'target', products: ['leadgen_property'] },
        ]),
      ),
      products: [{
        id: 'data_retriever_business',
        audienceType: 'business',
        enabled: true,
        implemented: true,
      }],
    }
    vi.mocked(get).mockResolvedValue(response)

    await expect(getTargetingCapabilities()).resolves.toMatchObject({
      audienceFilters: { business: businessFilters },
    })
  })

  it('fails closed when a planner response omits its product registry', async () => {
    vi.mocked(get).mockResolvedValue({
      ...LEADGEN_CAPABILITIES,
      provider: 'planner',
      strategy: 'per_campaign',
      schemaVersion: 1,
      audienceFilters: {
        consumer: LEADGEN_CAPABILITIES.filters,
        business: {},
      },
      filterCapabilities: {},
    })

    await expect(getTargetingCapabilities()).rejects.toThrow(
      'Invalid targeting capabilities response',
    )
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
        kidsMin: null,
        kidsMax: null,
      }),
    ).resolves.toMatchObject({ source: 'melissa_data_retriever' })
  })

  it('sends business audience type to the count endpoint', async () => {
    vi.mocked(postJson).mockResolvedValue({
      ok: true,
      filteredCount: 3,
      exclusions: { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 },
      finalCount: 3,
      source: 'melissa_data_retriever',
    })
    const filters = {
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
      kidsMin: null,
      kidsMax: null,
      businessSicCodes: ['171102'],
    }

    await getHouseholdCount(
      [{ type: 'zip', coordinates: [], zipCode: '92688' }],
      filters,
      undefined,
      false,
      undefined,
      'business',
    )

    expect(postJson).toHaveBeenCalledWith(
      '/api/targeting/count',
      expect.objectContaining({ audienceType: 'business', filters }),
      undefined,
    )
  })
})
