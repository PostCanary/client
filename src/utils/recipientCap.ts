const OVER_RECIPIENT_CAP_TYPES = new Set([
  "OverRecipientCap",
  "over_recipient_cap",
  "overRecipientCap",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 1) {
    return value
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    if (Number.isSafeInteger(parsed) && parsed >= 1) return parsed
  }
  return null
}

/** Read the live server cap. Never invent a numeric fallback. */
export function parsePurchaseRecordsMaxQty(value: unknown): number | null {
  return parsePositiveInt(value)
}

export function isOverRecipientCap(
  count: number,
  maxQty: number | null | undefined,
): boolean {
  return typeof maxQty === "number" && Number.isSafeInteger(count) && count > maxQty
}

export function formatRecipientCapWarning(maxQty: number): string {
  return (
    `Campaigns are currently limited to ${maxQty.toLocaleString()} recipients` +
    " - narrow your filters or reduce your area"
  )
}

export interface OverRecipientCapError {
  maxQty: number | null
  requestedQty: number | null
}

function isOverRecipientCapName(value: unknown): boolean {
  return typeof value === "string" && OVER_RECIPIENT_CAP_TYPES.has(value)
}

function collectErrorRecords(value: unknown): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = []
  const seen = new Set<Record<string, unknown>>()

  const visit = (node: unknown) => {
    if (!isRecord(node) || seen.has(node)) return
    seen.add(node)
    records.push(node)
    visit(node.error)
    visit(node.details)
    visit(node.data)
  }

  visit(value)
  if (isRecord(value) && "data" in value) visit(value.data)
  return records
}

/**
 * Match OverRecipientCap across the envelopes this app already uses:
 * `{error: {type, message, details}}` (Flask APIError) and
 * `{error: "OverRecipientCap", message, max_qty, requested_qty}`.
 */
export function extractOverRecipientCapError(
  value: unknown,
): OverRecipientCapError | null {
  const records = collectErrorRecords(value)
  const matched = records.some((record) =>
    isOverRecipientCapName(record.type) ||
    isOverRecipientCapName(record.code) ||
    isOverRecipientCapName(record.error) ||
    isOverRecipientCapName(record.error_code) ||
    isOverRecipientCapName(record.errorType),
  )
  if (!matched) return null

  let maxQty: number | null = null
  let requestedQty: number | null = null
  for (const record of records) {
    maxQty ??= parsePositiveInt(record.max_qty)
    requestedQty ??= parsePositiveInt(record.requested_qty)
  }
  return { maxQty, requestedQty }
}

export function formatOverRecipientCapPurchaseError(
  error: OverRecipientCapError,
): string {
  if (error.requestedQty != null && error.maxQty != null) {
    return (
      `This campaign has ${error.requestedQty.toLocaleString()} recipients, ` +
      `which is over the current limit of ${error.maxQty.toLocaleString()}. ` +
      "Go back to Targeting to narrow your selection."
    )
  }
  return (
    "This campaign is over the current recipient limit. " +
    "Go back to Targeting to narrow your selection."
  )
}
