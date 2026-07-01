// ============================================================
// PostCanary SttL (Send to a List) — Audience types
// ============================================================
// Shared contract between client + server for the audience-source
// upload pipeline (Phase 1: CSV upload + suppression + map + cost + approve).
// Phase 2 will extend with optional address enrichment.
// ============================================================
// API CONVENTION: snake_case directly in TypeScript (matches server response,
// no camelCase transformation). JSONB blobs use camelCase where the client
// owns read/write. See campaign.ts for the same convention.
// ============================================================

// ============================================================
// AUDIENCE — top-level entity (one per uploaded customer list)
// ============================================================

export type AudienceStatus =
  | 'uploaded'      // CSV uploaded, mapping required or in progress
  | 'mapped'        // columns mapped to canonical schema
  | 'suppressed'    // DNM/Past/Recent suppression applied
  | 'approved'      // Drake/customer approved for mailing
  | 'archived'      // archived; cannot be re-used

export type Audience = {
  id: string                       // UUID
  org_id: string                   // UUID, FK organizations.id
  user_id: string                  // UUID, FK users.id
  workspace_id: string | null      // FK workspaces.id; null = org-default workspace
  name: string                     // customer-facing label (Lisa names her audiences)
  status: AudienceStatus
  batch_id: string                 // FK batches.id (CSV upload that created this)
  created_at: string               // ISO timestamp
  approved_at: string | null
  // populated counts (server fills on detail GET)
  uploaded_count?: number          // rows in CSV after parse
  deliverable_count?: number       // post-suppression
  [key: string]: any
}

// ============================================================
// SUPPRESSION — DNM > Past > Recent precedence
// ============================================================
// Each row in the upload is attributed to AT MOST ONE suppression reason
// (highest-priority hit). A row in DNM ∩ Past ∩ Recent counts once, in DNM.
// This guarantees the "no double-count" acceptance criterion (POS-86 §6).

export type SuppressionReason = 'dnm' | 'past_customer' | 'recently_mailed'

export type SuppressionCounts = {
  dnm: number
  past_customer: number
  recently_mailed: number
  total_suppressed: number         // sum of the three (no double-counting)
}

export type AudienceSuppressionResult = {
  audience_id: string
  uploaded_count: number
  suppressed: SuppressionCounts
  deliverable_count: number        // uploaded_count - total_suppressed
  precedence: SuppressionReason[]  // ['dnm','past_customer','recently_mailed'] — server returns the order applied
}

// ============================================================
// APPROVE — flips Audience.status → 'approved' and tags rows
// ============================================================

export type AudienceApprovalRequest = {
  audience_id: string
  campaign_id?: string             // optional — attach audience to a campaign at approve-time
}

export type AudienceApprovalResponse = {
  audience_id: string
  status: 'approved'
  campaign_id: string | null
  approved_at: string
}

// ============================================================
// LIST — paginated org-scoped list (Lisa: "Use existing audience" tab)
// ============================================================

export type AudienceListResponse = {
  audiences: Audience[]
  page: number
  per_page: number
  total: number
  has_more: boolean
}

// ============================================================
// CREATE — same shape as uploadBatch from uploads.ts but audience-source
// ============================================================
// Idempotency: server dedupes on (org_id, workspace_id, file_hash). If a
// matching audience exists within a 30-day window, returns 200 with the
// existing audience + a `re_upload_prompt: true` flag (worker shows
// "Use existing / Re-upload anyway" UX per POS-88 acceptance).

export type AudienceCreateOk = {
  audience: Audience
  re_upload_prompt?: false
}

export type AudienceCreateExistingMatch = {
  audience: Audience               // the existing audience
  re_upload_prompt: true
  matched_on: {
    org_id: string
    workspace_id: string | null
    file_hash: string
    matched_at: string             // ISO timestamp of the existing upload
  }
}

export type AudienceCreateMappingRequired = {
  ok: false
  error: 'mapping_required'
  message?: string
  batch_id: string | null
  source: 'audience'
  missing?: string[]
  field_errors?: Record<string, string>
  sample_headers?: string[]
  sample_rows?: Record<string, any>[]
}

export type AudienceCreateData =
  | AudienceCreateOk
  | AudienceCreateExistingMatch
  | AudienceCreateMappingRequired
  | Record<string, any>

// ============================================================
// MAPPER SOURCE — extension of existing uploads.ts `Source` type
// ============================================================
// `Source` from uploads.ts is locked to "mail" | "crm". SttL adds "audience".
// Tests + UI code that branches on source SHOULD switch on this union.
// Migration path: existing call sites that import Source from uploads.ts
// stay valid (no breaking change); SttL code imports MapperSource here.

export type MapperSource = 'mail' | 'crm' | 'audience'

/**
 * Required canonical fields per source (matches server mapper.py).
 * Audience deliberately omits date — Bob's QuickBooks export has no
 * sent_date/job_date; Sarah's ServiceTitan export same. Address-only
 * lists must succeed (Codex C3 fix in POS-86).
 */
export const REQUIRED_FIELDS: Record<MapperSource, readonly string[]> = {
  mail: ['address1', 'city', 'state', 'zip', 'sent_date'] as const,
  crm: ['address1', 'city', 'state', 'zip', 'job_date'] as const,
  audience: ['address1', 'city', 'state', 'zip'] as const,
}

// ============================================================
// COST PREVIEW — Phase 1 ships per-card-only; Phase 2 layers enrich on top
// ============================================================
// EnrichCostBlock receives this. In Phase 1, the enrich estimate is
// null + enrich_enabled is false. In Phase 2 enabled-but-defaults-OFF,
// the enrich estimate is populated and
// user opt-in flips enrich_enabled=true.

export type AudienceCostPreview = {
  audience_id: string
  deliverable_count: number
  per_card_cost_cents: number          // server-owned (99 = $0.99 pay-per-send)
  per_card_subtotal_cents: number      // deliverable_count * per_card_cost_cents
  // Phase 2 fields (null in Phase 1)
  enrich_enabled: boolean
  melissa_enrich_estimate_cents: number | null
  total_cents: number                  // per_card_subtotal + enrich (if enabled)
}
