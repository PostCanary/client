// src/api/printJobs.ts
//
// S329 — typed client for the print-job endpoints (M.7 / U.4).
// Mirrors the shape conventions of renderJobs.ts:
// per-endpoint snake_case response interfaces + a small mapper that
// produces a camelCase domain type the rest of the client can use.
//
// Endpoints (server-side: app/blueprints/print_jobs.py):
//
//   POST /api/print_jobs/submit
//     body: {campaign_id, design_template_id, partner_id?, return_address,
//            front_request_body, back_request_body, has_merge_fields}
//     201 { job_id, status, partner_order_id }
//     400 campaign_empty                     — no recipients to submit
//     401 (raw)                               — http.ts opens LoginModal
//     403 membership_inactive                 — revoked org membership
//     409 idempotency_conflict                — fingerprint replay; existing_job_id present
//     422 recipient_missing_field             — recipient row missing required address field
//     502 partner_rejected | partner_unavailable_after_retry
//     500 internal_error
//
//   GET /api/print_jobs/{id}
//     200 { job_id, status, partner_id, partner_order_id }
//     404 not_found                           — missing or other-org id (existence-oracle)
//     403 membership_inactive
//
// Idempotency is server-fingerprint based (S310 finding) — NO client
// Idempotency-Key header. Re-submit with same inputs returns 409 with
// `existing_job_id` so the UI can navigate to the existing job.

import { get, postJson } from "@/api/http";

// ---------------------------------------------------------------------------
// Server response shapes (snake_case — match the Flask endpoints exactly).
// ---------------------------------------------------------------------------

export type PrintJobServerStatus =
  | "draft"
  | "submitted"
  | "accepted"
  | "in_production"
  | "printed"
  | "mailed"
  | "delivered"
  | "returned"
  | "failed";

interface SubmitPrintJobResponse {
  job_id: string;
  status: PrintJobServerStatus;
  partner_order_id: string | null;
}

interface GetPrintJobResponse {
  job_id: string;
  status: PrintJobServerStatus;
  partner_id: string;
  partner_order_id: string | null;
}

// ---------------------------------------------------------------------------
// Request shape (per S312 brief §U.3 PrintJobSubmitInputs).
// ---------------------------------------------------------------------------

export interface PrintJobReturnAddress {
  name: string;
  line_1: string;
  line_2?: string;
  city: string;
  state: string;
  zip5: string;
  zip4?: string;
}

export interface PrintJobSubmitInputs {
  campaign_id: string;
  design_template_id: string;
  partner_id: "mock";
  return_address: PrintJobReturnAddress;
  front_request_body: Record<string, unknown>;
  back_request_body: Record<string, unknown>;
  has_merge_fields: boolean;
}

// ---------------------------------------------------------------------------
// Domain types — what the rest of the client consumes.
// ---------------------------------------------------------------------------

export interface PrintJobSubmitResult {
  jobId: string;
  status: PrintJobServerStatus;
  partnerOrderId: string | null;
}

export interface PrintJobStatus {
  jobId: string;
  status: PrintJobServerStatus;
  partnerId: string;
  partnerOrderId: string | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toSubmitResult(r: SubmitPrintJobResponse): PrintJobSubmitResult {
  return {
    jobId: r.job_id,
    status: r.status,
    partnerOrderId: r.partner_order_id ?? null,
  };
}

function toPrintJobStatus(r: GetPrintJobResponse): PrintJobStatus {
  return {
    jobId: r.job_id,
    status: r.status,
    partnerId: r.partner_id,
    partnerOrderId: r.partner_order_id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Submit a print job for a mail-campaign + design.
 *
 * Server computes a fingerprint across all input fields; same inputs from
 * the same org return 409 with `existing_job_id` (replay-fetch), NOT a
 * duplicate row. Caller does NOT supply Idempotency-Key — fingerprint is
 * deterministic from `inputs` (S310 finding, `print_submit.py:312-322`).
 */
export async function submitPrintJob(
  inputs: PrintJobSubmitInputs,
): Promise<PrintJobSubmitResult> {
  const res = await postJson<SubmitPrintJobResponse>(
    `/api/print_jobs/submit`,
    inputs,
  );
  return toSubmitResult(res);
}

/**
 * Poll the current status of a print job. Returns server status verbatim
 * (one of the 9 PrintJob states); the composable maps it to a UI phase.
 */
export async function getPrintJob(jobId: string): Promise<PrintJobStatus> {
  const res = await get<GetPrintJobResponse>(`/api/print_jobs/${jobId}`);
  return toPrintJobStatus(res);
}
