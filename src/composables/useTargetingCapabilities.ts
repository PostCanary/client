import { getTargetingCapabilities } from '@/api/targeting'
import type { TargetingCapabilities } from '@/types/targeting'

export interface TargetingCapabilitiesLoadResult {
  capabilities: TargetingCapabilities | null
  failed: boolean
}

/**
 * Capability discovery is advisory for legacy/prod servers. A failed or
 * unavailable endpoint must leave the existing targeting behavior intact.
 */
export async function loadTargetingCapabilities(
  signal?: AbortSignal,
): Promise<TargetingCapabilitiesLoadResult> {
  try {
    return {
      capabilities: await getTargetingCapabilities(signal),
      failed: false,
    }
  } catch {
    return { capabilities: null, failed: true }
  }
}
