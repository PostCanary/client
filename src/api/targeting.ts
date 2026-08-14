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
  const plannerKeys = ['squareFootageMin', 'squareFootageMax', 'hasEmail']
  if (
    response.provider === 'planner' &&
    !plannerKeys.every((key) => typeof filters[key] === 'boolean')
  ) return null
  const audienceFilters = response.audienceFilters as Record<string, unknown> | undefined
  if (response.provider === 'planner' && audienceFilters !== undefined) {
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
    if (!business || !businessKeys.every((key) => typeof business[key] === 'boolean')) return null
  }

  return {
    ...(response as unknown as TargetingCapabilities),
    filters: {
      ...(filters as unknown as TargetingCapabilities['filters']),
      squareFootageMin: filters.squareFootageMin === true,
      squareFootageMax: filters.squareFootageMax === true,
      hasEmail: filters.hasEmail === true,
    },
  }
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
