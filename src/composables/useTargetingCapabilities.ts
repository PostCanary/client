import { getTargetingCapabilities } from '@/api/targeting'
import type { TargetingCapabilities } from '@/types/targeting'

export interface TargetingCapabilitiesLoadResult {
  capabilities: TargetingCapabilities | null
  failed: boolean
}

/**
 * Load the server capability contract. Callers must fail closed when the
 * contract is missing or invalid so unsupported filters cannot reach count or
 * purchase requests.
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
