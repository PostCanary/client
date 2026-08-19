import type { TargetingArea, TargetingFilters } from '@/types/campaign'
import type {
  AudienceQueryPlan,
  AudienceSuppressionPolicy,
  BusinessTargetingFilterSupport,
  TargetingCountSource,
  TargetingFilterKey,
  TargetingFilterSupport,
} from '@/types/targeting'

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
  kidsMin: 'children in household',
  kidsMax: 'children in household',
  squareFootageMin: 'home square footage',
  squareFootageMax: 'home square footage',
  hasEmail: 'email availability',
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
    kidsMin: support.kidsMin ? filters.kidsMin : null,
    kidsMax: support.kidsMax ? filters.kidsMax : null,
    squareFootageMin: support.squareFootageMin ? (filters.squareFootageMin ?? null) : null,
    squareFootageMax: support.squareFootageMax ? (filters.squareFootageMax ?? null) : null,
    hasEmail: support.hasEmail ? (filters.hasEmail ?? null) : null,
  }
}

export function normalizeBusinessTargetingFilters(
  filters: TargetingFilters,
  support: BusinessTargetingFilterSupport,
): TargetingFilters {
  return {
    ...filters,
    businessSicCodes: support.businessSicCodes ? [...(filters.businessSicCodes ?? [])] : [],
    businessNaicsCodes: support.businessNaicsCodes ? [...(filters.businessNaicsCodes ?? [])] : [],
    businessJobTitles: support.businessJobTitles ? [...(filters.businessJobTitles ?? [])] : [],
    businessManagementLevels: support.businessManagementLevels
      ? [...(filters.businessManagementLevels ?? [])]
      : [],
    businessEmployeeMin: support.businessEmployeeMin
      ? (filters.businessEmployeeMin ?? null)
      : null,
    businessEmployeeMax: support.businessEmployeeMax
      ? (filters.businessEmployeeMax ?? null)
      : null,
    businessSalesMin: support.businessSalesMin ? (filters.businessSalesMin ?? null) : null,
    businessSalesMax: support.businessSalesMax ? (filters.businessSalesMax ?? null) : null,
    businessHasEmail: support.businessHasEmail ? (filters.businessHasEmail ?? null) : null,
    businessWorkAtHome: support.businessWorkAtHome ? (filters.businessWorkAtHome ?? null) : null,
  }
}

export function businessTargetingFiltersAreSupported(
  filters: TargetingFilters,
  support: BusinessTargetingFilterSupport,
): boolean {
  return (
    (support.businessSicCodes || (filters.businessSicCodes ?? []).length === 0) &&
    (support.businessNaicsCodes || (filters.businessNaicsCodes ?? []).length === 0) &&
    (support.businessJobTitles || (filters.businessJobTitles ?? []).length === 0) &&
    (support.businessManagementLevels || (filters.businessManagementLevels ?? []).length === 0) &&
    (support.businessEmployeeMin || (filters.businessEmployeeMin ?? null) === null) &&
    (support.businessEmployeeMax || (filters.businessEmployeeMax ?? null) === null) &&
    (support.businessSalesMin || (filters.businessSalesMin ?? null) === null) &&
    (support.businessSalesMax || (filters.businessSalesMax ?? null) === null) &&
    (support.businessHasEmail || (filters.businessHasEmail ?? null) === null) &&
    (support.businessWorkAtHome || (filters.businessWorkAtHome ?? null) === null)
  )
}

const CONSUMER_FILTER_KEYS: Array<keyof TargetingFilters> = [
  'homeowner',
  'homeValueMin',
  'homeValueMax',
  'yearBuiltMin',
  'yearBuiltMax',
  'propertyTypes',
  'squareFootageMin',
  'squareFootageMax',
  'hhageMin',
  'hhageMax',
  'incomeMin',
  'loresMin',
  'loresMax',
  'kidsMin',
  'kidsMax',
  'hasEmail',
]

const BUSINESS_FILTER_KEYS: Array<keyof TargetingFilters> = [
  'businessSicCodes',
  'businessNaicsCodes',
  'businessJobTitles',
  'businessManagementLevels',
  'businessEmployeeMin',
  'businessEmployeeMax',
  'businessSalesMin',
  'businessSalesMax',
  'businessHasEmail',
  'businessWorkAtHome',
]

function isActivePlanValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '' && value !== 'all' &&
    (!Array.isArray(value) || value.length > 0)
}

