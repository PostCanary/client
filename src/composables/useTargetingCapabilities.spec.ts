import { describe, expect, it, vi } from 'vitest'
import { getTargetingCapabilities } from '@/api/targeting'
import { loadTargetingCapabilities } from './useTargetingCapabilities'

vi.mock('@/api/targeting', () => ({
  getTargetingCapabilities: vi.fn(),
}))

describe('loadTargetingCapabilities', () => {
  it('preserves the legacy behavior signal when capability fetch fails', async () => {
    vi.mocked(getTargetingCapabilities).mockRejectedValue(new Error('404 Not Found'))

    await expect(loadTargetingCapabilities()).resolves.toEqual({
      capabilities: null,
      failed: true,
    })
  })
})
