// src/api/renderJobs.ts
//
// Phase 4D task 26 — typed client for the render-pipeline endpoints.
// Mirrors the shape conventions of mailCampaigns.ts / brandKit.ts:
// per-endpoint snake_case response interfaces + a small mapper that
// produces a camelCase domain type the rest of the client can use.
//
// Endpoints (server-side: app/blueprints/campaign_drafts.py + render_jobs.py):
//
//   POST /api/campaign-drafts/{id}/generate-preview
//     202 { job_id, status, status_url, eta_seconds }
//     400 draft has no sequenceCards   — surface to user as "complete Step 3"
//     409 pending render job exists    — caller should poll the existing one
//     422 missing brand-kit field      — redirect to onboarding
//     429 rate limit (10/hr/org)       — surface retry-later
//     500 ServerMisconfigured          — render pipeline temporarily down
//
//   GET /api/render-jobs/{id}
//     queued | rendering   → { job_id, kind, status, progress }
//     done                 → { job_id, kind, status, cards[] }
//     failed               → { job_id, kind, status, error }
//
// Signed PDF download URL is embedded in cards[].download_url — the
// client just renders it as an <iframe src=...> per PostcardPreview.vue
// pattern. Auth is double-anchored (signed URL + session cookie) so the
// browser's existing withCredentials axios setup carries the cookie
// automatically.

import { get, postJson, http } from "@/api/http";

// ---------------------------------------------------------------------------
// Server response shapes (snake_case — match the Flask endpoints exactly).
// ---------------------------------------------------------------------------

interface GeneratePreviewResponse {
  job_id: string;
  status: string;
  status_url: string;
  eta_seconds: number;
}

interface RenderJobProgress {
  completed: number;
  total: number;
}

interface RenderJobCardOutput {
  card_number: number;
  download_url: string;
}

interface RenderJobError {
  code: string;
  message: string;
}

interface RenderJobResponse {
  ok: boolean;
  job_id: string;
  kind: string;
  status: "queued" | "rendering" | "done" | "failed";
  progress?: RenderJobProgress;
  cards?: RenderJobCardOutput[];
  error?: RenderJobError;
}

// ---------------------------------------------------------------------------
// Domain types — what the rest of the client consumes.
// ---------------------------------------------------------------------------

export interface RenderJobStart {
  jobId: string;
  status: string;
  statusUrl: string;
  etaSeconds: number;
}

export interface RenderJobCard {
  cardNumber: number;
  downloadUrl: string;
}

export interface RenderJobStatus {
  jobId: string;
  kind: string;
  status: "queued" | "rendering" | "done" | "failed";
  progress: RenderJobProgress | null;
  cards: RenderJobCard[];
  error: RenderJobError | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toRenderJobStart(r: GeneratePreviewResponse): RenderJobStart {
  return {
    jobId: r.job_id,
    status: r.status,
    statusUrl: r.status_url,
    etaSeconds: r.eta_seconds,
  };
}

function toRenderJobStatus(r: RenderJobResponse): RenderJobStatus {
  return {
    jobId: r.job_id,
    kind: r.kind,
    status: r.status,
    progress: r.progress ?? null,
    cards: (r.cards ?? []).map((c) => ({
      cardNumber: c.card_number,
      downloadUrl: c.download_url,
    })),
    error: r.error ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Kick off a preview render for the front of a draft's sequence.
 *
 * Server creates a render_job row, submits it to the orchestrator, and
 * returns 202 immediately with the job id. Caller polls `getRenderJob`
 * until status="done" or status="failed". The composable `useRenderJob`
 * wraps the polling loop with exp backoff.
 */
export async function generatePreview(
  draftId: string,
  side: "front" = "front",
): Promise<RenderJobStart> {
  const res = await postJson<GeneratePreviewResponse>(
    `/api/campaign-drafts/${draftId}/generate-preview`,
    { side },
  );
  return toRenderJobStart(res);
}

/**
 * Poll the current status of a render job. Returns the full job state
 * including signed download URLs (when status="done") or a structured
 * error (when status="failed"). The signed URLs have a 10-minute TTL —
 * caller must consume them promptly.
 */
export async function getRenderJob(jobId: string): Promise<RenderJobStatus> {
  const res = await get<RenderJobResponse>(`/api/render-jobs/${jobId}`);
  return toRenderJobStatus(res);
}

export interface PreviewCardResult {
  blob: Blob;
  /**
   * Session 54 Codex CRITICAL 2: warnings from the render-worker
   * surface through the api as an `X-Render-Warnings` header. The
   * composable logs these to the console for demo-stage visibility;
   * post-demo these drive a "regenerate on overlong" retry UI.
   * Values are the WARNING_* constants from postcard_renderer.py
   * (PHOTO_UNREACHABLE, CONTENT_OVERLONG_REGENERATE, etc.).
   */
  warnings: string[];
}

/**
 * Fetch a single-card PNG preview rendered by the actual print template.
 * Returns the blob plus any per-render warnings surfaced by the worker
 * (e.g. photo fell back to stock, content overflowed at ladder floor).
 * Synchronous server call — no job queue, no polling.
 */
export async function previewCard(
  draftId: string,
  cardNumber: number,
  signal?: AbortSignal,
): Promise<PreviewCardResult> {
  // S70 fix: accept AbortSignal and forward to axios so that callers'
  // abortController.abort() actually cancels the in-flight request.
  // Prior: the signal param didn't exist, so useCardPreview.ts called
  // .abort() thinking it was cancelling the request, but the HTTP
  // request ran to completion and a late-arriving blob for card=N
  // could overwrite currentObjectUrl after the user switched to card=M.
  const res = await http.post(
    `/api/campaign-drafts/${draftId}/preview-card/${cardNumber}`,
    {},
    { responseType: "blob", signal },
  );
  const warningsHeader = (res.headers?.["x-render-warnings"] ?? "") as string;
  const warnings = warningsHeader
    .split(",")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  return { blob: res.data as Blob, warnings };
}
