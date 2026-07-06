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
  // Neutral until the server actually reports a source (POS-135: no client
  // estimate exists to badge as 'mock' by default anymore).
  const source = ref<'melissa' | 'mock'>('melissa')
  const invalid = ref(false)
  // POS-135: true once `count` reflects an authoritative answer (a real
  // server response, or the genuine "no areas selected" zero) rather than
  // its uninitialized default. Callers (StepTargeting's auto-commit) must
  // gate on this instead of relying on a seeded client-side estimate, so a
  // draft never gets persisted with a fabricated or premature 0.
  const ready = ref(false)

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
      error.value = null
      invalid.value = false
      ready.value = true  // genuinely 0 households — no area selected, not an estimate
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
      ready.value = true  // definitive (rejected) state, not a fabricated number
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
      ready.value = true
      retryCount = 0
      loading.value = false
    } catch (e: any) {
      if (isAbortError(e)) return  // Cancelled — don't touch loading/count/error/ready
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
        ready.value = true  // definitive (rejected) state, not a fabricated number
      } else if (e.status === 503 || e.message?.includes('temporarily unavailable')) {
        // Drake priority #1 (S71 mem 574 / POS-135): NO silent mock fallback,
        // client or server. Surface the real error message to the user. Do
        // NOT set ready here on a first-ever fetch — count is still at its
        // uninitialized 0 and must not look authoritative (see `ready` doc
        // comment above). If a PRIOR fetch already succeeded, ready is
        // already true and count holds that last-good real value, which is
        // safe to keep showing/committing.
        error.value = e.message || 'Household-count service temporarily unavailable. Please retry in a minute.'
      } else {
        error.value = e.message || 'Could not get household count. Please retry.'
      }
    }
  }, 500)

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
    ready,
    fetchCount,
    fetchTotalIfNeeded,
  }
}
