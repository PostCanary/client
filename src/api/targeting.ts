// src/api/targeting.ts
import { get, postJson } from '@/api/http'
import type { TargetingArea, TargetingFilters } from '@/types/campaign'

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
  source: 'melissa' | 'mock'
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
