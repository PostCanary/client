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

// Returns null for unknown server states (e.g. server adds a 10th status
// ahead of a client deploy). Callers MUST handle null by setting phase to
// "failed" + an UNKNOWN_SERVER_STATUS diagnostic (S332 Codex strike-1
// MEDIUM-1; prevents silent `phase = undefined` during version skew).
function serverStatusToPhase(s: string): PrintJobPhase | null {
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
    default:
      return null;
  }
}

export function usePrintJob() {
  const phase = ref<PrintJobPhase>("idle");
  const jobId = ref<string | null>(null);
  const status = ref<string | null>(null);
  const partnerOrderId = ref<string | null>(null);
  const error = ref<PrintJobError | null>(null);
  const existingJobId = ref<string | null>(null);

  let runId = 0;

  // S355 — strike-1 fold:
  //   - HIGH-1: `stopAtAccepted` distinguishes submit-flow (true; success-on-
  //     accepted is the U.4 contract) from status-page watch (false; must
  //     continue past accepted through producing/mailed/delivered/terminal).
  //   - MEDIUM-2: `initialDelayMs=0` runs the first GET immediately (deep-
  //     link path), then the loop ramps to POLL_INITIAL_MS so subsequent
  //     polls follow normal exp backoff.
  async function _poll(
    thisRun: number,
    initialDelayMs: number,
    stopAtAccepted: boolean,
  ): Promise<void> {
    const startedAt = Date.now();
    let nextDelay = initialDelayMs;

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
        if (runId !== thisRun) return;
        // S382 strike-1 HIGH fold: route axios timeouts to POLL_TIMEOUT for
        // consistent UX. Hung-request (axios aborts at 60s with ECONNABORTED)
        // and stalled-polling (loop deadline check at line 119) now surface
        // the same banner copy. Codex thread 019ddaba.
        if (e?.code === "ECONNABORTED") {
          phase.value = "failed";
          error.value = {
            code: "POLL_TIMEOUT",
            message:
              "Status check took longer than expected. The job may still progress — refresh to recheck.",
          };
          return;
        }
        const httpStatus = e?.status ?? 0;
        const data = e?.data ?? {};
        const errCode = (data?.error as string | undefined) ?? "";
        phase.value = "failed";
        error.value = {
          code:
            httpStatus === 403 && errCode === "membership_inactive"
              ? "MEMBERSHIP_INACTIVE"
              : httpStatus === 404 && errCode === "not_found"
                ? "NOT_FOUND"
                : httpStatus
                  ? `HTTP_${httpStatus}`
                  : "NETWORK_ERROR",
          message:
            (data?.message as string | undefined) ||
            e?.message ||
            "Could not reach the server.",
        };
        return;
      }
      if (runId !== thisRun) return;

      status.value = snap.status;
      partnerOrderId.value = snap.partnerOrderId;
      const next = serverStatusToPhase(snap.status);
      if (next === null) {
        phase.value = "failed";
        error.value = {
          code: "UNKNOWN_SERVER_STATUS",
          message: `Unrecognized server status: ${snap.status}`,
        };
        return;
      }
      phase.value = next;
      if (TERMINAL_PHASES.has(next) || (stopAtAccepted && next === "accepted"))
        return;

      // 0-delay first-tick path (status-page deep-link) ramps to
      // POLL_INITIAL_MS for subsequent ticks so backoff math behaves.
      nextDelay =
        nextDelay === 0
          ? POLL_INITIAL_MS
          : Math.min(
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
      if (runId !== thisRun) return phase.value;
      const httpStatus = e?.status ?? 0;
      const data = e?.data ?? {};
      // Server's canonical code lives at `data.error`; `data.code` is only
      // adapter-specific detail on `partner_rejected` (S332 Codex strike-1
      // HIGH-1; verified against `app/blueprints/print_jobs.py::_error_response`).
      const code = (data?.error as string | undefined) ?? "";

      if (httpStatus === 409 && data?.existing_job_id) {
        existingJobId.value = data.existing_job_id as string;
      }

      phase.value = "failed";
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
    const startedPhase = serverStatusToPhase(started.status);
    if (startedPhase === null) {
      phase.value = "failed";
      error.value = {
        code: "UNKNOWN_SERVER_STATUS",
        message: `Unrecognized server status: ${started.status}`,
      };
      return phase.value;
    }
    phase.value = startedPhase;
    if (TERMINAL_PHASES.has(phase.value) || phase.value === "accepted") {
      return phase.value;
    }

    await _poll(thisRun, POLL_INITIAL_MS, true);
    return phase.value;
  }

  /**
   * Begin polling an already-submitted job (deep-link / refresh path).
   * Per S355 strike-1 fold: first poll fires immediately so deep-linked
   * already-failed/delivered jobs don't flash "submitted" while waiting
   * POLL_INITIAL_MS, and polling continues past `accepted` through the
   * full producing → mailed → delivered timeline (only terminal stops).
   */
  async function watch(id: string): Promise<PrintJobPhase> {
    runId += 1;
    const thisRun = runId;
    jobId.value = id;
    status.value = null;
    partnerOrderId.value = null;
    error.value = null;
    existingJobId.value = null;
    // S357 strike-2 fold (Codex MEDIUM-1 conf-89): do NOT seed a non-idle
    // phase before the first GET resolves. `_poll(initialDelayMs=0)` still
    // defers the fetch by one macrotask via `await setTimeout(r, 0)`, so a
    // seed of "submitted" can paint for at least one frame on deep-links to
    // already-failed/delivered/returned jobs. Stay in "idle" (PHASE_COPY
    // renders "Loading…") until the first server snapshot arrives.
    phase.value = "idle";

    await _poll(thisRun, 0, false);
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
