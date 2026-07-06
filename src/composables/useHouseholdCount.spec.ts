// POS-133: growing a drawn circle past the server's 25-mile radius cap made
// the estimate request 400, but the composable swallowed the error and left
// the last-good count/cost frozen on screen with no explanation. Covers the
// radius pre-validation helper plus the fetchCount error paths (400
// invalidates, ERR_CANCELED stays silent, success after failure recovers).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { TargetingArea, TargetingFilters } from '@/types/campaign'

vi.mock('@/api/targeting', () => ({
  getHouseholdCount: vi.fn(),
}))

import { getHouseholdCount } from '@/api/targeting'
import {
  useHouseholdCount,
  hasOversizedRadius,
  MAX_RADIUS_MILES,
  AREA_TOO_LARGE_MESSAGE,
} from './useHouseholdCount'

const NO_FILTERS: TargetingFilters = {
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
}

function circle(radiusMiles: number): TargetingArea {
  return { type: 'circle', coordinates: [[33.45, -111.95]], radiusMiles }
}

describe('hasOversizedRadius', () => {
  it('is false for a circle at or under the cap', () => {
    expect(hasOversizedRadius([circle(MAX_RADIUS_MILES)])).toBe(false)
    expect(hasOversizedRadius([circle(10)])).toBe(false)
  })

  it('is true for a circle over the cap', () => {
    expect(hasOversizedRadius([circle(25.01)])).toBe(true)
  })

  it('is true for a job_radius area over the cap', () => {
    expect(
      hasOversizedRadius([{ type: 'job_radius', coordinates: [[33.45, -111.95]], radiusMiles: 30 }]),
    ).toBe(true)
  })

  it('flags the set if ANY area is oversized, even among valid ones', () => {
    expect(hasOversizedRadius([circle(5), circle(26)])).toBe(true)
  })

  it('does not apply a radius limit to rectangles or polygons (server has none)', () => {
    const rectangle: TargetingArea = {
      type: 'rectangle',
      coordinates: [[33, -112], [34, -111]],
    }
    const polygon: TargetingArea = {
      type: 'polygon',
      coordinates: [[33, -112], [34, -111], [33.5, -110.5]],
    }
    expect(hasOversizedRadius([rectangle, polygon])).toBe(false)
  })

  it('is false for an empty area list', () => {
    expect(hasOversizedRadius([])).toBe(false)
  })
})

describe('useHouseholdCount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(getHouseholdCount).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function flushDebounce() {
    await vi.advanceTimersByTimeAsync(500)
  }

  it('skips the API call and invalidates the count when a circle exceeds the radius cap', async () => {
    const hc = useHouseholdCount()
    // Seed a prior "good" count so we can prove it gets cleared, not left frozen.
    hc.count.value = 4200

    hc.fetchCount([circle(30)], NO_FILTERS)
    await flushDebounce()

    expect(getHouseholdCount).not.toHaveBeenCalled()
    expect(hc.count.value).toBe(0)
    expect(hc.invalid.value).toBe(true)
    expect(hc.error.value).toBe(AREA_TOO_LARGE_MESSAGE)
    expect(hc.loading.value).toBe(false)
  })

  it('invalidates the count and surfaces the server message on a 400 response', async () => {
    const err = new Error('400 Bad Request') as Error & { status: number; data: any }
    err.status = 400
    err.data = { error: { code: 'invalid_radius', message: 'Radius must be between 0.01 and 25 miles' } }
    vi.mocked(getHouseholdCount).mockRejectedValue(err)

    const hc = useHouseholdCount()
    hc.count.value = 4200

    hc.fetchCount([circle(10)], NO_FILTERS)
    await flushDebounce()
    await vi.waitFor(() => expect(hc.loading.value).toBe(false))

    expect(hc.invalid.value).toBe(true)
    expect(hc.count.value).toBe(0)
    expect(hc.error.value).toBe('Radius must be between 0.01 and 25 miles')
  })

  it('falls back to the friendly message on a 400 with no server message', async () => {
    const err = new Error('400 Bad Request') as Error & { status: number }
    err.status = 400
    vi.mocked(getHouseholdCount).mockRejectedValue(err)

    const hc = useHouseholdCount()
    hc.fetchCount([circle(10)], NO_FILTERS)
    await flushDebounce()
    await vi.waitFor(() => expect(hc.loading.value).toBe(false))

    expect(hc.error.value).toBe(AREA_TOO_LARGE_MESSAGE)
    expect(hc.invalid.value).toBe(true)
  })

  it('stays silent on a superseded/aborted request (ERR_CANCELED rewrapped by http.ts)', async () => {
    // http.ts rewraps CanceledError into a plain Error, so e.name is "Error" —
    // only e.code identifies the abort. This is the exact case that used to
    // transiently surface "Network error".
    const err = new Error('Network error') as Error & { code: string }
    err.code = 'ERR_CANCELED'
    vi.mocked(getHouseholdCount).mockRejectedValue(err)

    const hc = useHouseholdCount()
    hc.fetchCount([circle(10)], NO_FILTERS)
    await flushDebounce()
    await Promise.resolve()
    await Promise.resolve()

    expect(hc.error.value).toBeNull()
    expect(hc.invalid.value).toBe(false)
  })

  it('restores a live count after a prior failure once the area becomes valid', async () => {
    // First call never reaches the API — the client-side pre-check catches
    // the oversized radius. Only the second (valid-sized) call should hit it.
    vi.mocked(getHouseholdCount).mockResolvedValueOnce({
      ok: true,
      finalCount: 1500,
      filteredCount: 1500,
      exclusions: { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 },
      source: 'melissa',
    })

    const hc = useHouseholdCount()
    hc.fetchCount([circle(30)], NO_FILTERS) // oversized — client pre-check rejects, no API call
    await flushDebounce()
    expect(hc.invalid.value).toBe(true)
    expect(getHouseholdCount).not.toHaveBeenCalled()

    // Shrink back under the cap
    hc.fetchCount([circle(10)], NO_FILTERS)
    await flushDebounce()
    await vi.waitFor(() => expect(hc.loading.value).toBe(false))

    expect(hc.invalid.value).toBe(false)
    expect(hc.error.value).toBeNull()
    expect(hc.count.value).toBe(1500)
  })
})

