// src/composables/useAiGenerate.ts
//
// S90: "Generate with AI" button (StepDesign toolbar). Composes the S89
// scrape/regen primitives into a single click: resolve a website (asking
// for one if there isn't one yet), make sure it's been scanned, then
// (re)generate the card sequence from the freshest brand kit. Lives in its
// own composable — not inline in StepDesign.vue — so the state machine is
// unit-testable without mounting the whole step.
//
// This flow always OWNS the scrape run it kicks off: unlike the passive
// Business Info rescan (which lets useScrapeRegenWatcher decide whether to
// auto-refresh or prompt), a click here means the customer explicitly asked
// for new cards right now. Ownership is expressed via claimScrapeRun():
// a pre-scan disarm alone loses the race — the watcher re-arms on the
// → "scraping" transition this flow's own rescan causes, and its settle
// handler runs on the status write, before waitForScrapeSettled's 300ms
// poll can observe the settle. The claim keeps the watcher from arming at
// all; the watcher releases it when the run settles, and the finally here
// releases it if the scan never started.
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import {
  claimScrapeRun,
  releaseScrapeRunClaim,
} from "@/composables/scrapeRegenState";

const SUCCESS_MS = 2000;

export function useAiGenerate() {
  const auth = useAuthStore();
  const brandKitStore = useBrandKitStore();
  const draftStore = useCampaignDraftStore();

  const showWebsiteModal = ref(false);
  const websiteInput = ref("");
  const websiteModalError = ref<string | null>(null);
  const savingWebsite = ref(false);

  const showConfirmModal = ref(false);

  const justSucceeded = ref(false);
  let successTimer: ReturnType<typeof setTimeout> | null = null;

  const isScanning = computed(
    () => brandKitStore.brandKit?.scrapeStatus === "scraping",
  );
  // isGeneratingCards() reads a non-reactive module flag — wrapping it in a
  // computed would cache the first read FOREVER (zero reactive deps, never
  // invalidates; see the store's own comment on it). `running` is this
  // composable's reactive mirror for its own flows; the raw action is still
  // read inline in handleClick to guard against generations started
  // elsewhere (the passive watcher, goal changes).
  const running = ref(false);
  const busy = computed(() => isScanning.value || running.value);

  const label = computed(() => {
    if (isScanning.value) return "Scanning your website…";
    if (running.value) return "Generating…";
    if (justSucceeded.value) return "Done ✓";
    return "✨ Generate with AI";
  });

  /** A "real" prior scan — enough to skip straight to regeneration rather
   * than rescanning. scrapeStatus alone isn't sufficient: a kit can be
   * "complete" from server defaults with no extraction ever having run. */
  function hasRealScan(): boolean {
    const kit = brandKitStore.brandKit;
    if (!kit) return false;
    const status = kit.scrapeStatus;
    if (status !== "complete" && status !== "partial") return false;
    return brandKitStore.extractionSources.length > 0;
  }

  function flashSuccess() {
    justSucceeded.value = true;
    if (successTimer) clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      justSucceeded.value = false;
    }, SUCCESS_MS);
  }

  async function regenerate() {
    if (draftStore.draft?.designUserEdited) {
      showConfirmModal.value = true;
      return;
    }
    running.value = true;
    try {
      await draftStore.generateCardsForDraft();
      flashSuccess();
    } finally {
      running.value = false;
    }
  }

  async function confirmRegenerate() {
    showConfirmModal.value = false;
    running.value = true;
    try {
      await draftStore.generateCardsForDraft();
      flashSuccess();
    } finally {
      running.value = false;
    }
  }

  function cancelConfirm() {
    showConfirmModal.value = false;
  }

  /** Scan-then-regenerate: this call owns the run end to end via
   * claimScrapeRun() — the passive watcher never arms for a claimed run
   * (see scrapeRegenState.ts for why disarming alone loses the race) and
   * releases the claim itself at settle; the finally covers a rescan that
   * throws before any run starts. Failed/timed-out scans still proceed to
   * regenerate — fallback content beats nothing, and WizardShell's existing
   * failed strip already tells the customer why. */
  async function scanThenRegenerate(url: string) {
    claimScrapeRun();
    try {
      await brandKitStore.rescan(url);
      await brandKitStore.waitForScrapeSettled();
    } finally {
      releaseScrapeRunClaim();
    }
    await regenerate();
  }

  async function handleClick() {
    // Belt-and-suspenders: the button is already disabled while busy, but a
    // stray double-click event landing between disable and re-render must
    // still be a no-op rather than a second concurrent run. The raw action
    // read also catches generations started OUTSIDE this composable.
    if (busy.value || draftStore.isGeneratingCards()) return;
    if (import.meta.env.VITE_SKIP_AUTH === "true") return;
    if (!auth.hasPostcards) return;

    const url = (brandKitStore.brandKit?.websiteUrl ?? "").trim();
    if (!url) {
      websiteInput.value = "";
      websiteModalError.value = null;
      showWebsiteModal.value = true;
      return;
    }

    if (hasRealScan()) {
      await regenerate();
      return;
    }

    await scanThenRegenerate(url);
  }

  async function submitWebsiteModal() {
    // Accept anything non-empty without spaces — the server normalizes
    // scheme-less input, so over-validating here just rejects valid input
    // the backend would have happily cleaned up.
    const trimmed = websiteInput.value.trim();
    if (!trimmed || /\s/.test(trimmed)) {
      websiteModalError.value = "Enter a website address";
      return;
    }
    websiteModalError.value = null;
    savingWebsite.value = true;
    try {
      await brandKitStore.update({ websiteUrl: trimmed });
      if (brandKitStore.error) {
        websiteModalError.value = brandKitStore.error;
        return;
      }
      showWebsiteModal.value = false;
      // A freshly-saved URL has never been scanned under this composable's
      // watch, even if some OTHER kit happened to look "complete" already —
      // always take the scan path here.
      await scanThenRegenerate(trimmed);
    } finally {
      savingWebsite.value = false;
    }
  }

  function cancelWebsiteModal() {
    showWebsiteModal.value = false;
    websiteModalError.value = null;
  }

  return {
    label,
    busy,
    showWebsiteModal,
    websiteInput,
    websiteModalError,
    savingWebsite,
    showConfirmModal,
    handleClick,
    submitWebsiteModal,
    cancelWebsiteModal,
    confirmRegenerate,
    cancelConfirm,
  };
}
