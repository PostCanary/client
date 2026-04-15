// src/composables/useRenderJob.ts
//
// Phase 4D task 27 — polling composable for render jobs.
//
// Caller pattern (StepDesign.vue task 28, StepReview.vue task 29):
//
//   const { state, cards, error, start, cancel } = useRenderJob();
//   await start(draftId);
//   // → state goes through "queued" → "rendering" → "done" | "failed"
//   // → on done, `cards` holds [{cardNumber, downloadUrl}, ...]
//   // → on failed, `error` holds {code, message}
//
// Polling cadence: exponential backoff 1s → 8s cap (PLAN.md v6 task 27).
// Hard ceiling at 120s wall-time so a stuck-rendering job doesn't poll
// forever (matches the orchestrator's stale_at = started + 60s reaper +
// some slack for the next poll iteration).
//
// Cancel: explicit `cancel()` aborts the loop (used by component
// unmount + onBeforeRouteLeave). The caller should NOT keep using the
// state ref after cancel() — it freezes at whatever phase it was in.

import { ref, onBeforeUnmount } from "vue";
import {
  generatePreview,
  getRenderJob,
  type RenderJobCard,
  type RenderJobStatus,
} from "@/api/renderJobs";

const POLL_INITIAL_MS = 1000;
const POLL_MAX_MS = 8000;
const POLL_BACKOFF_MULT = 1.6;
const POLL_DEADLINE_MS = 120_000;

export type RenderJobPhase =
  | "idle"
  | "starting"
  | "queued"
  | "rendering"
  | "done"
  | "failed"
  | "cancelled";

export interface RenderJobError {
  code: string;
  message: string;
}

export function useRenderJob() {
  const phase = ref<RenderJobPhase>("idle");
  const jobId = ref<string | null>(null);
  const progress = ref<{ completed: number; total: number } | null>(null);
  const cards = ref<RenderJobCard[]>([]);
  const error = ref<RenderJobError | null>(null);

  // Cancellation is implemented via a generation counter: each `start()`
  // bumps the counter; the inner poll loop captures its starting value
  // and aborts as soon as the live counter changes. Cleaner than
  // racing setTimeout handles and survives Vue's HMR resets.
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
            "Render took longer than 2 minutes. The job may still finish — refresh to check.",
        };
        return;
      }

      await new Promise((r) => setTimeout(r, nextDelay));
      if (runId !== thisRun || jobId.value === null) return;

      let snap: RenderJobStatus;
      try {
        snap = await getRenderJob(jobId.value);
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

      progress.value = snap.progress;

      if (snap.status === "done") {
        cards.value = snap.cards;
        phase.value = "done";
        return;
      }
      if (snap.status === "failed") {
        error.value = snap.error ?? {
          code: "UNKNOWN",
          message: "Render failed.",
        };
        phase.value = "failed";
        return;
      }

      // queued or rendering — keep polling. Surface the phase change to
      // the UI so the loader can swap copy from "Queued..." to
      // "Rendering...". Backoff curves toward the 8s cap.
      phase.value = snap.status;
      nextDelay = Math.min(
        Math.round(nextDelay * POLL_BACKOFF_MULT),
        POLL_MAX_MS,
      );
    }
  }

  /**
   * Kick off a preview render for the given draft and start polling.
   * Resets all reactive state. Subsequent calls cancel the previous
   * run (only one render in flight per composable instance at a time).
   *
   * Returns a Promise that resolves when the job reaches a terminal
   * phase (done, failed, or cancelled). The caller can await it OR
   * just react to the refs; both are valid.
   */
  async function start(draftId: string): Promise<RenderJobPhase> {
    runId += 1;
    const thisRun = runId;
    jobId.value = null;
    progress.value = null;
    cards.value = [];
    error.value = null;
    phase.value = "starting";

    let kickoff;
    try {
      kickoff = await generatePreview(draftId);
    } catch (e: any) {
      // 409 means a pending job already exists. Server response body
      // doesn't include the existing job id (intentional — could leak
      // state across orgs in a future schema), so we surface a friendly
      // message and let the caller retry from the dashboard. 422 / 400
      // / 429 each have specific user actions.
      phase.value = "failed";
      const status = e?.status ?? 0;
      error.value = {
        code: status === 409
          ? "PENDING_JOB_EXISTS"
          : status === 422
            ? "BRAND_KIT_INCOMPLETE"
            : status === 400
              ? "DESIGN_INCOMPLETE"
              : status === 429
                ? "RATE_LIMITED"
                : status
                  ? `HTTP_${status}`
                  : "NETWORK_ERROR",
        message:
          e?.data?.message || e?.message || "Could not start render.",
      };
      return phase.value;
    }
    if (runId !== thisRun) return phase.value;

    jobId.value = kickoff.jobId;
    phase.value = "queued";

    // Start with a delay tuned to the orchestrator's typical first-poll
    // sweet spot: render usually completes in 200-500ms per card, but
    // we don't want to hammer the server in the first second.
    const initialDelay = Math.min(POLL_INITIAL_MS, kickoff.etaSeconds * 100);
    await _poll(thisRun, initialDelay);
    return phase.value;
  }

  function cancel(): void {
    if (phase.value === "done" || phase.value === "failed") return;
    runId += 1;
    phase.value = "cancelled";
  }

  onBeforeUnmount(() => {
    runId += 1;
  });

  return {
    phase,
    jobId,
    progress,
    cards,
    error,
    start,
    cancel,
  };
}
