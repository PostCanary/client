// src/composables/useHouseholdCount.ts
/**
 * Manages household count fetching from the targeting API.
 *
 * - Debounces requests by 500ms
 * - Cancels in-flight requests via AbortController
 * - Abort-safe loading: loading stays true during abort (replacement is in-flight)
 * - Retries once on "busy" (semaphore timeout) with jittered delay
 * - Lazy unfiltered count (totalCount) — only fetched when Summary tab requests it
 * - Cleanup on unmount
 */
import { ref, onBeforeUnmount } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { getHouseholdCount } from '@/api/targeting'
import { estimateHouseholds, circleAreaSqMiles, zipAreaSqMiles, applyFilterReductions } from '@/data/mockTargetingData'
import type { TargetingArea, TargetingFilters } from '@/types/campaign'

export function useHouseholdCount() {
  const count = ref(0)
  const totalCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const source = ref<'melissa' | 'mock'>('mock')

  let abortController: AbortController | null = null
  let retryCount = 0
  let lastAreas: TargetingArea[] = []
  let totalFetchedForAreas = ''  // cache key to avoid re-fetching total

  const fetchCount = useDebounceFn(async (
    areas: TargetingArea[],
    filters: TargetingFilters,
  ) => {
    // Cancel previous in-flight request
    if (abortController) abortController.abort()
    abortController = new AbortController()
    const currentSignal = abortController.signal

    if (areas.length === 0) {
      count.value = 0
      totalCount.value = 0
      loading.value = false
      source.value = 'mock'
      return
    }

    loading.value = true
    error.value = null
    lastAreas = areas

    // Invalidate total cache when areas change
    const areasKey = JSON.stringify(areas)
    if (areasKey !== totalFetchedForAreas) {
      totalFetchedForAreas = ''
    }

    // S70 demo-fix: seed count immediately with client-side mock so that
    // auto-commit (which runs on a 1s timer in StepTargeting.vue) never
    // persists `finalHouseholdCount: 0` when the user clicks Next before
    // the API has a chance to respond or when the request is aborted on
    // unmount. The API result overwrites this on success.
    if (count.value === 0) {
      count.value = clientMockCount(areas, filters)
      source.value = 'mock'
    }

    try {
      // Capture prior source BEFORE overwriting so we can detect live→mock flip
      // (server signals mock when MELISSA_API_KEY is unset on dev boxes).
      const prevSource = source.value
      const result = await getHouseholdCount(areas, filters, currentSignal)
      count.value = result.finalCount
      source.value = result.source

      // Mid-session live→mock flip = server lost Melissa permission (dev-mode
      // fallback only — prod returns 503 via the catch branch below). Warn
      // so testers know the count is now estimated, not live.
      if (result.source === 'mock' && prevSource === 'melissa') {
        error.value = 'Live data temporarily unavailable — showing estimates'
      } else {
        error.value = null
      }

      retryCount = 0
      loading.value = false
    } catch (e: any) {
      if (e.name === 'AbortError' || e.name === 'CanceledError') return  // Cancelled — don't touch loading
      // Retry once on semaphore timeout with jittered delay
      if (e.message?.includes('busy') && retryCount < 1) {
        retryCount++
        const jitter = 1000 + Math.random() * 2000  // 1-3s random delay
        setTimeout(() => fetchCount(areas, filters), jitter)
        return
      }
      retryCount = 0
      // Drake priority #1 (S71 mem 574): NO silent mock fallback in prod.
      // When the server returns 503 (Melissa unavailable + alert already
      // fired server-side), surface the real error message to the user.
      // The seeded clientMockCount from L62-65 stays as-is so auto-commit
      // doesn't corrupt draft state with 0, but `error.value` is populated
      // so the UI layer can gate the Next button / show a warning banner.
      loading.value = false
      if (e.status === 503 || e.message?.includes('temporarily unavailable')) {
        error.value = e.message || 'Household-count service temporarily unavailable. Please retry in a minute.'
      } else {
        error.value = e.message || 'Could not get household count. Please retry.'
      }
    }
  }, 500)

  function clientMockCount(areas: TargetingArea[], filters: TargetingFilters): number {
    let sqMiles = 0
    for (const a of areas) {
      if ((a.type === 'circle' || a.type === 'job_radius') && a.radiusMiles) {
        sqMiles += circleAreaSqMiles(a.radiusMiles)
      } else if (a.type === 'zip') {
        sqMiles += zipAreaSqMiles()
      } else if (a.type === 'rectangle' && a.coordinates?.length >= 2) {
        const c = a.coordinates
        const latMid = (c[0]![0]! + c[1]![0]!) / 2
        const h = Math.abs(c[1]![0]! - c[0]![0]!) * 69
        const w = Math.abs(c[1]![1]! - c[0]![1]!) * 69 * Math.cos(latMid * Math.PI / 180)
        sqMiles += h * w
      } else if (a.type === 'polygon' && a.coordinates?.length >= 3) {
        const c = a.coordinates
        const latMid = c.reduce((s, p) => s + p[0]!, 0) / c.length
        let pa = 0
        for (let i = 0; i < c.length; i++) {
          const j = (i + 1) % c.length
          pa += c[i]![1]! * c[j]![0]! - c[j]![1]! * c[i]![0]!
        }
        sqMiles += Math.abs(pa) / 2 * 69 * 69 * Math.cos(latMid * Math.PI / 180)
      } else {
        sqMiles += 2
      }
    }
    const base = estimateHouseholds(sqMiles)
    return Math.max(applyFilterReductions(base, filters), 0)
  }

  async function fetchTotalIfNeeded() {
    // Lazy unfiltered call — only fires when Summary tab opens
    const areasKey = JSON.stringify(lastAreas)
    if (totalFetchedForAreas === areasKey) return  // already fetched for these areas
    if (lastAreas.length === 0) return

    try {
      const result = await getHouseholdCount(lastAreas, {
        homeowner: null,
        homeValueMin: null,
        homeValueMax: null,
        yearBuiltMin: null,
        yearBuiltMax: null,
        propertyTypes: [],
      }, undefined, true)
      totalCount.value = result.totalCount ?? result.filteredCount
      totalFetchedForAreas = areasKey
    } catch {
      // Non-critical — total count is supplementary info
    }
  }

  // Cleanup: abort in-flight request when component unmounts
  onBeforeUnmount(() => {
    if (abortController) abortController.abort()
  })

  return {
    count,
    totalCount,
    loading,
    error,
    source,
    fetchCount,
    fetchTotalIfNeeded,
  }
}
