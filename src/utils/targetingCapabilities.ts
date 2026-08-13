import type { TargetingFilters } from '@/types/campaign'
import type { TargetingFilterKey, TargetingFilterSupport } from '@/types/targeting'

export const TARGETING_FILTER_LABELS: Record<TargetingFilterKey, string> = {
  homeowner: 'homeowner status',
  homeValueMin: 'home value',
  homeValueMax: 'home value',
  yearBuiltMin: 'year built',
  yearBuiltMax: 'year built',
  propertyTypes: 'property type',
  hhageMin: 'household age',
  hhageMax: 'household age',
  incomeMin: 'household income',
  loresMin: 'length of residence',
  loresMax: 'length of residence',
}

export function normalizeTargetingFilters(
  filters: TargetingFilters,
  support: TargetingFilterSupport,
): TargetingFilters {
  return {
    ...filters,
    homeowner: support.homeowner ? filters.homeowner : null,
    propertyTypes: support.propertyTypes
      ? [...(Array.isArray(filters.propertyTypes) ? filters.propertyTypes : [])]
      : [],
    homeValueMin: support.homeValueMin ? filters.homeValueMin : null,
    homeValueMax: support.homeValueMax ? filters.homeValueMax : null,
    yearBuiltMin: support.yearBuiltMin ? filters.yearBuiltMin : null,
    yearBuiltMax: support.yearBuiltMax ? filters.yearBuiltMax : null,
    hhageMin: support.hhageMin ? filters.hhageMin : null,
    hhageMax: support.hhageMax ? filters.hhageMax : null,
    incomeMin: support.incomeMin ? filters.incomeMin : null,
    loresMin: support.loresMin ? filters.loresMin : null,
    loresMax: support.loresMax ? filters.loresMax : null,
  }
}

export function targetingFiltersAreSupported(
  filters: TargetingFilters,
  support: TargetingFilterSupport,
): boolean {
  const propertyTypes = Array.isArray(filters.propertyTypes) ? filters.propertyTypes : []
  return (
    (support.homeowner || filters.homeowner === null) &&
    (support.propertyTypes || propertyTypes.length === 0) &&
    (support.homeValueMin || filters.homeValueMin === null) &&
    (support.homeValueMax || filters.homeValueMax === null) &&
    (support.yearBuiltMin || filters.yearBuiltMin === null) &&
    (support.yearBuiltMax || filters.yearBuiltMax === null) &&
    (support.hhageMin || filters.hhageMin === null) &&
    (support.hhageMax || filters.hhageMax === null) &&
    (support.incomeMin || filters.incomeMin === null) &&
    (support.loresMin || filters.loresMin === null) &&
    (support.loresMax || filters.loresMax === null)
  )
}

export function unsupportedTargetingFilterLabels(
  support: TargetingFilterSupport,
): string[] {
  return [...new Set((Object.keys(TARGETING_FILTER_LABELS) as TargetingFilterKey[])
    .filter((key) => !support[key])
    .map((key) => TARGETING_FILTER_LABELS[key]))]
}
