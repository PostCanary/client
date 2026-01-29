// src/composables/useRunData.ts
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { storeToRefs } from "pinia";
import { useLoader } from "@/stores/loader";
import { useRunStore } from "@/stores/useRunStore";
import {
  getLatestRunStatus,
  getLatestRunResult,
  getLatestRunMatches,
  type RunStatus,
  type RunRequirement,
} from "@/api/runs";

const POLL_DELAY_MS = 1000;
const POLL_MAX_TICKS = 240;

// IMPORTANT: tolerate early 204s longer so polling doesn’t “die immediately”
const MAX_NULL_TICKS = 60;

// After run hits DONE, we may keep “geocode phase” going briefly.
const GEOCODE_MAX_TICKS = 120; // ~2 min at 1s
const GEOCODE_ACTIVE_WINDOW_MS = 30_000; // consider “active” if updated in last 30s

// /runs/latest/* supports require=done (per your api.py)
const REQUIRE_DONE: RunRequirement = "done";

const MONTH_ABBR = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

type CityRow = { city: string; total: number; rate: string };
type ZipRow = { zip: string; total: number; rate: string };

export type SummaryRow = {
  mail_address1: string;
  crm_address1: string;
  city: string;
  state: string;
  zip: string;
  mail_dates: string;
  crm_date: string;
  job_value: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—";
  const x = v <= 1 ? v * 100 : v;
  return `${x.toFixed(1)}%`;
}