function activeFilterSnapshot(
  filters: TargetingFilters,
  audienceType: 'consumer' | 'business',
): Record<string, unknown> {
  const keys = audienceType === 'business' ? BUSINESS_FILTER_KEYS : CONSUMER_FILTER_KEYS
  return Object.fromEntries(
    keys
      .filter((key) => isActivePlanValue(filters[key]))
      .map((key) => [key, filters[key]]),
  )
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  )
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

export interface TargetingCountQuery {
  audienceType: 'consumer' | 'business'
  areas: TargetingArea[]
  filters: TargetingFilters
  suppressionPolicy: AudienceSuppressionPolicy
}

/**
 * Stable key for the household-count query. A document mouseup or a new
 * array identity with the same geometry must not look like a new query.
 */
export function targetingCountQueryKey(state: TargetingCountQuery): string {
  return canonicalJson({
    audienceType: state.audienceType,
    areas: state.areas,
    filters: activeFilterSnapshot(state.filters, state.audienceType),
    suppressionPolicy: {
      excludePastCustomers: state.suppressionPolicy.excludePastCustomers,
      excludeMailedWithinDays: state.suppressionPolicy.excludeMailedWithinDays ?? 60,
    },
  })
}

export function targetingAreasAreEqual(
  left: TargetingArea[],
  right: TargetingArea[],
): boolean {
  return canonicalJson(left) === canonicalJson(right)
}

/**
 * POS-269: useTargetingMap.syncAreasFromLayers writes only when geometry
 * changed. Return null to keep the current array identity.
 */
export function assignTargetingAreasIfChanged(
  current: TargetingArea[],
  next: TargetingArea[],
): TargetingArea[] | null {
  if (targetingAreasAreEqual(current, next)) return null
  return next
}

const SHA256_HEX = /^[a-f0-9]{64}$/

export interface TargetingPlanState {
  audienceType: 'consumer' | 'business'
  areas: TargetingArea[]
  filters: TargetingFilters
  suppressionPolicy: AudienceSuppressionPolicy
  finalCount: number
  exclusions: {
    pastCustomers: number
    recentlyMailed: number
    doNotMail: number
  }
  source: TargetingCountSource
}

/**
 * Confirm that the server-attested plan belongs to the exact targeting state
 * that is currently visible. The server remains the cryptographic verifier;
 * this client check prevents a prior valid plan from reopening Step 2 after an
 * area, filter, suppression, or audience-type change.
 */
export function queryPlanMatchesTargetingState(
  plan: AudienceQueryPlan | null,
  state: TargetingPlanState,
): boolean {
  if (!plan || !SHA256_HEX.test(plan.fingerprint) || !SHA256_HEX.test(plan.attestation)) return false
  if (plan.provider !== 'melissa' || plan.audienceType !== state.audienceType) return false
  if (!['melissa', 'melissa_data_retriever'].includes(state.source)) return false
  if (plan.countProof.source !== state.source || plan.countProof.finalCount !== state.finalCount) return false
  if (canonicalJson(plan.countProof.exclusions) !== canonicalJson(state.exclusions)) return false
  if (canonicalJson(plan.areas) !== canonicalJson(state.areas)) return false
  if (
    canonicalJson(plan.filters) !==
    canonicalJson(activeFilterSnapshot(state.filters, state.audienceType))
  ) return false

  const expectedPolicy = {
    excludePastCustomers: state.suppressionPolicy.excludePastCustomers,
    excludeMailedWithinDays: state.suppressionPolicy.excludeMailedWithinDays ?? 60,
  }
  return canonicalJson(plan.suppressionPolicy) === canonicalJson(expectedPolicy)
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
    (support.loresMax || filters.loresMax === null) &&
    (support.kidsMin || filters.kidsMin === null) &&
    (support.kidsMax || filters.kidsMax === null)
    && (support.squareFootageMin || (filters.squareFootageMin ?? null) === null)
    && (support.squareFootageMax || (filters.squareFootageMax ?? null) === null)
    && (support.hasEmail || (filters.hasEmail ?? null) === null)
  )
}

export function unsupportedTargetingFilterLabels(
  support: TargetingFilterSupport,
): string[] {
  return [...new Set((Object.keys(TARGETING_FILTER_LABELS) as TargetingFilterKey[])
    .filter((key) => !support[key])
    .map((key) => TARGETING_FILTER_LABELS[key]))]
}
