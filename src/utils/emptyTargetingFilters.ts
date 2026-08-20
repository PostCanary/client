import type { TargetingFilters } from '@/types/campaign'

const EMPTY_TARGETING_FILTERS: TargetingFilters = {
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

/** Fresh copy so array fields are never shared (in-place toggles mutate arrays). */
export function emptyTargetingFilters(): TargetingFilters {
  return {
    ...EMPTY_TARGETING_FILTERS,
    propertyTypes: [],
    businessSicCodes: [],
    businessNaicsCodes: [],
    businessJobTitles: [],
    businessManagementLevels: [],
  }
}
