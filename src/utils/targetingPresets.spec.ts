import { describe, expect, it } from 'vitest'
import type { TargetingFilters } from '@/types/campaign'
import type { TargetingFilterSupport } from '@/types/targeting'
import {
  HOME_SERVICES_PRESET,
  applyHomeServicesPreset,
  applyIndustryFilterPreset,
  industryFilterPresetAvailable,
  industryFilterPresetChipLabel,
  resolveIndustryFilterPreset,
} from './targetingPresets'

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
}

describe('resolveIndustryFilterPreset (POS-293)', () => {
  it('falls back to home services for missing / other / unknown', () => {
    expect(resolveIndustryFilterPreset(null).id).toBe('home_services')
    expect(resolveIndustryFilterPreset('other').id).toBe('home_services')
    expect(resolveIndustryFilterPreset('not-a-real-industry').id).toBe('home_services')
  })

  it('uses the home_services group pack for HVAC', () => {
    const preset = resolveIndustryFilterPreset('hvac')
    expect(preset.id).toBe('home_services')
    expect(preset.filters).toMatchObject(HOME_SERVICES_PRESET)
    expect(industryFilterPresetChipLabel(preset)).toBe(
      'Suggested filters for home services',
    )
  })

  it('uses group packs for health / food / auto / professional / property / local_other', () => {
    expect(resolveIndustryFilterPreset('dental').id).toBe('health')
    expect(resolveIndustryFilterPreset('dental').filters.kidsMin).toBe(1)
    expect(resolveIndustryFilterPreset('restaurant').id).toBe('food')
    expect(resolveIndustryFilterPreset('restaurant').filters.kidsMin).toBe(1)
    expect(resolveIndustryFilterPreset('auto_repair').id).toBe('auto')
    expect(resolveIndustryFilterPreset('legal').id).toBe('professional')
    expect(resolveIndustryFilterPreset('legal').filters.incomeMin).toBe('E')
    expect(resolveIndustryFilterPreset('mortgage').id).toBe('property')
    expect(resolveIndustryFilterPreset('mortgage').filters.loresMax).toBe(3)
    expect(resolveIndustryFilterPreset('childcare').id).toBe('local_other')
    expect(resolveIndustryFilterPreset('childcare').filters.kidsMin).toBe(1)
  })

  it('maps every slug in a group to the same pack (no per-slug overrides)', () => {
    expect(resolveIndustryFilterPreset('solar').id).toBe('home_services')
    expect(resolveIndustryFilterPreset('hvac').id).toBe('home_services')
    expect(resolveIndustryFilterPreset('veterinary').id).toBe('health')
    expect(resolveIndustryFilterPreset('dental').id).toBe('health')
    // LeadGen-only for now — no pet Ind keys in any pack.
    expect(resolveIndustryFilterPreset('veterinary').filters).not.toHaveProperty('dogOwner')
  })
})

describe('applyIndustryFilterPreset', () => {
  it('merges without clearing unrelated user fields', () => {
    const result = applyIndustryFilterPreset(
      { ...EMPTY, incomeMin: 'C', yearBuiltMin: 1980 },
      'hvac',
      FULL_SUPPORT,
    )
    expect(result.incomeMin).toBe('C')
    expect(result.yearBuiltMin).toBe(1980)
    expect(result.yearBuiltMax).toBe(2010)
    expect(result.homeowner).toBe('homeowner')
  })

  it('skips unsupported capability keys', () => {
    const result = applyIndustryFilterPreset(
      EMPTY,
      'legal',
      { ...FULL_SUPPORT, incomeMin: false },
    )
    expect(result.homeowner).toBe('homeowner')
    expect(result.incomeMin).toBeNull()
    expect(result.homeValueMin).toBe(250000)
  })

  it('skips keys absent from the capability map (fail closed)', () => {
    const { kidsMin: _k, kidsMax: _m, ...withoutKids } = FULL_SUPPORT
    const result = applyIndustryFilterPreset(
      EMPTY,
      'dental',
      withoutKids as typeof FULL_SUPPORT,
    )
    expect(result.homeowner).toBe('homeowner')
    expect(result.kidsMin).toBeNull()
  })

  it('returns a fresh propertyTypes array', () => {
    const a = applyIndustryFilterPreset(EMPTY, 'dental', FULL_SUPPORT)
    const b = applyIndustryFilterPreset(EMPTY, 'dental', FULL_SUPPORT)
    expect(a.propertyTypes).not.toBe(b.propertyTypes)
  })
})

describe('industryFilterPresetAvailable', () => {
  it('fails closed without capabilities', () => {
    expect(industryFilterPresetAvailable(null)).toBe(false)
  })

  it('requires property LeadGen keys', () => {
    expect(
      industryFilterPresetAvailable({
        ...FULL_SUPPORT,
        homeValueMin: false,
      }),
    ).toBe(false)
    expect(industryFilterPresetAvailable(FULL_SUPPORT)).toBe(true)
  })
})

describe('applyHomeServicesPreset compat', () => {
  it('still applies the HVAC / home-services stack', () => {
    const result = applyHomeServicesPreset({ ...EMPTY, incomeMin: 'C' })
    expect(result.homeValueMin).toBe(HOME_SERVICES_PRESET.homeValueMin)
    expect(result.propertyTypes).toEqual(['Single Family'])
    expect(result.incomeMin).toBe('C')
  })
})
