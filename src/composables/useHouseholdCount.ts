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

// POS-133: mirrors the server's circle-radius validation (app/utils/geo.py
// validate_area — applies to "circle" and "job_radius" area types only; we
// do not invent polygon/rectangle limits the server doesn't enforce).
export const MAX_RADIUS_MILES = 25
export const AREA_TOO_LARGE_MESSAGE =
  'Area too large — maximum 25 mile radius. Shrink your shape to see counts.'

/** Pure helper: true if any circle/job-radius area exceeds the server's cap. */
export function hasOversizedRadius(areas: TargetingArea[]): boolean {
  return areas.some(
    (a) =>
      (a.type === 'circle' || a.type === 'job_radius') &&
      typeof a.radiusMiles === 'number' &&
      a.radiusMiles > MAX_RADIUS_MILES,
  )
}

/** Extracts the server's own validation message from a normalized http.ts error, if present. */
function extractServerMessage(e: any): string | null {
  const err = e?.data?.error
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && typeof err.message === 'string') return err.message
  return null
}

function isAbortError(e: any): boolean {
  // http.ts (~L211-217) rewraps axios/CanceledError rejections into a plain
  // Error, but preserves the original axios code — so a superseded request's
  // e.name is "Error", not "CanceledError"/"AbortError". Checking e.code
  // first is what actually catches that case; the name checks are kept for
  // any signal-originated AbortError that bypasses the axios interceptor.
  return e?.code === 'ERR_CANCELED' || e?.name === 'AbortError' || e?.name === 'CanceledError'
}

export function useHouseholdCount() {
  const count = ref(0)
  const totalCount = ref(0)
  const filteredCount = ref(0)
  const exclusions = ref({ pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const source = ref<'melissa' | 'mock'>('mock')
  const invalid = ref(false)

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
      error.value = null
      invalid.value = false
      return
    }

    // Client-side mirror of the server's radius cap — skip the doomed
    // request entirely instead of letting it 400 and leaving the last-good
    // count frozen on screen with no explanation.
    if (hasOversizedRadius(areas)) {
      loading.value = false
      error.value = AREA_TOO_LARGE_MESSAGE
      invalid.value = true
      count.value = 0
      filteredCount.value = 0
      exclusions.value = { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 }
      return
    }

    loading.value = true
    error.value = null
    lastAreas = areas

    // Invalidate total cache when areas change
    const areasKey = JSON.stringify(areas)
    if (areasKey !== totalFetchedForAreas) {
      totalFetchedForAreas = ''
      totalCount.value = 0  // S131: reset stale unfiltered total so Count&Cost tab doesn't show old area's number
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
      // (server signals mock when the provider API key is unset on dev boxes).
      const prevSource = source.value
      const result = await getHouseholdCount(areas, filters, currentSignal)
      count.value = result.finalCount
      filteredCount.value = result.filteredCount
      exclusions.value = {
        pastCustomers: result.exclusions.pastCustomers,
        recentlyMailed: result.exclusions.recentlyMailed,
        doNotMail: result.exclusions.doNotMail,
      }
      source.value = result.source

      // Mid-session live→mock flip = server lost provider permission (dev-mode
      // fallback only — prod returns 503 via the catch branch below). Warn
      // so testers know the count is now estimated, not live.
      if (result.source === 'mock' && prevSource === 'melissa') {
        error.value = 'Live data temporarily unavailable — showing estimates'
      } else {
        error.value = null
      }

      invalid.value = false
      retryCount = 0
      loading.value = false
    } catch (e: any) {
      if (isAbortError(e)) return  // Cancelled — don't touch loading/count/error
      // Retry once on semaphore timeout with jittered delay
      if (e.message?.includes('busy') && retryCount < 1) {
        retryCount++
        const jitter = 1000 + Math.random() * 2000  // 1-3s random delay
        setTimeout(() => fetchCount(areas, filters), jitter)
        return
      }
      retryCount = 0
      loading.value = false
      // POS-133: a 400 means the server's geo validation rejected the area
      // (e.g. radius > 25mi slipped past the client pre-check via a race).
      // The last-good count/exclusions are now for a DIFFERENT area than
      // what's on screen — showing them would be actively misleading, so
      // invalidate them instead of leaving a frozen number with no context.
      if (e.status === 400) {
        invalid.value = true
        count.value = 0
        filteredCount.value = 0
        exclusions.value = { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 }
        error.value = extractServerMessage(e) || AREA_TOO_LARGE_MESSAGE
      } else if (e.status === 503 || e.message?.includes('temporarily unavailable')) {
        // Drake priority #1 (S71 mem 574): NO silent mock fallback in prod.
        // When the server returns 503 (provider unavailable + alert already
        // fired server-side), surface the real error message to the user.
        // The seeded clientMockCount from L62-65 stays as-is so auto-commit
        // doesn't corrupt draft state with 0, but `error.value` is populated
        // so the UI layer can gate the Next button / show a warning banner.
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
        hhageMin: null,
        hhageMax: null,
        incomeMin: null,
        loresMin: null,
        loresMax: null,
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
    filteredCount,
    exclusions,
    loading,
    error,
    source,
    invalid,
    fetchCount,
    fetchTotalIfNeeded,
  }
}