// POS-135 (Drake): numbers shown to customers must be real Melissa data or a
// real error — never a client-side guess. clientMockCount was removed;
// `ready` now gates auto-commit instead of a seeded estimate.
describe('useHouseholdCount — POS-135 (no client-side estimate)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(getHouseholdCount).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function flushDebounce() {
    await vi.advanceTimersByTimeAsync(500)
  }

  it('starts with count 0, ready false, and no mock source — nothing is fabricated before a fetch', () => {
    const hc = useHouseholdCount()
    expect(hc.count.value).toBe(0)
    expect(hc.ready.value).toBe(false)
    expect(hc.source.value).not.toBe('mock')
  })

  it('never estimates a count while a request is in flight — count stays 0 until the API responds', async () => {
    let resolveFetch: (v: unknown) => void
    vi.mocked(getHouseholdCount).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      }) as any,
    )

    const hc = useHouseholdCount()
    hc.fetchCount([circle(5)], NO_FILTERS)
    await flushDebounce()

    // Mid-flight: no estimate was seeded, and the fetch isn't authoritative yet.
    expect(hc.count.value).toBe(0)
    expect(hc.ready.value).toBe(false)
    expect(hc.loading.value).toBe(true)

    resolveFetch!({
      ok: true,
      finalCount: 900,
      filteredCount: 900,
      exclusions: { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 },
      source: 'melissa',
    })
    await vi.waitFor(() => expect(hc.loading.value).toBe(false))

    expect(hc.count.value).toBe(900)
    expect(hc.ready.value).toBe(true)
  })

  it('marks ready on a real zero-area count — a genuine 0, not an estimate', async () => {
    const hc = useHouseholdCount()
    hc.fetchCount([], NO_FILTERS)
    await flushDebounce()

    expect(hc.count.value).toBe(0)
    expect(hc.ready.value).toBe(true)
    expect(getHouseholdCount).not.toHaveBeenCalled()
  })

  it('marks ready on an oversized-radius rejection — definitive, not fabricated', async () => {
    const hc = useHouseholdCount()
    hc.fetchCount([circle(30)], NO_FILTERS)
    await flushDebounce()

    expect(hc.ready.value).toBe(true)
    expect(hc.count.value).toBe(0)
    expect(hc.invalid.value).toBe(true)
  })

  it('does NOT mark ready on a first-ever 503 outage — count must not look authoritative', async () => {
    const err = new Error('temporarily unavailable') as Error & { status: number }
    err.status = 503
    vi.mocked(getHouseholdCount).mockRejectedValue(err)

    const hc = useHouseholdCount()
    hc.fetchCount([circle(5)], NO_FILTERS)
    await flushDebounce()
    await vi.waitFor(() => expect(hc.loading.value).toBe(false))

    expect(hc.ready.value).toBe(false)
    expect(hc.count.value).toBe(0)
    expect(hc.error.value).toBe('temporarily unavailable')
  })

  it('keeps ready true and the last-good count after a 503 that follows a successful fetch', async () => {
    vi.mocked(getHouseholdCount).mockResolvedValueOnce({
      ok: true,
      finalCount: 1200,
      filteredCount: 1200,
      exclusions: { pastCustomers: 0, recentlyMailed: 0, doNotMail: 0 },
      source: 'melissa',
    })
    const hc = useHouseholdCount()
    hc.fetchCount([circle(5)], NO_FILTERS)
    await flushDebounce()
    await vi.waitFor(() => expect(hc.loading.value).toBe(false))
    expect(hc.ready.value).toBe(true)
    expect(hc.count.value).toBe(1200)

    const err = new Error('temporarily unavailable') as Error & { status: number }
    err.status = 503
    vi.mocked(getHouseholdCount).mockRejectedValue(err)
    hc.fetchCount([circle(6)], NO_FILTERS)
    await flushDebounce()
    await vi.waitFor(() => expect(hc.loading.value).toBe(false))

    expect(hc.ready.value).toBe(true)
    expect(hc.count.value).toBe(1200) // last-good real value, not corrupted
    expect(hc.error.value).toBe('temporarily unavailable')
  })
})
