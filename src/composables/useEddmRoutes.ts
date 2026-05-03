// src/composables/useEddmRoutes.ts
import { get } from '@/api/http'
import type { EddmRoute } from '@/types/campaign'

// Augment Window so TypeScript knows about the server-injected config block.
// Populated by ER.3e (server-side flag injection). Defaults to false when absent.
declare global {
  interface Window {
    __POSTCANARY_CONFIG__?: { eddmEnabled?: boolean }
  }
}

export const eddmEnabled: boolean =
  window.__POSTCANARY_CONFIG__?.eddmEnabled ?? false

interface EddmRoutesApiResponse {
  ok: boolean
  zip5: string
  routes: EddmRoute[]
}

export async function fetchRoutes(zip5: string): Promise<EddmRoute[]> {
  try {
    const data = await get<EddmRoutesApiResponse>(`/api/eddm/routes?zip=${encodeURIComponent(zip5)}`)
    return data.routes ?? []
  } catch (e: any) {
    if (e.status === 400) return []
    throw e
  }
}
