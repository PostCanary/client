import { describe, expect, it } from 'vitest'
import type { TargetingArea, TargetingFilters } from '@/types/campaign'
import type {
  AudienceQueryPlan,
  BusinessTargetingFilterSupport,
  TargetingFilterSupport,
} from '@/types/targeting'
import {
  businessTargetingFiltersAreSupported,
  normalizeBusinessTargetingFilters,
  normalizeTargetingFilters,
  queryPlanMatchesTargetingState,
  assignTargetingAreasIfChanged,
  targetingAreasAreEqual,
  targetingCountQueryKey,
  targetingFiltersAreSupported,
  unsupportedTargetingFilterLabels,
} from './targetingCapabilities'

const DATA_RETRIEVER_FILTERS: TargetingFilterSupport = {
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
  squareFootageMin: false,
  squareFootageMax: false,
  hasEmail: false,
}

const LEADGEN_FILTERS: TargetingFilterSupport = {
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
  squareFootageMin: true,
  squareFootageMax: true,
  hasEmail: true,
}

const HVAC_FILTERS: TargetingFilters = {
  homeowner: 'homeowner',
  homeValueMin: 150000,
  homeValueMax: 800000,
  yearBuiltMin: null,
  yearBuiltMax: 2010,
  propertyTypes: ['Single Family'],
  hhageMin: 3,
  hhageMax: 6,
  incomeMin: 'C',
  loresMin: 2,
  loresMax: 10,
  squareFootageMin: null,
  squareFootageMax: null,
  hasEmail: null,
}

describe('targeting capability filter normalization', () => {
  it('clears unsupported Data Retriever filters and preserves household age', () => {
    const normalized = normalizeTargetingFilters(HVAC_FILTERS, DATA_RETRIEVER_FILTERS)

    expect(normalized).toEqual({
      homeowner: null,
      homeValueMin: null,
      homeValueMax: null,
      yearBuiltMin: null,
      yearBuiltMax: null,
      propertyTypes: [],
      hhageMin: 3,
      hhageMax: 6,
      incomeMin: null,
      loresMin: null,
      loresMax: null,
      squareFootageMin: null,
      squareFootageMax: null,
      hasEmail: null,
    })
    expect(HVAC_FILTERS.homeowner).toBe('homeowner')
    expect(targetingFiltersAreSupported(normalized, DATA_RETRIEVER_FILTERS)).toBe(true)
    expect(unsupportedTargetingFilterLabels(DATA_RETRIEVER_FILTERS)).toEqual([
      'homeowner status',
      'home value',
      'year built',
      'property type',
      'household income',
      'length of residence',
      'home square footage',
      'email availability',
    ])
  })

  it('does not alter LeadGen filters when every capability is supported', () => {
    const normalized = normalizeTargetingFilters(HVAC_FILTERS, LEADGEN_FILTERS)

    expect(normalized).toEqual(HVAC_FILTERS)
    expect(normalized.propertyTypes).not.toBe(HVAC_FILTERS.propertyTypes)
    expect(targetingFiltersAreSupported(normalized, LEADGEN_FILTERS)).toBe(true)
    expect(unsupportedTargetingFilterLabels(LEADGEN_FILTERS)).toEqual([])
  })
})

