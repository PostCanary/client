// src/composables/usePrintJob.ts
//
// S329 — submit + polling composable for print jobs (U.4 brief).
//
// Caller pattern (U.3 SubmitPrintJobButton.vue + U.5 PrintJobStatusPanel.vue):
//
//   const { phase, jobId, status, error, submit, watch, cancel } = usePrintJob();
//   await submit(inputs);
//   // → phase: "idle" → "submitting" → "submitted" → "accepted" | "failed"
//   // → on accepted, downstream UI surfaces success + asset previews
//   // → on failed, `error` holds {code, message}
//
// Or, when arriving at a status panel via deep-link (no submit):
//
//   const { phase, status, watch } = usePrintJob();
//   await watch(jobId);
//
// Polling cadence: exponential backoff 1s → 8s cap, 120s deadline.
// Cancel: explicit `cancel()` + onBeforeUnmount; identical generation-counter
// pattern to useRenderJob.ts — survives Vue HMR resets, no setTimeout races.
//
// Phase enum collapses the server's 9-state PrintJob enum to UI-meaningful
// states per brief §"What does NOT exist" item 2. `in_production` and
// `printed` both map to `producing` because the customer-facing surface
// doesn't distinguish them; the underlying server state is preserved on
// the `status` ref for any downstream UI that wants the verbatim value.

import { ref, onBeforeUnmount } from "vue";
import {
  submitPrintJob,
  getPrintJob,
  type PrintJobServerStatus,
  type PrintJobStatus,
  type PrintJobSubmitInputs,
} from "@/api/printJobs";

const POLL_INITIAL_MS = 1000;
const POLL_MAX_MS = 8000;
const POLL_BACKOFF_MULT = 1.6;
const POLL_DEADLINE_MS = 120_000;

export type PrintJobPhase =
  | "idle"
  | "submitting"
  | "submitted"
  | "accepted"
  | "producing"
  | "mailed"
  | "delivered"
  | "returned"
  | "failed"
  | "cancelled";

export interface PrintJobError {
  code: string;
  message: string;
}

const TERMINAL_PHASES: ReadonlySet<PrintJobPhase> = new Set([
  "delivered",
  "returned",
  "failed",
  "cancelled",
]);

function serverStatusToPhase(s: PrintJobServerStatus): PrintJobPhase {
  switch (s) {
    case "draft":
      return "submitting";
    case "submitted":
      return "submitted";
    case "accepted":
      return "accepted";
    case "in_production":
    case "printed":
      return "producing";
    case "mailed":
      return "mailed";
    case "delivered":
      return "delivered";
    case "returned":
      return "returned";
    case "failed":
      return "failed";
  }
}

