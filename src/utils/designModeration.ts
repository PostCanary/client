export const DESIGN_MODERATION_ERROR_CODES = [
  "design_pending_review",
  "design_rejected",
] as const;

export type DesignModerationErrorCode =
  (typeof DESIGN_MODERATION_ERROR_CODES)[number];

export type DesignModerationStatus = "pending" | "approved" | "rejected";

export interface DesignModerationConflict {
  code: DesignModerationErrorCode;
  message: string;
}

const ERROR_CODES = new Set<string>(DESIGN_MODERATION_ERROR_CODES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectRecords(value: unknown): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];
  const seen = new Set<Record<string, unknown>>();

  const visit = (node: unknown) => {
    if (!isRecord(node) || seen.has(node)) return;
    seen.add(node);
    records.push(node);
    visit(node.error);
    visit(node.details);
    visit(node.data);
  };

  visit(value);
  return records;
}

function asErrorCode(value: unknown): DesignModerationErrorCode | null {
  return typeof value === "string" && ERROR_CODES.has(value)
    ? (value as DesignModerationErrorCode)
    : null;
}

function asMessage(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Read Flask Conflict `{error: {type, message, details.error_code}}` for the
 * two design-moderation codes. Returns the server message verbatim.
 */
export function extractDesignModerationConflict(
  value: unknown,
): DesignModerationConflict | null {
  const records = collectRecords(value);
  let code: DesignModerationErrorCode | null = null;
  let message: string | null = null;
  for (const record of records) {
    code ??= asErrorCode(record.error_code);
    message ??= asMessage(record.message);
  }
  if (!code || !message) return null;
  return { code, message };
}

export function extractDesignModerationMessage(value: unknown): string | null {
  return extractDesignModerationConflict(value)?.message ?? null;
}

export function isDesignModerationStatus(
  value: unknown,
): value is DesignModerationStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

/**
 * Read pending/rejected status from whatever shape the server later exposes
 * (camelCase on the design JSONB blob, or snake_case on a serializer).
 */
export function readDesignModeration(source: unknown): {
  status: DesignModerationStatus | null;
  reason: string | null;
} {
  if (!isRecord(source)) return { status: null, reason: null };

  const nestedAsset = isRecord(source.uploadedAsset)
    ? source.uploadedAsset
    : isRecord(source.uploaded_asset)
      ? source.uploaded_asset
      : null;

  const statusRaw =
    source.moderationStatus ??
    source.moderation_status ??
    nestedAsset?.moderationStatus ??
    nestedAsset?.moderation_status;
  const reasonRaw =
    source.rejectionReason ??
    source.rejection_reason ??
    nestedAsset?.rejectionReason ??
    nestedAsset?.rejection_reason;

  return {
    status: isDesignModerationStatus(statusRaw) ? statusRaw : null,
    reason: typeof reasonRaw === "string" && reasonRaw.trim() ? reasonRaw : null,
  };
}
