// src/api/targeting.ts
import { get, postJson } from '@/api/http'
import type { TargetingArea, TargetingFilters } from '@/types/campaign'
import type {
  AudienceSuppressionPolicy,
  TargetingCapabilities,
  AudienceQueryPlan,
  TargetingCountSource,
  TargetingGeographyType,
  BusinessTargetingFilterSupport,
} from '@/types/targeting'
import { parsePurchaseRecordsMaxQty } from '@/utils/recipientCap'

export interface HouseholdCountResponse {
  ok: boolean
  totalCount?: number
  filteredCount: number
  exclusions: {
    pastCustomers: number
    recentlyMailed: number
    doNotMail: number
  }
  finalCount: number
  source: TargetingCountSource
  queryPlan?: AudienceQueryPlan
}

function parseTargetingCapabilities(value: unknown): TargetingCapabilities | null {
  if (!value || typeof value !== 'object') return null
  const response = value as Record<string, unknown>
  if (!['leadgen', 'data_retriever', 'planner'].includes(String(response.provider))) return null
  if (!Array.isArray(response.geographyTypes)) return null
  const geographyTypes: TargetingGeographyType[] = [
    'zip',
    'circle',
    'job_radius',
    'polygon',
    'rectangle',
  ]
  if (!response.geographyTypes.every((value) => geographyTypes.includes(value as TargetingGeographyType))) return null
  if (!response.filters || typeof response.filters !== 'object') return null

  const filters = response.filters as Record<string, unknown>
  // Hard-required on every provider. Do not put rollout keys here — a
  // preview client against an older API must still parse capabilities.
  const legacyKeys = [
    'homeowner',
    'homeValueMin',
    'homeValueMax',
    'yearBuiltMin',
    'yearBuiltMax',
    'propertyTypes',
    'hhageMin',
    'hhageMax',
    'incomeMin',
    'loresMin',
    'loresMax',
  ]
  if (!legacyKeys.every((key) => typeof filters[key] === 'boolean')) return null
  // Present-or-default keys. Absent → false (fail closed for that filter only).
  const optionalFilterKeys = [
    'squareFootageMin',
    'squareFootageMax',
    'hasEmail',
    'kidsMin',
    'kidsMax',
  ] as const
  const plannerKeys = ['squareFootageMin', 'squareFootageMax', 'hasEmail']
  if (
    response.provider === 'planner' &&
    !plannerKeys.every((key) => typeof filters[key] === 'boolean')
  ) return null
  const audienceFilters = response.audienceFilters as Record<string, unknown> | undefined
  if (response.provider === 'planner') {
    if (
      response.strategy !== 'per_campaign' ||
      typeof response.schemaVersion !== 'number' ||
      !Number.isSafeInteger(response.schemaVersion) ||
      response.schemaVersion < 1 ||
      !audienceFilters
    ) return null
    const consumer = audienceFilters.consumer as Record<string, unknown> | undefined
    const business = audienceFilters.business as Record<string, unknown> | undefined
    const businessKeys: Array<keyof BusinessTargetingFilterSupport> = [
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
    if (
      !consumer ||
      ![...legacyKeys, ...plannerKeys].every((key) => typeof consumer[key] === 'boolean') ||
      !business ||
      !businessKeys.every((key) => typeof business[key] === 'boolean')
    ) return null

    if (!Array.isArray(response.products) || !response.products.every((product) => {
      if (!product || typeof product !== 'object') return false
      const item = product as Record<string, unknown>
      return typeof item.id === 'string' &&
        ['consumer', 'business'].includes(String(item.audienceType)) &&
        typeof item.enabled === 'boolean' &&
        typeof item.implemented === 'boolean'
    })) return null

    const capabilityDetails = response.filterCapabilities
    if (!capabilityDetails || typeof capabilityDetails !== 'object') return null
    const capabilityMap = capabilityDetails as Record<string, unknown>
    if (![...legacyKeys, ...plannerKeys].every((key) => key in capabilityMap)) return null
    if (!Object.values(capabilityMap).every((detail) => {
      if (!detail || typeof detail !== 'object') return false
      const item = detail as Record<string, unknown>
      return ['target', 'output_only', 'unavailable'].includes(String(item.mode)) &&
        Array.isArray(item.products) &&
        item.products.every((product) => typeof product === 'string')
    })) return null
  }

  const purchaseRecordsMaxQty = parsePurchaseRecordsMaxQty(
    response.purchase_records_max_qty,
  )

  const normalizedFilters = {
    ...(filters as unknown as TargetingCapabilities['filters']),
  }
  for (const key of optionalFilterKeys) {
    normalizedFilters[key] = filters[key] === true
  }

  const parsed: TargetingCapabilities = {
    ...(response as unknown as TargetingCapabilities),
    filters: normalizedFilters,
  }

  if (parsed.audienceFilters?.consumer) {
    const source = parsed.audienceFilters.consumer
    const consumer = { ...source }
    for (const key of optionalFilterKeys) {
      consumer[key] = (source as unknown as Record<string, unknown>)[key] === true
    }
    parsed.audienceFilters = {
      ...parsed.audienceFilters,
      consumer,
    }
  }

  if (purchaseRecordsMaxQty != null) {
    parsed.purchase_records_max_qty = purchaseRecordsMaxQty
  } else {
    delete parsed.purchase_records_max_qty
  }
  return parsed
}

export async function getTargetingCapabilities(
  signal?: AbortSignal,
): Promise<TargetingCapabilities> {
  const response = await get<unknown>(
    '/api/targeting/capabilities',
    signal ? { signal } : undefined,
  )
  const parsed = parseTargetingCapabilities(response)
  if (!parsed) {
    throw new Error('Invalid targeting capabilities response')
  }
  return parsed
}

export async function getHouseholdCount(
  areas: TargetingArea[],
  filters: TargetingFilters,
  signal?: AbortSignal,
  includeTotal?: boolean,
  suppressionPolicy?: AudienceSuppressionPolicy,
  audienceType: 'consumer' | 'business' = 'consumer',
): Promise<HouseholdCountResponse> {
  return postJson<HouseholdCountResponse>('/api/targeting/count', {
    areas,
    filters,
    includeTotal: includeTotal ?? false,
    suppressionPolicy,
    audienceType,
  }, signal ? { signal } : undefined)
}

export interface ZipCentroid {
  zip: string
  lat: number
  lon: number
}

export interface ZipCentroidsResponse {
  centroids: ZipCentroid[]
}

export async function getZipCentroids(
  zips: string[],
  signal?: AbortSignal,
): Promise<ZipCentroidsResponse> {
  return get<ZipCentroidsResponse>('/api/targeting/zip-centroids', {
    params: { zips: zips.join(',') },
    ...(signal ? { signal } : {}),
  })
}
