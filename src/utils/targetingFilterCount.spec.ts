import { describe, expect, it } from 'vitest'
import type { TargetingFilters } from '@/types/campaign'
import type { TargetingFilterSupport } from '@/types/targeting'
import { countActiveBusinessFilters, countActiveConsumerFilters } from './targetingFilterCount'
import { HOME_SERVICES_PRESET, applyHomeServicesPreset } from './targetingPresets'

const EMPTY: TargetingFilters = {
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

const FULL_SUPPORT: TargetingFilterSupport = {
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

describe('countActiveConsumerFilters', () => {
  it('returns 0 for empty filters', () => {
    expect(countActiveConsumerFilters(EMPTY, FULL_SUPPORT)).toBe(0)
  })

  it('returns 0 with null capabilities regardless of values', () => {
    expect(
      countActiveConsumerFilters({ ...EMPTY, homeValueMin: 150000 }, null),
    ).toBe(0)
  })

  it('groups min/max pairs as one filter', () => {
    expect(
      countActiveConsumerFilters(
        { ...EMPTY, homeValueMin: 150000, homeValueMax: 800000 },
        FULL_SUPPORT,
      ),
    ).toBe(1)
  })

  it('ignores values the provider does not support', () => {
    expect(
      countActiveConsumerFilters(
        { ...EMPTY, homeValueMin: 150000, hhageMin: 2 },
        { ...FULL_SUPPORT, homeValueMin: false, homeValueMax: false },
      ),
    ).toBe(1)
  })

  it('counts the home-services preset as 4 (POS-213 disclosure parity)', () => {
    expect(
      countActiveConsumerFilters(applyHomeServicesPreset(EMPTY), FULL_SUPPORT),
    ).toBe(4)
  })
})

describe('countActiveBusinessFilters', () => {
  it('returns 0 for empty filters', () => {
    expect(countActiveBusinessFilters(EMPTY)).toBe(0)
  })

  it('counts list and range groups once each', () => {
    expect(
      countActiveBusinessFilters({
        ...EMPTY,
        businessSicCodes: ['1731'],
        businessEmployeeMin: 5,
        businessEmployeeMax: 50,
        businessWorkAtHome: false,
      }),
    ).toBe(3)
  })
})

describe('applyHomeServicesPreset', () => {
  it('sets exactly the preset keys and preserves others', () => {
    const result = applyHomeServicesPreset({ ...EMPTY, incomeMin: 'C' })
    expect(result.homeowner).toBe('homeowner')
    expect(result.homeValueMin).toBe(HOME_SERVICES_PRESET.homeValueMin)
    expect(result.homeValueMax).toBe(HOME_SERVICES_PRESET.homeValueMax)
    expect(result.yearBuiltMax).toBe(2010)
    expect(result.propertyTypes).toEqual(['Single Family'])
    expect(result.incomeMin).toBe('C')
  })

  it('returns a fresh propertyTypes array (no shared reference)', () => {
    const a = applyHomeServicesPreset(EMPTY)
    const b = applyHomeServicesPreset(EMPTY)
    expect(a.propertyTypes).not.toBe(b.propertyTypes)
    expect(a.propertyTypes).not.toBe(HOME_SERVICES_PRESET.propertyTypes)
  })
})

describe('applyHomeServicesPreset preserves user values (Grok review P3)', () => {
  it('does not clear a user-set year-built minimum', () => {
    const result = applyHomeServicesPreset({ ...EMPTY, yearBuiltMin: 1980 })
    expect(result.yearBuiltMin).toBe(1980)
    expect(result.yearBuiltMax).toBe(2010)
  })
})