function fmtMoney(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtDates(arr: string[] | null | undefined): string {
  if (!arr || !arr.length) return "";
  return arr.join(", ");
}

function isDone(s: RunStatus | null): boolean {
  const st = String((s as any)?.status || "").toLowerCase();
  const step = String((s as any)?.step || "").toLowerCase();
  return st === "done" || step === "done";
}

function isFailed(s: RunStatus | null): boolean {
  const st = String((s as any)?.status || "").toLowerCase();
  const step = String((s as any)?.step || "").toLowerCase();
  return st === "failed" || step === "failed";
}

function parseIsoMs(v: any): number | null {
  const s = typeof v === "string" ? v : "";
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function geocodeOverallPct(s: any): number {
  const g = s?.geocoding;
  const p = Number(g?.overall_pct ?? 0);
  return Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0;
}

function geocodeStatus(s: any): string {
  return String(s?.geocoding?.status || "").toLowerCase();
}

function geocodingLooksActive(s: any, windowMs = GEOCODE_ACTIVE_WINDOW_MS): boolean {
  const g = s?.geocoding;
  if (!g) return false;

  // If backend says "missing", there’s nothing to wait on.
  const st = geocodeStatus(s);
  if (st === "missing") return false;

  const lastMs = parseIsoMs(g.last_updated_at);
  if (!lastMs) return false;

  return Date.now() - lastMs <= windowMs;
}

// Reserve 90..100 for geocoding progress so it feels like a “final phase”
function geocodeLoaderProgress(s: any): number {
  const pct = geocodeOverallPct(s);
  return Math.round(90 + pct * 0.1);
}

// Friendly label fallback (backend message should usually be best)
function statusLabel(s: RunStatus | null): string {
  const msg = String((s as any)?.message || "").trim();

  // Keep message for non-terminal phases; for done phase we may override with geocoding label.
  if (msg && !isDone(s)) return msg;

  // Run is done, but geocoding still actively updating → show geocoding
  if (s && isDone(s) && geocodingLooksActive(s)) {
    const gp = geocodeOverallPct(s);
    return gp > 0 ? `Geocoding addresses… (${gp}%)` : "Geocoding addresses…";
  }

  const step = String((s as any)?.step || "").toLowerCase();
  if (step === "starting") return "Starting run…";
  if (step === "matching") return "Linking Mail ↔ CRM…";
  if (step === "aggregating") return "Aggregating results…";
  if (step === "done") return "Run complete";
  if (step === "failed") return "Run failed";

  const st = String((s as any)?.status || "").toLowerCase();
  if (st === "queued") return "Queued…";
  if (st === "running") return "Working…";

  return "Working…";
}

// Avoid localStorage writes every tick unless status actually changed
function statusEquals(a: RunStatus | null, b: RunStatus | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    (a as any).run_id === (b as any).run_id &&
    (a as any).status === (b as any).status &&
    ((a as any).step ?? null) === ((b as any).step ?? null) &&
    ((a as any).pct ?? null) === ((b as any).pct ?? null) &&
    String((a as any).message ?? "") === String((b as any).message ?? "") &&
    ((a as any).updated_at ?? null) === ((b as any).updated_at ?? null) &&
    ((a as any).finished_at ?? null) === ((b as any).finished_at ?? null) &&

    // (Optional but helpful) include geocoding so UI updates during geocode phase
    JSON.stringify((a as any).geocoding ?? null) === JSON.stringify((b as any).geocoding ?? null)
  );
}

type PollOptions = {
  // kept for compatibility with callers, but ignored (latest-only backend)
  runId?: string | null;

  maxTicks?: number;
  intervalMs?: number;

  showLoader?: boolean;
  initialMessage?: string;
};

export function useRunData() {
  const loader = useLoader();

  // ---------------------------
  // Store-backed state (persists via localStorage)
  // ---------------------------
  const runStore = useRunStore();
  runStore.hydrate();

  const { status, runResult, matches } = storeToRefs(runStore);

  // non-persisted orchestration state
  const statusLoading = ref(false);
  const runResultLoading = ref(false);
  const matchesLoading = ref(false);
  const polling = ref(false);
  const error = ref<string | null>(null);

  // for UI/debug only
  const activeRunId = ref<string | null>((status.value as any)?.run_id ?? null);

  let pollToken = 0;

  function setActiveRunId(runId: string | null) {
    activeRunId.value = runId || null;
  }

  function setStatusIfChanged(s: RunStatus | null) {
    if (!statusEquals(status.value as any, s)) {
      runStore.setStatus(s as any);
    }
  }

  // ---------------------------
  // Internal: latest-only fetch helpers
  // ---------------------------
  async function fetchStatus(): Promise<RunStatus | null> {
    return await getLatestRunStatus();
  }

  async function fetchLatestDoneResultAndMatches(): Promise<{ r: any | null; m: any | null }> {
    const [r, m] = await Promise.all([
      getLatestRunResult(REQUIRE_DONE).catch(() => null),
      getLatestRunMatches(REQUIRE_DONE).catch(() => null),
    ]);
    return { r: r ?? null, m: m ?? null };
  }

  async function fetchResultAndMatches(): Promise<void> {
    runResultLoading.value = true;
    matchesLoading.value = true;

    try {
      const { r, m } = await fetchLatestDoneResultAndMatches();

      // IMPORTANT: don’t wipe persisted data if endpoints temporarily return 204/null.
      const nextMatches =
        m && Array.isArray((m as any).matches) ? (m as any).matches : undefined;

      // Only commit if we got something meaningful
      if (r || nextMatches !== undefined) {
        runStore.setResultAndMatches(r ?? null, nextMatches);
      }
    } finally {
      runResultLoading.value = false;
      matchesLoading.value = false;
    }
  }

  async function ensureLatestDoneVisible(maxAttempts = 24, delayMs = 450): Promise<void> {
    // Handles: run is done, but /latest/*?require=done returns 204 briefly.
    for (let i = 0; i < maxAttempts; i++) {
      const { r, m } = await fetchLatestDoneResultAndMatches();
      if (r && m) {
        const nextMatches = Array.isArray((m as any).matches) ? (m as any).matches : [];
        runStore.setResultAndMatches(r, nextMatches);
        return;
      }
      await sleep(delayMs);
    }
  }

  async function pollGeocodingPhase(myToken: number, intervalMs: number): Promise<RunStatus | null> {
    // We keep the loader open but unlocked; user can close manually.
    for (let j = 0; j < GEOCODE_MAX_TICKS; j++) {
      if (pollToken !== myToken) return null;

      let s2: RunStatus | null = null;
      statusLoading.value = true;
      try {
        s2 = await fetchStatus();
      } finally {
        statusLoading.value = false;
      }

      if (s2) {
        setStatusIfChanged(s2);
        setActiveRunId((s2 as any)?.run_id ?? null);

        // If geocoding is still actively updating, keep the loader “in geocoding phase”
        if (geocodingLooksActive(s2)) {
          loader.setProgress(geocodeLoaderProgress(s2));
          loader.setMessage(statusLabel(s2));
          await sleep(intervalMs);
          continue;
        }

        // geocoding stopped updating (even if overall_pct < 100)
        const finalPct = geocodeOverallPct(s2);
        loader.setProgress(100);
        loader.setMessage(finalPct > 0 ? `Run complete (geocoded ${finalPct}%)` : "Run complete");
        return s2;
      }

      await sleep(intervalMs);
    }

    // Safety: don’t hang forever
    return null;
  }

  // ---------------------------
  // Public API: one-shot refresh
  // ---------------------------
  async function refreshOnce(): Promise<void> {
    error.value = null;
    statusLoading.value = true;

    try {
      const s = await fetchStatus();
      setStatusIfChanged(s);
      setActiveRunId((s as any)?.run_id ?? null);

      // Always attempt to show latest DONE results if they exist
      await fetchResultAndMatches();
    } catch (e: any) {
      error.value = e?.message || "Failed to load run status";
    } finally {
      statusLoading.value = false;
    }
  }

  // Back-compat alias (so Dashboard can call `refresh`)
  const refresh = refreshOnce;

  // ---------------------------
  // Public API: poll to terminal + auto-populate data
  // ---------------------------
  async function pollUntilTerminal(opts: PollOptions = {}): Promise<RunStatus | null> {
    const {
      runId = null,
      maxTicks = POLL_MAX_TICKS,
      intervalMs = POLL_DELAY_MS,
      showLoader = true,
      initialMessage = "Analyzing…",
    } = opts;

    error.value = null;
    if (runId) setActiveRunId(runId);

    const myToken = ++pollToken;
    polling.value = true;

    let nullTicks = 0;
    let last: RunStatus | null = null;

    try {
      if (showLoader) {
        // Don’t reset (reset closes it). Lock + show only.
        loader.lock();
        loader.show({ progress: 3, message: initialMessage });
        await nextTick();
      }

      for (let i = 0; i < maxTicks; i++) {
        if (pollToken !== myToken) return null;

        statusLoading.value = true;
        let s: RunStatus | null = null;

        try {
          s = await fetchStatus();
          last = s;
          setStatusIfChanged(s);
          setActiveRunId((s as any)?.run_id ?? null);
        } finally {
          statusLoading.value = false;
        }

        // 204 window — tolerate
        if (!s) {
          nullTicks += 1;

          if (showLoader) {
            loader.setProgress(3);
            loader.setMessage(nullTicks <= 2 ? initialMessage : "Waiting for server…");
          }

          // Don’t “crash” early; just unlock and return null after a long tolerance.
          if (nullTicks >= MAX_NULL_TICKS) {
            error.value = "No active run found yet. Please try again.";
            if (showLoader) loader.unlock(); // user closes manually
            return null;
          }

          await sleep(intervalMs);
          continue;
        }

        nullTicks = 0;

        if (showLoader) {
          if (typeof (s as any).pct === "number") {
            loader.setProgress(Math.max(0, Math.min(100, (s as any).pct)));
          }
          loader.setMessage(statusLabel(s));
        }

        if (isFailed(s)) {
          error.value = (s as any).message || "Run failed";
          window.dispatchEvent(new CustomEvent("mt:run-failed", { detail: { status: s } }));

          if (showLoader) {
            loader.setProgress(100);
            loader.setMessage(error.value || "Run failed");
            loader.unlock(); // user closes manually
          }

          return s;
        }

        if (isDone(s)) {
          // Pull DONE data without requiring refresh
          await fetchResultAndMatches();
          await ensureLatestDoneVisible();

          window.dispatchEvent(
            new CustomEvent("mt:run-completed", { detail: { run_id: (s as any).run_id, status: s } })
          );

          if (showLoader) {
            // IMPORTANT: keep loader open, but unlock so user can close it
            loader.unlock();

            // If geocoding is still active, stay in a “geocode phase”
            if (geocodingLooksActive(s)) {
              loader.setProgress(Math.max(loader.progress, geocodeLoaderProgress(s)));
              loader.setMessage(statusLabel(s));

              const s2 = await pollGeocodingPhase(myToken, intervalMs);
              if (s2) return s2;
            }

            // If not active (or we timed out waiting), show completion anyway.
            const finalPct = geocodeOverallPct(s);
            loader.setProgress(100);
            loader.setMessage(finalPct > 0 ? `Run complete (geocoded ${finalPct}%)` : "Run complete");
          }

          return s;
        }

        await sleep(intervalMs);
      }

      error.value = "Run is taking longer than expected. Please try again.";
      if (showLoader) loader.unlock();
      return last;
    } catch (e: any) {
      error.value = e?.message || "Polling failed";
      if (showLoader) loader.unlock(); // never hide
      return last;
    } finally {
      if (pollToken === myToken) polling.value = false;
      try { loader.unlock(); } catch {}
      // never hide here
    }
  }

  function stopPolling() {
    pollToken++;
    polling.value = false;

    // IMPORTANT: never auto-hide; just unlock so the user can close
    try { loader.unlock(); } catch {}
  }

  onBeforeUnmount(() => stopPolling());

  // ---------------------------
  // View-model computed
  // ---------------------------
  const graphLabels = computed<string[]>(() => {
    const g = (runResult.value as any)?.graph;
    if (!g) return [];

    if (Array.isArray(g.labels) && g.labels.length) return g.labels;

    const months: string[] = g.months ?? [];
    return months.map((ym) => {
      const [, m] = String(ym).split("-");
      const idx = Number(m ?? "1") - 1;
      return MONTH_ABBR[idx] ?? String(ym);
    });
  });

  const graphMailNow = computed<number[]>(() => (runResult.value as any)?.graph?.mailers ?? []);
  const graphCrmNow = computed<number[]>(() => (runResult.value as any)?.graph?.jobs ?? []);
  const graphMatchNow = computed<number[]>(() => (runResult.value as any)?.graph?.matches ?? []);

  const mailPrev = computed<number[]>(() => (runResult.value as any)?.graph?.yoy?.mailers?.prev ?? []);
  const crmPrev = computed<number[]>(() => (runResult.value as any)?.graph?.yoy?.jobs?.prev ?? []);
  const matchPrev = computed<number[]>(() => (runResult.value as any)?.graph?.yoy?.matches?.prev ?? []);

  const graphRawMonths = computed<string[]>(() => (runResult.value as any)?.graph?.months ?? []);

  const topCityRows = computed<CityRow[]>(() => {
    const items = (runResult.value as any)?.top_cities ?? [];
    return items.map((c: any) => ({
      city: c.city ?? "",
      total: Number(c.matches ?? 0),
      rate: fmtPct(c.match_rate),
    }));
  });

  const topZipRows = computed<ZipRow[]>(() => {
    const items = (runResult.value as any)?.top_zips ?? [];
    return items.map((z: any) => {
      const rawZip =
        z.zip5 ??
        z.zip ??
        z.zip_code ??
        z.zipcode ??
        z.postal_code ??
        "";

      // Keep leading zeros if backend sends numbers
      const zip = rawZip == null ? "" : String(rawZip).padStart(5, "0");

      const total =
        Number(z.matches ?? z.total_matches ?? z.total ?? 0);

      const rate = fmtPct(z.match_rate ?? z.rate);

      return { zip, total, rate };
    });
  });

  const summaryRows = computed<SummaryRow[]>(() => {
    const rows = (matches.value as any) || [];
    if (!rows.length) return [];

    return rows.map((m: any) => ({
      mail_address1: m.mail_full_address ?? "",
      crm_address1: m.crm_full_address ?? "",
      city: m.mail_city || m.crm_city || "",
      state: m.state || m.mail_state || m.crm_state || "",
      zip: m.zip5 || m.mail_zip || m.crm_zip || "",
      mail_dates: fmtDates(m.matched_mail_dates),
      crm_date: m.crm_job_date ?? "",
      job_value: fmtMoney(m.job_value),
    }));
  });

  return {
    // state
    status,
    activeRunId,
    runResult,
    matches,

    statusLoading,
    runResultLoading,
    matchesLoading,
    polling,
    error,

    // api
    setActiveRunId,
    refreshOnce,
    refresh, // alias
    pollUntilTerminal,
    stopPolling,
    fetchResultAndMatches,

    // view-model
    graphLabels,
    graphMailNow,
    graphCrmNow,
    graphMatchNow,
    mailPrev,
    crmPrev,
    matchPrev,
    graphRawMonths,
    topCityRows,
    topZipRows,
    summaryRows,
  };
}