export function usePrintJob() {
  const phase = ref<PrintJobPhase>("idle");
  const jobId = ref<string | null>(null);
  const status = ref<PrintJobServerStatus | null>(null);
  const partnerOrderId = ref<string | null>(null);
  const error = ref<PrintJobError | null>(null);
  const existingJobId = ref<string | null>(null);

  let runId = 0;

  async function _poll(thisRun: number, delayMs: number): Promise<void> {
    const startedAt = Date.now();
    let nextDelay = delayMs;

    while (runId === thisRun) {
      if (Date.now() - startedAt > POLL_DEADLINE_MS) {
        phase.value = "failed";
        error.value = {
          code: "POLL_TIMEOUT",
          message:
            "Status check took longer than 2 minutes. The job may still progress — refresh to recheck.",
        };
        return;
      }

      await new Promise((r) => setTimeout(r, nextDelay));
      if (runId !== thisRun || jobId.value === null) return;

      let snap: PrintJobStatus;
      try {
        snap = await getPrintJob(jobId.value);
      } catch (e: any) {
        phase.value = "failed";
        error.value = {
          code: e?.status ? `HTTP_${e.status}` : "NETWORK_ERROR",
          message:
            e?.data?.message || e?.message || "Could not reach the server.",
        };
        return;
      }
      if (runId !== thisRun) return;

      status.value = snap.status;
      partnerOrderId.value = snap.partnerOrderId;
      const next = serverStatusToPhase(snap.status);
      phase.value = next;
      if (TERMINAL_PHASES.has(next) || next === "accepted") return;

      nextDelay = Math.min(
        Math.round(nextDelay * POLL_BACKOFF_MULT),
        POLL_MAX_MS,
      );
    }
  }

  /**
   * POST /api/print_jobs/submit then start polling status. Idempotency is
   * server-fingerprint based — same inputs return 409 with `existing_job_id`,
   * which surfaces on the `existingJobId` ref so the caller can navigate to
   * the prior job's status panel rather than block on a duplicate. Other
   * 4xx/5xx surface as a `phase: "failed"` + `error` per brief §U.4 mapping.
   */
  async function submit(
    inputs: PrintJobSubmitInputs,
  ): Promise<PrintJobPhase> {
    runId += 1;
    const thisRun = runId;
    jobId.value = null;
    status.value = null;
    partnerOrderId.value = null;
    error.value = null;
    existingJobId.value = null;
    phase.value = "submitting";

    let started;
    try {
      started = await submitPrintJob(inputs);
    } catch (e: any) {
      phase.value = "failed";
      const httpStatus = e?.status ?? 0;
      const data = e?.data ?? {};
      const code = (data?.code as string | undefined) ?? "";

      if (httpStatus === 409 && data?.existing_job_id) {
        existingJobId.value = data.existing_job_id as string;
      }

      error.value = {
        code:
          httpStatus === 400 && code === "campaign_empty"
            ? "CAMPAIGN_EMPTY"
            : httpStatus === 403 && code === "membership_inactive"
              ? "MEMBERSHIP_INACTIVE"
              : httpStatus === 409 && code === "idempotency_conflict"
                ? "IDEMPOTENCY_CONFLICT"
                : httpStatus === 409 && code === "idempotency_replay_vanished"
                  ? "IDEMPOTENCY_REPLAY_VANISHED"
                  : httpStatus === 422 && code === "recipient_missing_field"
                    ? "RECIPIENT_MISSING_FIELD"
                    : httpStatus === 502 && code === "partner_rejected"
                      ? "PARTNER_REJECTED"
                      : httpStatus === 502 &&
                          code === "partner_unavailable_after_retry"
                        ? "PARTNER_UNAVAILABLE"
                        : httpStatus
                          ? `HTTP_${httpStatus}`
                          : "NETWORK_ERROR",
        message:
          (data?.message as string | undefined) ||
          e?.message ||
          "Could not submit print job.",
      };
      return phase.value;
    }
    if (runId !== thisRun) return phase.value;

    jobId.value = started.jobId;
    status.value = started.status;
    partnerOrderId.value = started.partnerOrderId;
    phase.value = serverStatusToPhase(started.status);
    if (TERMINAL_PHASES.has(phase.value) || phase.value === "accepted") {
      return phase.value;
    }

    await _poll(thisRun, POLL_INITIAL_MS);
    return phase.value;
  }

  /**
   * Begin polling an already-submitted job (deep-link / refresh path).
   */
  async function watch(id: string): Promise<PrintJobPhase> {
    runId += 1;
    const thisRun = runId;
    jobId.value = id;
    status.value = null;
    partnerOrderId.value = null;
    error.value = null;
    existingJobId.value = null;
    phase.value = "submitted";

    await _poll(thisRun, POLL_INITIAL_MS);
    return phase.value;
  }

  function cancel(): void {
    if (TERMINAL_PHASES.has(phase.value) || phase.value === "accepted") return;
    runId += 1;
    phase.value = "cancelled";
  }

  onBeforeUnmount(() => {
    runId += 1;
  });

  return {
    phase,
    jobId,
    status,
    partnerOrderId,
    error,
    existingJobId,
    submit,
    watch,
    cancel,
  };
}