const BUSINESS_SUPPORT: BusinessTargetingFilterSupport = {
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

describe('Business targeting capability normalization', () => {
  it('clears every unsupported value from a resumed Business draft', () => {
    const filters: TargetingFilters = {
      ...HVAC_FILTERS,
      businessSicCodes: ['171102'],
      businessNaicsCodes: ['238220'],
      businessJobTitles: ['Owner'],
      businessManagementLevels: ['C-Level'],
      businessEmployeeMin: 5,
      businessEmployeeMax: 50,
      businessSalesMin: 100000,
      businessSalesMax: 500000,
      businessHasEmail: true,
      businessWorkAtHome: false,
    }
    const support = Object.fromEntries(
      Object.keys(BUSINESS_SUPPORT).map((key) => [key, false]),
    ) as unknown as BusinessTargetingFilterSupport

    const normalized = normalizeBusinessTargetingFilters(filters, support)

    expect(normalized).toMatchObject({
      businessSicCodes: [],
      businessNaicsCodes: [],
      businessJobTitles: [],
      businessManagementLevels: [],
      businessEmployeeMin: null,
      businessEmployeeMax: null,
      businessSalesMin: null,
      businessSalesMax: null,
      businessHasEmail: null,
      businessWorkAtHome: null,
    })
    expect(businessTargetingFiltersAreSupported(normalized, support)).toBe(true)
    expect(businessTargetingFiltersAreSupported(filters, support)).toBe(false)
  })
})

describe('attested targeting plan matching', () => {
  const area: TargetingArea = { type: 'zip', coordinates: [], zipCode: '10001' }
  const filters: TargetingFilters = {
    ...HVAC_FILTERS,
    propertyTypes: [...HVAC_FILTERS.propertyTypes],
  }
  const exclusions = { pastCustomers: 1, recentlyMailed: 2, doNotMail: 3 }
  const plan: AudienceQueryPlan = {
    schemaVersion: 1,
    audienceType: 'consumer',
    provider: 'melissa',
    product: 'leadgen_property',
    areas: [area],
    filters: {
      homeowner: 'homeowner',
      homeValueMin: 150000,
      homeValueMax: 800000,
      yearBuiltMax: 2010,
      propertyTypes: ['Single Family'],
      hhageMin: 3,
      hhageMax: 6,
      incomeMin: 'C',
      loresMin: 2,
      loresMax: 10,
    },
    suppressionPolicy: {
      excludePastCustomers: true,
      excludeMailedWithinDays: 60,
    },
    requests: [],
    outputColumns: [],
    fingerprint: 'a'.repeat(64),
    countProof: {
      filteredCount: 15,
      finalCount: 9,
      exclusions,
      source: 'melissa',
    },
    attestation: 'b'.repeat(64),
  }
  const state = {
    audienceType: 'consumer' as const,
    areas: [area],
    filters,
    suppressionPolicy: {
      excludePastCustomers: true,
      excludeMailedWithinDays: null,
    },
    finalCount: 9,
    exclusions,
    source: 'melissa' as const,
  }

  it('accepts only the live attested plan for the exact visible state', () => {
    expect(queryPlanMatchesTargetingState(plan, state)).toBe(true)
    expect(queryPlanMatchesTargetingState(null, state)).toBe(false)
    expect(queryPlanMatchesTargetingState(plan, { ...state, source: 'mock' })).toBe(false)
  })

  it('invalidates a prior plan after a filter or audience-type change', () => {
    expect(queryPlanMatchesTargetingState(plan, {
      ...state,
      filters: { ...filters, homeValueMin: 200000 },
    })).toBe(false)
    expect(queryPlanMatchesTargetingState(plan, {
      ...state,
      audienceType: 'business',
    })).toBe(false)
  })
})

describe('targeting count query identity (POS-269)', () => {
  const area: TargetingArea = { type: 'zip', coordinates: [], zipCode: '10001' }
  const filters: TargetingFilters = {
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
    squareFootageMin: null,
    squareFootageMax: null,
    hasEmail: null,
    businessSicCodes: [],
    businessNaicsCodes: [],
    businessJobTitles: [],
    businessManagementLevels: [],
    businessEmployeeMin: null,
    businessEmployeeMax: null,
    businessSalesMin: null,
    businessSalesMax: null,
    businessHasEmail: null,
    businessWorkAtHome: null,
  }
  const query = {
    audienceType: 'consumer' as const,
    areas: [area],
    filters,
    suppressionPolicy: {
      excludePastCustomers: true,
      excludeMailedWithinDays: 30,
    },
  }

  it('treats a cloned area list as the same count query', () => {
    const cloned = {
      ...query,
      areas: [{ ...area, coordinates: [...area.coordinates] }],
      filters: { ...filters, propertyTypes: [...filters.propertyTypes] },
    }
    expect(targetingCountQueryKey(cloned)).toBe(targetingCountQueryKey(query))
    expect(targetingAreasAreEqual(cloned.areas, query.areas)).toBe(true)
  })

  it('treats a real area or filter change as a new count query', () => {
    expect(targetingCountQueryKey({
      ...query,
      areas: [{ type: 'zip', coordinates: [], zipCode: '10002' }],
    })).not.toBe(targetingCountQueryKey(query))
    expect(targetingCountQueryKey({
      ...query,
      filters: { ...filters, homeValueMin: 200000 },
    })).not.toBe(targetingCountQueryKey(query))
    expect(targetingAreasAreEqual(
      [{ type: 'zip', coordinates: [], zipCode: '10002' }],
      query.areas,
    )).toBe(false)
  })

  it('matches the server normalize_suppression_policy and _active snapshots', () => {
    // server/app/services/audience_query_plan.py
    // normalize_suppression_policy (~267): null days → 60
    // _active (~114): homeowner "all" is not an active filter (same as null)
    expect(targetingCountQueryKey({
      ...query,
      suppressionPolicy: {
        excludePastCustomers: true,
        excludeMailedWithinDays: null,
      },
    })).toBe(targetingCountQueryKey({
      ...query,
      suppressionPolicy: {
        excludePastCustomers: true,
        excludeMailedWithinDays: 60,
      },
    }))
    expect(targetingCountQueryKey({
      ...query,
      filters: { ...filters, homeowner: 'all' },
    })).toBe(targetingCountQueryKey({
      ...query,
      filters: { ...filters, homeowner: null },
    }))
    expect(targetingCountQueryKey({
      ...query,
      audienceType: 'business',
    })).not.toBe(targetingCountQueryKey(query))
    expect(targetingCountQueryKey({
      ...query,
      suppressionPolicy: {
        ...query.suppressionPolicy,
        excludePastCustomers: false,
      },
    })).not.toBe(targetingCountQueryKey(query))
  })

  it('POS-269 useTargetingMap guard: same geometry does not replace the array', () => {
    const current = [{ type: 'zip' as const, coordinates: [], zipCode: '10001' }]
    const same = [{ type: 'zip' as const, coordinates: [], zipCode: '10001' }]
    expect(assignTargetingAreasIfChanged(current, same)).toBeNull()
    const changed = [{ type: 'zip' as const, coordinates: [], zipCode: '10002' }]
    expect(assignTargetingAreasIfChanged(current, changed)).toEqual(changed)
    expect(assignTargetingAreasIfChanged(current, [])).toEqual([])
  })
})
