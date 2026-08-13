// src/api/targeting.ts
import { get, postJson } from '@/api/http'
import type { TargetingArea, TargetingFilters } from '@/types/campaign'
import type {
  TargetingCapabilities,
  TargetingCountSource,
  TargetingGeographyType,
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
}

function isTargetingCapabilities(value: unknown): value is TargetingCapabilities {
  if (!value || typeof value !== 'object') return false
  const response = value as Record<string, unknown>
  if (response.provider !== 'leadgen' && response.provider !== 'data_retriever') return false
  if (!Array.isArray(response.geographyTypes)) return false
  const geographyTypes: TargetingGeographyType[] = [
    'zip',
    'circle',
    'job_radius',
    'polygon',
    'rectangle',
  ]
  if (!response.geographyTypes.every((value) => geographyTypes.includes(value as TargetingGeographyType))) return false
  if (!response.filters || typeof response.filters !== 'object') return false

  const filters = response.filters as Record<string, unknown>
  return [
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
  ].every((key) => typeof filters[key] === 'boolean')
}

export async function getTargetingCapabilities(
  signal?: AbortSignal,
): Promise<TargetingCapabilities> {
  const response = await get<unknown>(
    '/api/targeting/capabilities',
    signal ? { signal } : undefined,
  )
  if (!isTargetingCapabilities(response)) {
    throw new Error('Invalid targeting capabilities response')
  }
  return response
}

export async function getHouseholdCount(
  areas: TargetingArea[],
  filters: TargetingFilters,
  signal?: AbortSignal,
  includeTotal?: boolean,
): Promise<HouseholdCountResponse> {
  return postJson<HouseholdCountResponse>('/api/targeting/count', {
    areas,
    filters,
    includeTotal: includeTotal ?? false,
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
