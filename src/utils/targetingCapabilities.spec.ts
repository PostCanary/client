import { describe, expect, it } from 'vitest'
import type { TargetingFilters } from '@/types/campaign'
import type { TargetingFilterSupport } from '@/types/targeting'
import {
  normalizeTargetingFilters,
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
