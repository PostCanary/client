<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useAuthStore } from "@/stores/auth";
import { useAiGenerate } from "@/composables/useAiGenerate";
import type {
  CardDesign,
  ColorOverride,
  DesignSelection,
  HeadlineLines,
  OfferStackItem,
  PhotoCrop,
  MapSettings,
  TemplateLayoutType,
} from "@/types/campaign";
import { joinHeadlineLines, splitHeadline } from "@/utils/headlineSplit";
import { deriveTeaser } from "@/composables/usePostcardGenerator";
import { getTemplateSetsForGoal, renderTemplateIdForLayout } from "@/data/templates";
import SequenceView from "@/components/design/SequenceView.vue";
import EditPanel from "@/components/design/EditPanel.vue";
import BackEditPanel from "@/components/design/BackEditPanel.vue";
import TemplateBrowser from "@/components/design/TemplateBrowser.vue";
import ZonePopover from "@/components/design/ZonePopover.vue";
import ContextDrawer from "@/components/design/ContextDrawer.vue";
import CanvasCoachMark from "@/components/design/CanvasCoachMark.vue";
import PhotoAdjustOverlay from "@/components/design/PhotoAdjustOverlay.vue";
import { usePhotoAdjust } from "@/composables/usePhotoAdjust";
import type { ZoneBox } from "@/composables/usePopoverAnchor";
import { normalizeCrop } from "@/utils/photoCrop";
import { mediaSrc } from "@/utils/mediaSrc";
import { useRenderJob } from "@/composables/useRenderJob";
import { useCardPreview } from "@/composables/useCardPreview";
import { useBackPreview } from "@/composables/useBackPreview";
import { useDesignKeyboard } from "@/composables/useDesignKeyboard";
import { previewCard } from "@/api/renderJobs";
import {
  editZonesFor,
  backEditZonesFor,
  type CardEditor,
  type EditZone,
} from "@/data/templateEditZones";
import { generateMapImage, getMediaFeaturesCached } from "@/api/brandKit";

const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const auth = useAuthStore();

// S90: "Generate with AI" toolbar button — composes the S89 scrape/regen
// primitives (rescan, waitForScrapeSettled, generateCardsForDraft) into one
// click. State machine lives in the composable so it's unit-testable.
const {
  label: aiGenerateLabel,
  busy: aiGenerateBusy,
  showWebsiteModal: showAiWebsiteModal,
  websiteInput: aiWebsiteInput,
  websiteModalError: aiWebsiteModalError,
  savingWebsite: aiSavingWebsite,
  showConfirmModal: showAiConfirmModal,
  handleClick: handleAiGenerateClick,
  submitWebsiteModal: submitAiWebsiteModal,
  cancelWebsiteModal: cancelAiWebsiteModal,
  confirmRegenerate: confirmAiRegenerate,
  cancelConfirm: cancelAiConfirm,
} = useAiGenerate({
  onBeforeRegenerate: handleAiRegenerateBefore,
  onAfterRegenerate: syncCardsAfterAiRegenerate,
});

// Phase 4D task 28: Generate Proof PDF via render-worker pipeline.
// Triggered after the customer is happy with the Vue preview — shows
// the actual print-ready PDF the renderer will produce. Lives below the
// editing surface so the iterate→preview→commit→render cycle stays in
// one screen.
const { phase: renderPhase, progress: renderProgress, cards: renderedCards,
        error: renderError, start: startRender } = useRenderJob();
const showProofPanel = ref(false);
const proofImages = ref<string[]>([]);
const proofRenderWarnings = ref<string[]>([]);
const BLOCKING_PROOF_WARNINGS = [
  "PHOTO_MISSING",
  "PHOTO_UNREACHABLE",
  "PHOTO_BLOCKED_BY_URL_GUARD",
  "LOGO_MISSING",
  "LOGO_UNREACHABLE",
  "LOGO_BLOCKED_BY_URL_GUARD",
  "QR_BLOCKED_BY_URL_GUARD",
  "HEADLINE_LINE_TRUNCATED",
  "CONTENT_OVERLONG_REGENERATE",
];

function invalidateProof() {
  proofImages.value.forEach((url) => {
    if (url) URL.revokeObjectURL(url);
  });
  proofImages.value = [];
  proofRenderWarnings.value = [];
  showProofPanel.value = false;
}

async function handleGenerateProof() {
  if (!draftStore.draft) return;
  if (applyBrandKitReviewDefaults()) {
    originalCards = cards.value.map((c) => JSON.parse(JSON.stringify(c)) as CardDesign);
    commitDesign();
  }
  showProofPanel.value = true;
  proofRenderWarnings.value = [];
  await draftStore.saveNow();

  // Fetch PNG previews for ALL cards using the same preview-card endpoint
  // that the editing surface uses (ONE RENDERING RULE).
  const totalCards = cards.value.length || 1;
  proofImages.value = [];
  const urls: string[] = [];

  for (let i = 1; i <= totalCards; i++) {
    try {
      // Session 54 Codex: previewCard now returns { blob, warnings } so
      // the composable/caller can surface render warnings. Proof panel
      // just needs the blob; log warnings for QA visibility.
      const result = await previewCard(draftStore.draft.id, i);
      urls.push(URL.createObjectURL(result.blob));
      if (result.warnings.length > 0) {
        proofRenderWarnings.value.push(
          ...result.warnings.map((warning) => `Card ${i}: ${warning}`),
        );
        console.warn(
          `[StepDesign] proof card ${i} render warnings:`,
          result.warnings,
        );
      }
    } catch {
      urls.push("");
    }
  }
  proofImages.value = urls;

  // Also kick off the PDF render for the download link
  await startRender(draftStore.draft.id);
}

const cards = ref<CardDesign[]>([]);
const activeCardIndex = ref(0);
const showTemplateBrowser = ref(false);
const currentLayout = ref<TemplateLayoutType>("full-bleed");

const draftIdRef = computed(() => draftStore.draft?.id);
const cardNumberRef = computed(() => activeCardIndex.value + 1);
const activeCard = computed(() => cards.value[activeCardIndex.value]);

// Click-to-edit: hotspot zones over the rendered preview, mapped from the
// active card's template geometry. Clicking one opens the matching editor
// in the EditPanel (requestedEditor is watched there; ts retriggers repeat
// clicks on the same zone).
const editZones = computed(() =>
  editZonesFor(
    activeCard.value?.renderTemplateId ?? null,
    activeCard.value?.cardPurpose ?? null,
  ),
);
const requestedEditor = ref<{ editor: CardEditor; ts: number } | null>(null);

// --- S79 Phase-2 contextual editing ----------------------------------------
// Front zone hotspots split into two tiers:
//   Tier 1 (popover): the small, common slot edits anchored at the card —
//     headline / offer / review / checklist / notice / tips / letter / map.
//   Tier 2 (drawer): the heavy editors — photo + colors + business.
// The drawer also opens from the toolbar (Photo / Colors / Business) and from
// the photo zone click.
const DRAWER_EDITORS = new Set<CardEditor>([
  "photo",
  "colors",
  "business",
  "back-style",
  "back-photo",
]);

// The currently-open anchored popover: which editor + which zone box it's
// anchored to. One at a time.
const popover = ref<{ editor: CardEditor; zone: EditZone } | null>(null);
// The currently-open drawer tab (null = collapsed).
type DrawerTab = "photo" | "colors" | "business" | "back-style";
const drawerTab = ref<DrawerTab | null>(null);

// The canvas region is the popover/drawer positioning container. The zone
// percentages are relative to the CARD IMAGE box (centered, narrower than the
// region), so the anchoring math needs both: the card box size + its offset
// within the region, plus the region bounds for clamping.
const canvasRegion = ref<HTMLElement | null>(null);
// The front and back card boxes need SEPARATE refs: the front surface stays
// mounted (v-show) behind the back view for the flip animation, and two
// elements sharing one ref name let the later-in-template (hidden, 0x0) front
// box win the binding — which fed degenerate geometry to every back-side
// anchor (adjust overlay invisible, chip under the page header, popovers
// clamped to the corner).
const frontCardBoxEl = ref<HTMLElement | null>(null);
const backCardBoxEl = ref<HTMLElement | null>(null);
const canvasViewport = ref({
  width: 1,
  height: 1,
  offsetX: 0,
  offsetY: 0,
  containerWidth: 1,
  containerHeight: 1,
});
function measureCanvas() {
  const region = canvasRegion.value;
  // Measure the card box of the side actually SHOWING — the other side's box
  // is either unmounted (back, v-if) or display:none (front, v-show) and
  // measures 0x0.
  const card = isBack.value ? backCardBoxEl.value : frontCardBoxEl.value;
  if (!region) return;
  const rr = region.getBoundingClientRect();
  if (card) {
    const cr = card.getBoundingClientRect();
    canvasViewport.value = {
      width: cr.width,
      height: cr.height,
      offsetX: cr.left - rr.left,
      offsetY: cr.top - rr.top,
      containerWidth: rr.width,
      containerHeight: rr.height,
    };
  } else {
    canvasViewport.value = {
      width: rr.width,
      height: rr.height,
      offsetX: 0,
      offsetY: 0,
      containerWidth: rr.width,
      containerHeight: rr.height,
    };
  }
}

// Open the right editor for a clicked zone (front or back). Drawer editors
// route to the drawer; everything else opens an anchored popover.
function openZone(zone: EditZone) {
  const editor = zone.editor;
  // S81: a photo / back-photo zone click enters ON-CANVAS adjust mode (direct
  // manipulation) instead of opening the photo drawer. If there's no photo yet
  // to position, fall through to the drawer so the user can pick one first.
  if (editor === "photo" || editor === "back-photo") {
    if (enterPhotoAdjust(zone)) return;
  }
  if (DRAWER_EDITORS.has(editor)) {
    popover.value = null;
    if (editor === "photo" || editor === "back-photo") drawerTab.value = "photo";
    else if (editor === "colors") drawerTab.value = "colors";
    else if (editor === "business") drawerTab.value = "business";
    else if (editor === "back-style") drawerTab.value = "back-style";
    // legacy EditPanel watch hook (kept for fallback/specs)
    requestedEditor.value = { editor, ts: Date.now() };
    return;
  }
  // Popover editor.
  drawerTab.value = null;
  popover.value = { editor, zone };
  requestedEditor.value = { editor, ts: Date.now() };
}

function openDrawer(tab: DrawerTab) {
  popover.value = null;
  drawerTab.value = tab;
}
function closeDrawer() {
  drawerTab.value = null;
}
function closePopover() {
  popover.value = null;
}

// The drawer's title + which section the hosted editor renders.
// (useDesignKeyboard is wired below, after activeSide/flipState are declared)
const drawerTitle = computed(() => {
  switch (drawerTab.value) {
    case "photo":
      return isBack.value ? "Back Photo" : "Photo";
    case "colors":
      return "Colors";
    case "business":
      return "Business Info";
    case "back-style":
      return "Back Style";
    default:
      return "";
  }
});
// Map the front drawer tab to the EditPanel section it should render.
const drawerFrontSection = computed(() => {
  switch (drawerTab.value) {
    case "photo":
      return "photo" as const;
    case "colors":
      return "colors" as const;
    case "business":
      return "business" as const;
    default:
      return null;
  }
});
// Map the back drawer tab to the BackEditPanel section it should render.
const drawerBackSection = computed(() => {
  switch (drawerTab.value) {
    case "photo":
      return "back-photo" as const;
    case "back-style":
      return "back-style" as const;
    case "business":
      // Business Info is read-only on the back; route to the style section
      // which surfaces the read-only block, plus offer a deep-link.
      return "back-style" as const;
    default:
      return null;
  }
});

// Back zone hotspots over the back PNG.
const backEditZones = computed(() =>
  backEditZonesFor(backContent.value?.backTemplateId ?? null),
);

// The popover label (for its header) from the active zone.
const popoverLabel = computed(() => popover.value?.zone.label ?? "");

// --- Hybrid live-edit overlay ----------------------------------------------
// The server PNG stays the ONLY card imagery (ONE RENDERING RULE, S67 —
// the Vue replica was rejected for looking different from the real render).
// While the customer types, the edited text appears instantly as a clearly
// transient overlay positioned by the zone geometry; the authoritative
// render reconciles ~2s later and the overlay clears.
const liveOverlay = ref<{ zone: "headline" | "offer"; text: string } | null>(null);
const lastEditAt = ref(0);

const liveOverlayZone = computed(() => {
  if (!liveOverlay.value) return null;
  return (
    editZones.value.find((z) => z.editor === liveOverlay.value!.zone) ?? null
  );
});

watch(activeCardIndex, () => {
  liveOverlay.value = null;
  // Close any open contextual editor when the surface under it changes.
  popover.value = null;
  drawerTab.value = null;
  // S81: the photo under the adjust overlay belongs to the old card — drop it.
  photoAdjust.exit();
});
// NOTE: the previewUrl reconciliation watch lives just below the
// useCardPreview destructure (declaration order).
const { previewUrl, loading: previewLoading, error: previewError, refresh: refreshPreview } = useCardPreview(
  draftIdRef,
  cardNumberRef,
  activeCard,
);
watch(previewUrl, (url) => {
  // Hybrid overlay reconciliation: a fresh render arriving after the
  // debounce window closed includes the latest text. (900ms = 600ms
  // debounce + slack; a render that raced a newer keystroke keeps the
  // overlay until its own follow-up render lands.)
  if (liveOverlay.value && Date.now() - lastEditAt.value > 900) {
    liveOverlay.value = null;
  }
  // S81 photo-adjust reconcile: the fresh PNG now carries the committed crop.
  // onRenderArrived drops the awaiting flag (the overlay can clear) only after
  // the debounce window closed; a render that raced a newer nudge keeps the
  // overlay until its own follow-up lands → no flicker, no waiting.
  if (url) photoAdjust.onRenderArrived();
  // Layout switch completes when the re-render lands.
  if (url && switchingLayout.value) {
    switchingLayout.value = false;
    if (switchingLayoutFallback) clearTimeout(switchingLayoutFallback);
  }
});

// --- Front/Back surface toggle (S76 Phase-5 + S79 Phase-3 flip) ------------
// activeSide: the user-facing selection ("which side am I on?").
// renderSide: what the canvas ACTUALLY renders — follows activeSide but lags
//   during the flip animation (swaps at the invisible 90° midpoint so no
//   wrong-side image ever shows). Outside the animation window they are equal.
// isBack: derived from renderSide (used by canvas, zone maps, drawer routing).
const activeSide = ref<"front" | "back">("front");
const renderSide = ref<"front" | "back">("front");
const isBack = computed(() => renderSide.value === "back");

// Canvas flip wrapper element ref (the div that carries the CSS animation).
const canvasFlipWrapperEl = ref<HTMLElement | null>(null);
// Current CSS class state for the flip wrapper.
const flipState = ref<"idle" | "flipping" | "flipped-in">("idle");
const flipWrapperClass = computed(() => ({
  "canvas-flip-wrapper": true,
  "is-flipping": flipState.value === "flipping",
  "is-flipped-in": flipState.value === "flipped-in",
}));

/**
 * Trigger the 3D CSS flip animation when activeSide changes.
 *
 *  1. Apply "is-flipping" → animates rotateY(0→90°) in 200ms
 *  2. On animationend (or 250ms safety timeout): swap renderSide (card is
 *     invisible at 90°), apply "is-flipped-in" → rotateY(-90°→0°) in 200ms
 *  3. On second animationend: back to idle. Total ≈ 400ms.
 *
 * prefers-reduced-motion: CSS declares animation:none so animationend fires
 * immediately — the swap is instant, no wrong side ever shows.
 */
function triggerFlip(newSide: "front" | "back") {
  if (flipState.value !== "idle") {
    // Another flip was already in progress — snap immediately.
    renderSide.value = newSide;
    flipState.value = "idle";
    return;
  }

  // Check for prefers-reduced-motion or no animation support (JSDOM, SSR).
  // When animations are disabled, snap the renderSide immediately.
  const wrapper = canvasFlipWrapperEl.value;
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  // In JSDOM, animation-name will be empty string (CSS never runs) — detect via
  // getComputedStyle. If the computed animationDuration is "0s" or absent,
  // treat as no-animation (tests + reduced-motion users get instant swap).
  const animated =
    !prefersReduced &&
    wrapper !== null &&
    (() => {
      try {
        const dur = window.getComputedStyle(wrapper).animationDuration;
        return dur && dur !== "0s";
      } catch {
        return false;
      }
    })();

  if (!animated) {
    // No animation: snap the side instantly (reduced-motion, JSDOM, no wrapper).
    renderSide.value = newSide;
    return;
  }

  flipState.value = "flipping";

  function onFlipInEnd() {
    flipState.value = "idle";
  }
  function onFlipOutEnd() {
    // At the invisible 90° midpoint: swap the rendered side.
    renderSide.value = newSide;
    flipState.value = "flipped-in";
    const safetyIn = setTimeout(onFlipInEnd, 250);
    const wrapperIn = canvasFlipWrapperEl.value;
    if (wrapperIn) {
      wrapperIn.addEventListener("animationend", () => {
        clearTimeout(safetyIn);
        onFlipInEnd();
      }, { once: true });
    }
  }

  const safetyOut = setTimeout(onFlipOutEnd, 250);
  if (wrapper) {
    wrapper.addEventListener("animationend", () => {
      clearTimeout(safetyOut);
      onFlipOutEnd();
    }, { once: true });
  } else {
    // Wrapper disappeared — snap.
    clearTimeout(safetyOut);
    renderSide.value = newSide;
  }
}

// Wire keyboard navigation (S79 Phase-3): ArrowLeft/Right, F, Esc.
// Declared here so all state refs (activeSide, popover, drawerTab) are already
// in scope. The composable self-registers on document in onMounted.
useDesignKeyboard({
  cardCount: () => cards.value.length,
  activeCardIndex: () => activeCardIndex.value,
  setActiveCardIndex: (i) => { activeCardIndex.value = i; },
  activeSide: () => activeSide.value,
  setActiveSide: (side) => { activeSide.value = side; },
  // S81: on-canvas adjust mode behaves like a popover-open state — arrow/F
  // card-cycling is suppressed and Esc dismisses it. We report it through
  // popoverOpen so the existing gate (and Esc-closes-popover-first) applies,
  // and route closePopover to exit adjust mode when it's the active overlay.
  popoverOpen: () => popover.value !== null || photoAdjust.active.value,
  drawerOpen: () => drawerTab.value !== null,
  closePopover: () => {
    if (photoAdjust.active.value) {
      exitPhotoAdjust();
      return;
    }
    closePopover();
  },
  closeDrawer,
});

// Flipping sides closes the contextual editors (their zones no longer exist)
// and triggers the 3D CSS flip animation (S79 Phase-3). The rendered side
// (`renderSide`) lags activeSide slightly while the card is in mid-flip.
watch(activeSide, (newSide) => {
  popover.value = null;
  drawerTab.value = null;
  // S81: front/back adjust overlays target different surfaces — exit on flip.
  photoAdjust.exit();
  triggerFlip(newSide);
  // The back/front canvases can differ in available height; re-measure after
  // the flip settles.
  void nextTick(measureCanvas);
});
// S77 BACK v2: the whole backContent of card 1 is editable. Re-render the back
// when ANY back field changes (style, subhead, benefits, testimonial,
// services, hours, guarantee).
const backContent = computed(() => cards.value[0]?.backContent ?? null);
const {
  previewUrl: backPreviewUrl,
  loading: backPreviewLoading,
  error: backPreviewError,
  refresh: refreshBackPreview,
} = useBackPreview(draftIdRef, backContent, isBack);

// S81: reconcile the back-photo adjust overlay against the fresh back render
// (same no-flicker handoff as the front previewUrl watch).
watch(backPreviewUrl, (url) => {
  if (url) photoAdjust.onRenderArrived();
});

function updateBack(patch: Partial<CardDesign["backContent"]>) {
  const card = cards.value[0];
  if (!card) return;
  invalidateProof();
  // The back is a per-draft surface; all back fields live on card 1's
  // backContent (the server reads backContent from card 1 for the back).
  replaceCardAt(0, {
    ...card,
    backContent: {
      ...card.backContent,
      ...patch,
    },
  });
  commitDesign();
}

const goalType = computed(() => draftStore.draft?.goal?.goalType ?? "neighbor_marketing");
const brandKit = computed(() => brandKitStore.brandKit);
// City is derived from brandKit.location which is "City, ST" — split on
// comma and take the first part. Used by PostcardBack for the "Serving
// {city} since {year}" local-proof line in the return-address strip.
const brandKitCity = computed(() => {
  const loc = brandKit.value?.location ?? "";
  return loc.split(",")[0]?.trim() ?? "";
});

// Credibility line for the front of the card. Prefers "Serving {city}
// since {year}" when we have both, falls back to certifications[0], then
// to a neutral default. Kept short so the top-row badge truncation
// (P0 #4) rarely needs to fire.
const brandKitCredibility = computed(() => {
  const bk = brandKit.value;
  if (!bk) return "Licensed & Insured";
  if (brandKitCity.value && bk.yearsInBusiness && bk.yearsInBusiness > 0) {
    const year = new Date().getFullYear() - bk.yearsInBusiness;
    return `Serving ${brandKitCity.value} since ${year}`;
  }
  if (bk.certifications && bk.certifications.length > 0) {
    return bk.certifications[0]!;
  }
  return "Licensed & Insured";
});

// Original cards for reset
let originalCards: CardDesign[] = [];

const cardsReady = computed(() => cards.value.length > 0);
const FALLBACK_REVIEW_QUOTES = new Set([
  "Professional, reliable service!",
  "Professional, reliable service",
]);
const FALLBACK_REVIEWER_NAMES = new Set(["A Happy Customer", ""]);

function applyBrandKitReviewDefaults(): boolean {
  const reviews = brandKit.value?.reviews ?? [];
  if (reviews.length === 0 || cards.value.length === 0) return false;

  let changed = false;
  cards.value = cards.value.map((card, idx) => {
    const overrideQuote = (card.overrides.reviewQuote ?? "").trim();
    const overrideReviewer = (card.overrides.reviewerName ?? "").trim();
    const hasCustomReviewOverride =
      (overrideQuote !== "" && !FALLBACK_REVIEW_QUOTES.has(overrideQuote)) ||
      (overrideReviewer !== "" && !FALLBACK_REVIEWER_NAMES.has(overrideReviewer));

    if (hasCustomReviewOverride) {
      return card;
    }

    const currentQuote = (card.resolvedContent.reviewQuote ?? "").trim();
    const currentReviewer = (card.resolvedContent.reviewerName ?? "").trim();
    const needsReview =
      FALLBACK_REVIEW_QUOTES.has(currentQuote) ||
      FALLBACK_REVIEWER_NAMES.has(currentReviewer);
    if (!needsReview) return card;

    const review = reviews[idx % reviews.length] ?? reviews[0];
    if (!review?.quote) return card;

    changed = true;
    return {
      ...card,
      resolvedContent: {
        ...card.resolvedContent,
        reviewQuote: review.quote,
        reviewerName: review.reviewerName || currentReviewer || "A Happy Customer",
      },
    };
  });

  return changed;
}

// S67 — Sequence thumbnails use the same server-rendered PNG as the main
// preview (ONE RENDERING RULE, mems 429/430). Previously SequenceView
// rendered thumbnails via the Vue-side PostcardPreview component, which
// produced a completely different-looking template than the render-
// worker output the customer actually sees. Drake caught the mismatch
// in S67. Fix = fetch PNG for every card on cardsReady and hand URLs
// through to SequenceView. Active-card thumbnail is kept in sync with
// the main preview via the `previewUrl` watch below so edits reflect
// immediately without re-fetching all cards.
const thumbnailUrls = ref<(string | null)[]>([]);
let thumbnailRevokeList: string[] = [];

function revokeThumbnailUrls() {
  for (const u of thumbnailRevokeList) URL.revokeObjectURL(u);
  thumbnailRevokeList = [];
}

// S70 — per-card fetch with exponential-ish backoff retries. Initial
// /preview-card/N calls often 400 because AI-generated card content
// hasn't finished persisting server-side yet (fresh draft). 4 attempts
// over ~12s gives the server time to catch up. Each thumbnail slot
// updates INDEPENDENTLY as soon as its own fetch resolves — no
// Promise.all blocking the whole row on the slowest card.
const THUMB_RETRY_DELAYS_MS = [1500, 3000, 6000];
const THUMB_MAX_ATTEMPTS = 4;

// The retry ladder masked a GUARANTEED first-attempt 400 on fresh drafts:
// generated cards land via setDesign + a 500ms debounced PUT, and the
// thumbnail fetches raced that save — the server had no cards yet
// ("Card N not found in draft" ×3 in the console on every new campaign;
// S82 QA fleet hit it in 4 of 7 walks). Hold the FIRST attempt until the
// store finishes persisting; the ladder stays as backstop for anything
// slower server-side. Times out into the normal retry path so a stuck
// save can't wedge the thumbnails.
async function waitForDraftPersisted(timeoutMs = 8000): Promise<void> {
  const start = Date.now();
  while (
    (draftStore.isDirty || draftStore.saving) &&
    Date.now() - start < timeoutMs
  ) {
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function fetchThumbnail(idx: number, attempt = 0): Promise<string | null> {
  if (attempt === 0) await waitForDraftPersisted();
  const id = draftStore.draft?.id;
  if (!id) return null;
  const cardNum = idx + 1;
  try {
    const result = await previewCard(id, cardNum);
    return URL.createObjectURL(result.blob);
  } catch (e) {
    if (attempt + 1 < THUMB_MAX_ATTEMPTS) {
      const delay = THUMB_RETRY_DELAYS_MS[attempt] ?? THUMB_RETRY_DELAYS_MS[THUMB_RETRY_DELAYS_MS.length - 1]!;
      await new Promise((r) => setTimeout(r, delay));
      return fetchThumbnail(idx, attempt + 1);
    }
    console.error(`[StepDesign] thumbnail card ${cardNum} failed after ${THUMB_MAX_ATTEMPTS} attempts:`, e);
    return null;
  }
}

// Updates ONE slot in thumbnailUrls + revoke list. Safe against the
// other slots being changed concurrently.
function writeThumbnailSlot(idx: number, url: string | null) {
  const current = [...thumbnailUrls.value];
  const old = current[idx];
  current[idx] = url;
  thumbnailUrls.value = current;
  if (url) thumbnailRevokeList.push(url);
  if (old) {
    URL.revokeObjectURL(old);
    thumbnailRevokeList = thumbnailRevokeList.filter((u) => u !== old);
  }
}

function fetchAllThumbnails() {
  if (!draftStore.draft?.id || cards.value.length === 0) return;
  // Reset slots so SequenceView re-shows the Loading spinner for any
  // previously-rendered card (e.g. after regenerate). Keeps UI honest.
  revokeThumbnailUrls();
  thumbnailUrls.value = new Array<string | null>(cards.value.length).fill(null);
  // Fire each fetch independently; each slot paints as it resolves.
  for (let idx = 0; idx < cards.value.length; idx++) {
    const thisIdx = idx;
    void fetchThumbnail(thisIdx).then((url) => {
      if (url) writeThumbnailSlot(thisIdx, url);
    });
  }
}

// Refresh a single thumbnail in-place (used by the watcher below when
// the user edits the active card — fresh fetch, not a blob copy).
async function refreshOneThumbnail(idx: number) {
  if (idx < 0 || idx >= cards.value.length) return;
  const url = await fetchThumbnail(idx);
  if (url !== null) writeThumbnailSlot(idx, url);
}

// neighborhood-map gate (S76): probed once so the auto-generate path and
// the TemplateBrowser know whether GEOAPIFY_API_KEY is set server-side.
const mapsConfigured = ref(false);

onMounted(() => {
  // Measure the canvas region for popover anchoring + keep it current on
  // resize (the popover math is pixel-based against this rect).
  void nextTick(measureCanvas);
  window.addEventListener("resize", measureCanvas);

  // ensureScraped(): fetch if needed + lazily run the website scrape for
  // orgs that onboarded before postcards access (S85 review finding).
  void brandKitStore.ensureScraped();

  // Fire-and-forget feature probe — never blocks the design step.
  getMediaFeaturesCached()
    .then((f) => {
      mapsConfigured.value = f.mapsConfigured;
    })
    .catch(() => {
      /* probe failure → layout stays gated off; no UX impact */
    });

  if (draftStore.draft?.design?.sequenceCards?.length) {
    cards.value = [...draftStore.draft.design.sequenceCards];
    currentLayout.value = draftStore.draft.design.templateLayoutType;
  }
  const appliedReviews = applyBrandKitReviewDefaults();
  originalCards = cards.value.map((c) => JSON.parse(JSON.stringify(c)) as CardDesign);
  if (appliedReviews) commitDesign({ source: "system" });
  fetchAllThumbnails();
});

onBeforeUnmount(() => {
  if (persistedPreviewRefreshTimer) clearTimeout(persistedPreviewRefreshTimer);
  revokeThumbnailUrls();
  invalidateProof();
  photoAdjust.dispose();
  window.removeEventListener("resize", measureCanvas);
});

// S70 — when the active card's main preview updates (edit or card
// switch), refetch THAT card's thumbnail as its own blob. Previously
// this watcher copied useCardPreview's `previewUrl` directly into the
// thumbnail slot — shared mutable state with conflicting lifecycles
// (useCardPreview owns + revokes that blob) caused the "Card N
// thumbnail briefly shows Card M's image" flash AND the stuck-on-
// wrong-card behavior Drake reported. Independent thumbnail blobs =
// no cross-ownership. Codex-reviewed (S70).
watch(previewUrl, (url) => {
  if (!url) return;
  refreshOneThumbnail(activeCardIndex.value);
});

// When cards change length (regenerated sequence), refetch all
// thumbnails. Covers "Try Different Template" and sequence-length
// changes from Step 1.
watch(
  () => cards.value.length,
  (n, prev) => {
    if (n !== prev && n > 0) fetchAllThumbnails();
  },
);


const PERSISTED_PREVIEW_REFRESH_MS = 650;
let persistedPreviewRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let persistedPreviewRefreshSeq = 0;

async function waitForDraftSaveIdle(timeoutMs = 10000) {
  const started = Date.now();
  while ((draftStore.saving || draftStore.isDirty) && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function queuePersistedPreviewRefresh() {
  const seq = ++persistedPreviewRefreshSeq;
  if (persistedPreviewRefreshTimer) clearTimeout(persistedPreviewRefreshTimer);
  persistedPreviewRefreshTimer = setTimeout(() => {
    persistedPreviewRefreshTimer = null;
    void (async () => {
      await draftStore.saveNow();
      await waitForDraftSaveIdle();
      if (seq !== persistedPreviewRefreshSeq) return;
      await refreshPreview();
      // S73 render-speed pass: the save above is awaited to idle BEFORE
      // the render, so the render already reflects the persisted draft.
      // The old unconditional sleep(1s) + save + second render added ~4s
      // to every reconcile. A second pass is only needed when the draft
      // went dirty again DURING the render without queueing a new cycle
      // (any normal edit re-queues and bumps seq, aborting this one).
      if (seq !== persistedPreviewRefreshSeq) return;
      if (!draftStore.saving && !draftStore.isDirty) return;
      await draftStore.saveNow();
      await waitForDraftSaveIdle();
      if (seq !== persistedPreviewRefreshSeq) return;
      await refreshPreview();
    })();
  }, PERSISTED_PREVIEW_REFRESH_MS);
}

function updateHeadlineLines(lines: HeadlineLines) {
  const card = activeCard.value;
  if (!card) return;
  invalidateProof();
  const joined = joinHeadlineLines(lines);
  liveOverlay.value = { zone: "headline", text: joined };
  lastEditAt.value = Date.now();
  replaceActiveCard({
    ...card,
    overrides: {
      ...card.overrides,
      headline: joined,
      headlineLines: { ...lines },
    },
    resolvedContent: {
      ...card.resolvedContent,
      headline: joined,
      headlineLines: { ...lines },
    },
  });
  commitDesign();
  queuePersistedPreviewRefresh();
}

// Checklist rows (S73, service-checklist layout). No live-text overlay —
// the checklist panel isn't an overlay zone; the authoritative render
// carries the change.
function updateServiceRows(rows: string[]) {
  const card = activeCard.value;
  if (!card) return;
  invalidateProof();
  lastEditAt.value = Date.now();
  replaceActiveCard({
    ...card,
    overrides: {
      ...card.overrides,
      serviceRows: [...rows],
    },
    resolvedContent: {
      ...card.resolvedContent,
      serviceRows: [...rows],
    },
  });
  commitDesign();
  queuePersistedPreviewRefresh();
}

// Offer coupon tiers (S74). Same shape as updateServiceRows: array
// override, authoritative render carries the change.
function updateOfferItems(items: OfferStackItem[]) {
  const card = activeCard.value;
  if (!card) return;
  invalidateProof();
  lastEditAt.value = Date.now();
  replaceActiveCard({
    ...card,
    overrides: {
      ...card.overrides,
      offerItems: items.map((tier) => ({ ...tier })),
    },
    resolvedContent: {
      ...card.resolvedContent,
      offerItems: items.map((tier) => ({ ...tier })),
    },
  });
  commitDesign();
  queuePersistedPreviewRefresh();
}

// Tips rows (S74 wave 3, tips-card layout).
function updateTips(tips: string[]) {
  const card = activeCard.value;
  if (!card) return;
  invalidateProof();
  lastEditAt.value = Date.now();
  replaceActiveCard({
    ...card,
    overrides: {
      ...card.overrides,
      tips: [...tips],
    },
    resolvedContent: {
      ...card.resolvedContent,
      tips: [...tips],
    },
  });
  commitDesign();
  queuePersistedPreviewRefresh();
}

// Industry switcher (S75 test tool): full re-generation so the cards
// demo the new trade end to end. Clearing local cards first lets the
// store→local sync watch (cards.value.length === 0 guard) pick up the
// fresh set when generation completes.
async function regenerateCards() {
  invalidateProof();
  liveOverlay.value = null;
  cards.value = [];
  await draftStore.generateCardsForDraft();
}

// "Generate with AI" toolbar button (useAiGenerate) follows the same
// clear-then-resync contract as regenerateCards() above, but the composable
// has no access to this component's local `cards` — it calls these two
// hooks instead. Passed to useAiGenerate() near the top of this file (the
// closures below are only invoked on click, long after these consts exist,
// so the earlier declaration order is fine).
function handleAiRegenerateBefore() {
  invalidateProof();
  liveOverlay.value = null;
  cards.value = [];
}

// Always runs once generateCardsForDraft() settles — the store swallows its
// own generation errors rather than rethrowing, so "the AI call failed" and
// "it succeeded" both just mean "read whatever is in the store now". On
// success that's the fresh cards; on failure the store never wrote past its
// early return, so this restores the pre-clear cards instead of leaving the
// editor blank.
function syncCardsAfterAiRegenerate() {
  const storeCards = draftStore.draft?.design?.sequenceCards ?? [];
  cards.value = [...storeCards];
  currentLayout.value = draftStore.draft?.design?.templateLayoutType ?? "full-bleed";
  if (activeCardIndex.value >= cards.value.length) {
    activeCardIndex.value = Math.max(0, cards.value.length - 1);
  }
  // Any open contextual editor was anchored to the pre-regenerate cards.
  popover.value = null;
  drawerTab.value = null;
  photoAdjust.exit();
  originalCards = cards.value.map((c) => JSON.parse(JSON.stringify(c)) as CardDesign);
}

function updateColors(colors: ColorOverride | null) {
  const card = activeCard.value;
  if (!card) return;
  invalidateProof();
  const next: CardDesign = { ...card };
  if (colors) {
    next.colorOverride = { ...colors };
  } else {
    delete next.colorOverride;
  }
  replaceActiveCard(next);
  commitDesign();
  queuePersistedPreviewRefresh();
}

function updateCardField(field: string, value: string) {
  const card = activeCard.value;
  if (!card) return;
  invalidateProof();
  // Instant feedback while the authoritative render catches up.
  if (field === "headline") {
    liveOverlay.value = { zone: "headline", text: value };
    lastEditAt.value = Date.now();
  } else if (field === "offerText") {
    liveOverlay.value = { zone: "offer", text: value };
    lastEditAt.value = Date.now();
  }
  const overrides: CardDesign["overrides"] = {
    ...card.overrides,
    [field]: value,
  };
  const resolvedContent: CardDesign["resolvedContent"] = {
    ...card.resolvedContent,
    [field]: value,
  };
  // A wholesale headline change (e.g. picking an AI candidate) re-seeds
  // the per-line slots so the line editor and the print stay in sync.
  if (field === "headline") {
    const seeded = splitHeadline(value);
    overrides.headlineLines = seeded;
    resolvedContent.headlineLines = seeded;
  }
  // When offerText changes, keep offerTeaser in sync so the front-of-card
  // badge doesn't show a stale teaser after the user edits the back offer.
  // (Fixes Codex Pass 2 HIGH finding — demo-visible contradiction.)
  if (field === "offerText") {
    resolvedContent.offerTeaser = deriveTeaser(
      value,
      goalType.value,
    );
  }
  replaceActiveCard({
    ...card,
    overrides,
    resolvedContent,
  });
  commitDesign();
  queuePersistedPreviewRefresh();
}

function updatePhoto(url: string) {
  const card = activeCard.value;
  if (!card) return;
  invalidateProof();
  replaceActiveCard({
    ...card,
    overrides: {
      ...card.overrides,
      photoUrl: url,
    },
    resolvedContent: {
      ...card.resolvedContent,
      photoUrl: url,
    },
  });
  commitDesign();
  queuePersistedPreviewRefresh();
}

// S80 photo positioning/cropping. `field` is one of photoCrop |
// beforePhotoCrop | afterPhotoCrop. `crop` undefined → reset (drop the
// override so the worker renders the cover-center default). Mirrors the
// override into resolvedContent so the orchestrator bridge picks it up.
function updateCrop(field: string, crop: PhotoCrop | undefined) {
  const card = activeCard.value;
  if (!card) return;
  invalidateProof();
  const overrides: CardDesign["overrides"] = { ...card.overrides };
  const resolvedContent: CardDesign["resolvedContent"] = {
    ...card.resolvedContent,
  };
  if (crop === undefined) {
    delete (overrides as Record<string, unknown>)[field];
    delete (resolvedContent as Record<string, unknown>)[field];
  } else {
    (overrides as Record<string, unknown>)[field] = crop;
    (resolvedContent as Record<string, unknown>)[field] = crop;
  }
  replaceActiveCard({ ...card, overrides, resolvedContent });
  commitDesign();
  queuePersistedPreviewRefresh();
}

// S80 persist the neighborhood-map view controls on the card so a Regenerate
// after reload reuses them. Stored on overrides.mapSettings only — the bridge
// ignores it (the worker consumes map_image_url); these are client/endpoint
// params. No preview refresh here: generateMap already emitted update-field
// mapImageUrl, which triggers the re-render.
function updateMapSettings(settings: MapSettings) {
  const card = activeCard.value;
  if (!card) return;
  replaceActiveCard({
    ...card,
    overrides: { ...card.overrides, mapSettings: settings },
  });
  commitDesign();
}

// --- S81 on-canvas photo position/crop -------------------------------------
// Dustin's S80 feedback: adjusting the photo in the side panel was slow (every
// nudge waited on a server re-render) and the mini-frame was small/hard to use.
// S81 moves positioning ONTO the canvas: clicking a photo zone enters an adjust
// mode that overlays the zone with a live, client-side crop (the text-overlay
// pattern). Pan/zoom are INSTANT (pure CSS); the crop persists on a debounce and
// the authoritative render reconciles WITHOUT flicker.
//
// onCommit routes the crop to the right persistence path:
//   - front main / before / after  → updateCrop (active card overrides)
//   - back-photo                    → updateBack (card 1 backContent.backPhotoCrop)
const photoAdjust = usePhotoAdjust({
  onCommit(field, crop) {
    if (field === "backPhotoCrop") {
      updateBack({ backPhotoCrop: crop });
    } else {
      updateCrop(field, crop);
    }
  },
  debounceMs: 800,
});

// Map a clicked PHOTO zone → the adjust target (field + photo src + zone rect +
// starting crop). The zone label/geometry already encodes the before/after half
// (split banner zones are left 0-50% / 50-100%), so the clicked zone alone
// disambiguates the slot — no separate photoSlot toggle needed on the canvas.
function photoAdjustTargetForZone(zone: EditZone) {
  const card = activeCard.value;
  if (!card) return null;
  const ov = card.overrides as Record<string, unknown>;
  const rc = card.resolvedContent as Record<string, unknown>;
  const isBeforeAfter = (card.renderTemplateId ?? "").startsWith("before-after");

  let field: string;
  let url: string | undefined;
  if (isBeforeAfter) {
    // The before half sits at left 0; the after half at left ≥ 50.
    const isBefore = zone.left < 25;
    field = isBefore ? "beforePhotoCrop" : "afterPhotoCrop";
    url = isBefore
      ? ((ov.beforePhotoUrl as string) ?? (rc.beforePhotoUrl as string) ?? rc.photoUrl as string)
      : ((ov.afterPhotoUrl as string) ?? (rc.afterPhotoUrl as string) ?? rc.photoUrl as string);
  } else {
    field = "photoCrop";
    url = (ov.photoUrl as string) ?? (rc.photoUrl as string);
  }
  if (!url) return null;
  const crop = normalizeCrop((ov[field] as PhotoCrop) ?? (rc[field] as PhotoCrop));
  return {
    field,
    src: mediaSrc(url),
    zone: { left: zone.left, top: zone.top, width: zone.width, height: zone.height } as ZoneBox,
    crop,
    label: zone.label,
  };
}

// Back-photo adjust target. The photo-back left column is one photo spanning
// x 0–53% (two hotspot sub-zones map to it); adjust clips to that full column.
const BACK_PHOTO_ZONE: ZoneBox = { left: 0, top: 0, width: 53, height: 100 };
function backPhotoAdjustTarget() {
  const bc = cards.value[0]?.backContent;
  if (!bc) return null;
  const url = (bc.backPhotoUrl as string) || (cards.value[0]?.resolvedContent.photoUrl as string);
  if (!url) return null;
  return {
    field: "backPhotoCrop",
    src: mediaSrc(url),
    zone: { ...BACK_PHOTO_ZONE },
    crop: normalizeCrop(bc.backPhotoCrop),
    label: "Back photo",
  };
}

// Enter adjust mode for a photo/back-photo zone click. Returns true if it
// handled the click (so openZone can skip the drawer route).
function enterPhotoAdjust(zone: EditZone): boolean {
  const t = zone.editor === "back-photo" ? backPhotoAdjustTarget()
    : photoAdjustTargetForZone(zone);
  if (!t) return false;
  // Direct manipulation replaces the popover/drawer — close them.
  popover.value = null;
  drawerTab.value = null;
  photoAdjust.enter(t);
  return true;
}

// Done / Esc / clicking another surface commits + exits adjust mode.
function exitPhotoAdjust() {
  photoAdjust.exit();
}

// Chip "Change photo": the user wants a DIFFERENT photo, not a reposition —
// commit any pending crop, leave adjust mode, and open the gallery drawer for
// the side being edited (Dustin 2026-06-12: clicking the back photo gave no
// path to the picker).
function onAdjustChangePhoto() {
  photoAdjust.exit();
  openDrawer("photo");
}

// Entry from the photo drawer's "Adjust position on the card" button. The panel
// passes the slot's crop field; we find the matching photo zone and enter
// adjust mode (then close the drawer so the canvas is unobstructed).
function onEnterPhotoAdjustFromPanel(field: string) {
  const zones = isBack.value ? backEditZones.value : editZones.value;
  let zone: EditZone | undefined;
  if (field === "beforePhotoCrop") {
    zone = zones.find((z) => z.editor === "photo" && z.left < 25);
  } else if (field === "afterPhotoCrop") {
    zone = zones.find((z) => z.editor === "photo" && z.left >= 25);
  } else if (field === "backPhotoCrop") {
    zone = zones.find((z) => z.editor === "back-photo");
  } else {
    zone = zones.find((z) => z.editor === "photo");
  }
  if (zone) enterPhotoAdjust(zone);
}

// Layout switch state: drives the "Applying new layout…" overlay so the
// preview never sits silent (users read silence as broken and re-click).
const switchingLayout = ref(false);
let switchingLayoutFallback: ReturnType<typeof setTimeout> | null = null;

function selectTemplate(layout: TemplateLayoutType) {
  // S72 perf fix: a layout switch changes WHICH TEMPLATE renders the
  // cards, not their copy — so we remap template ids on the existing
  // cards instead of regenerating content through the AI (which took
  // 3 cards × up to 20s before any visual feedback; users re-clicked
  // thinking the picker was broken). Content, overrides, photos, colors
  // all survive the switch.
  invalidateProof();
  currentLayout.value = layout;
  const templateSet = getTemplateSetsForGoal(
    goalType.value,
    brandKit.value?.industry,
  ).find(
    (set) => set.layout === layout,
  );
  const renderTemplateId = renderTemplateIdForLayout(layout);
  cards.value = cards.value.map((card) => ({
    ...card,
    templateId:
      templateSet?.templates.find(
        (template) => template.cardPosition === card.cardPurpose,
      )?.id ?? card.templateId,
    ...(renderTemplateId ? { renderTemplateId } : {}),
  }));
  showTemplateBrowser.value = false;
  switchingLayout.value = true;
  if (switchingLayoutFallback) clearTimeout(switchingLayoutFallback);
  // Safety: never strand the overlay if a render errors out.
  switchingLayoutFallback = setTimeout(() => {
    switchingLayout.value = false;
  }, 30_000);
  commitDesign();
  queuePersistedPreviewRefresh();

  // S76: auto-generate the service-area map when switching to the
  // neighborhood-map layout with no map yet. Fire-and-forget — the instant
  // remap above already happened; this must NOT block the switch (PR #59
  // made layout switches instant). On completion we apply the map URL to
  // every card and re-render.
  if (layout === "neighborhood-map" && mapsConfigured.value) {
    maybeAutoGenerateMap();
  }
}

// Tracks an in-flight auto-generate so a rapid re-switch doesn't double-fire.
let autoMapInFlight = false;

function maybeAutoGenerateMap() {
  const anyHasMap = cards.value.some(
    (c) =>
      (c.overrides.mapImageUrl as string | undefined) ||
      c.resolvedContent.mapImageUrl,
  );
  if (anyHasMap || autoMapInFlight) return;
  autoMapInFlight = true;
  generateMapImage()
    .then((res) => {
      if (!res?.url) return;
      // Apply to all cards (the map is org-level, shared across the
      // sequence), preserving any per-card overrides.
      cards.value = cards.value.map((card) => ({
        ...card,
        overrides: { ...card.overrides, mapImageUrl: res.url },
        resolvedContent: { ...card.resolvedContent, mapImageUrl: res.url },
      }));
      commitDesign();
      queuePersistedPreviewRefresh();
    })
    .catch(() => {
      /* auto-gen is best-effort; the user can still Generate from the
         EditPanel, which surfaces the actual error */
    })
    .finally(() => {
      autoMapInFlight = false;
    });
}

function resetCard() {
  liveOverlay.value = null;
  const orig = originalCards[activeCardIndex.value];
  if (orig) {
    invalidateProof();
    replaceActiveCard({ ...(JSON.parse(JSON.stringify(orig)) as CardDesign), overrides: {} });
    commitDesign();
    queuePersistedPreviewRefresh();
  }
}

function replaceActiveCard(nextCard: CardDesign) {
  replaceCardAt(activeCardIndex.value, nextCard);
}

function replaceCardAt(idx: number, nextCard: CardDesign) {
  cards.value = cards.value.map((card, i) => (i === idx ? nextCard : card));
}

// `opts.source` forwards to draftStore.setDesign — "system" for the
// review-defaults auto-fill (applyBrandKitReviewDefaults) below, which
// must NOT mark the draft's `designUserEdited` pristine-tracking flag
// (AI-scrape-triggers spec edge case #11). Every other caller here is a
// genuine customer edit and keeps the default "user" source.
function commitDesign(opts?: { source?: "user" | "system" }) {
  const design: DesignSelection = {
    templateId: cards.value[0]?.templateId ?? "",
    templateLayoutType: currentLayout.value,
    isCustomUpload: false,
    customUploadUrl: null,
    sequenceCards: cards.value,
  };
  draftStore.setDesign(design, opts);
}

// Sync cards from store when async generation completes (fired by setGoal in Step 1)
watch(
  () => draftStore.draft?.design?.sequenceCards,
  (storeCards) => {
    if (storeCards?.length && cards.value.length === 0) {
      cards.value = [...storeCards];
      currentLayout.value = draftStore.draft?.design?.templateLayoutType ?? "full-bleed";
      const appliedReviews = applyBrandKitReviewDefaults();
      originalCards = cards.value.map((c) => JSON.parse(JSON.stringify(c)) as CardDesign);
      if (appliedReviews) commitDesign({ source: "system" });
    }
  },
);

// If brand kit loads after Step 1 fired (guard skipped it), retry generation
watch(
  () => brandKitStore.hydrated,
  (hydrated) => {
    if (hydrated && cards.value.length === 0) {
      draftStore.generateCardsForDraft();
    } else if (hydrated && applyBrandKitReviewDefaults()) {
      originalCards = cards.value.map((c) => JSON.parse(JSON.stringify(c)) as CardDesign);
      commitDesign({ source: "system" });
      queuePersistedPreviewRefresh();
    }
  },
);
</script>

<template>
  <!-- S79 Phase-1 — the design step is a fixed-height, NON-scrolling flex
       column inside the wizard viewport. The canvas region never scrolls;
       only the right rail scrolls internally. This kills the old
       `grid-rows-[auto_1fr_auto_auto] min-h-full` stack that grew past the
       viewport (tall BackEditPanel drove page height; the canvas fell below
       the fold). h-full pins us to WizardShell's `flex-1` step viewport. -->
  <div class="flex flex-col h-full min-h-0">
    <!-- No brand kit warning -->
    <div
      v-if="!brandKit"
      class="shrink-0 bg-amber-50 border-b border-amber-200 px-6 py-3 text-center text-sm text-amber-700"
    >
      Brand info is loading... Postcard will be generated with placeholder content.
    </div>

    <!-- SLIM TOOLBAR — one row merges the card sequence (filmstrip),
         the Front/Back side toggle, and the global canvas actions
         (Try Different Template, Generate Proof). Replaces the old
         full-size thumbnail strip + caption + separate centered toggle. -->
    <div
      v-if="cardsReady"
      class="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 bg-white px-4 sm:px-6 py-2"
    >
      <!-- Card sequence (only when >1 card) -->
      <SequenceView
        v-if="cards.length > 1"
        :cards="cards"
        :active-card-index="activeCardIndex"
        :thumbnail-urls="thumbnailUrls"
        :brand-colors="brandKit?.brandColors"
        :business-name="brandKit?.businessName"
        :business-address="brandKit?.address ?? ''"
        :logo-url="brandKit?.logoUrl"
        :rating="brandKit?.googleRating ?? null"
        :review-count="brandKit?.reviewCount ?? null"
        :trust-badges="brandKit?.trustBadges ?? []"
        :years-in-business="brandKit?.yearsInBusiness ?? null"
        :city="brandKitCity"
        :credibility-line="brandKitCredibility"
        @select="activeCardIndex = $event"
      />

      <!-- Front/Back surface toggle (S76 Phase-5). The back is ONE design
           for the whole sequence — switching here swaps the preview + the
           edit panel between the front card and the shared back. -->
      <div
        class="inline-flex rounded-lg border border-gray-200 bg-white p-0.5"
        role="tablist"
        aria-label="Postcard side"
      >
        <button
          type="button"
          role="tab"
          data-testid="side-toggle-front"
          :aria-selected="activeSide === 'front'"
          class="px-3 py-1 text-sm font-medium rounded-md transition-colors"
          :class="activeSide === 'front'
            ? 'bg-[#0b2d50] text-white'
            : 'text-gray-600 hover:text-gray-900'"
          @click="activeSide = 'front'"
        >
          Front
        </button>
        <button
          type="button"
          role="tab"
          data-testid="side-toggle-back"
          :aria-selected="activeSide === 'back'"
          class="px-3 py-1 text-sm font-medium rounded-md transition-colors"
          :class="activeSide === 'back'
            ? 'bg-[#0b2d50] text-white'
            : 'text-gray-600 hover:text-gray-900'"
          @click="activeSide = 'back'"
        >
          Back
        </button>
      </div>

      <!-- Heavy-editor launchers (S79 Phase-2). These open the ContextDrawer
           rather than crowding a popover. Photo/Colors apply to the active
           surface; Business Info is org-wide. -->
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          data-testid="toolbar-photo"
          class="px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-colors"
          :class="drawerTab === 'photo'
            ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]'
            : 'border-gray-200 text-gray-700 hover:border-[#47bfa9] hover:text-[#0b2d50]'"
          @click="openDrawer('photo')"
        >
          Photo
        </button>
        <button
          type="button"
          data-testid="toolbar-colors"
          class="px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-colors"
          :class="drawerTab === 'colors'
            ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]'
            : 'border-gray-200 text-gray-700 hover:border-[#47bfa9] hover:text-[#0b2d50]'"
          @click="openDrawer('colors')"
        >
          Colors
        </button>
        <button
          type="button"
          data-testid="toolbar-business"
          class="px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-colors"
          :class="drawerTab === 'business'
            ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]'
            : 'border-gray-200 text-gray-700 hover:border-[#47bfa9] hover:text-[#0b2d50]'"
          @click="openDrawer('business')"
        >
          Business
        </button>
        <button
          v-if="isBack"
          type="button"
          data-testid="toolbar-back-style"
          class="px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-colors"
          :class="drawerTab === 'back-style'
            ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]'
            : 'border-gray-200 text-gray-700 hover:border-[#47bfa9] hover:text-[#0b2d50]'"
          @click="openDrawer('back-style')"
        >
          Back Style
        </button>
      </div>

      <!-- Global canvas actions, pushed to the right edge of the toolbar. -->
      <div class="ml-auto flex items-center gap-2">
        <button
          v-if="auth.hasPostcards"
          type="button"
          data-testid="ai-generate-btn"
          class="bg-[#47bfa9] text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-[#3aa893] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="aiGenerateBusy"
          @click="handleAiGenerateClick"
        >
          <template v-if="aiGenerateBusy">
            <span
              class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin align-middle mr-1.5"
            />
          </template>
          {{ aiGenerateLabel }}
        </button>
        <button
          type="button"
          data-testid="toolbar-try-template"
          class="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors"
          @click="showTemplateBrowser = true"
        >
          Try Different Template
        </button>
        <button
          type="button"
          class="bg-[#47bfa9] text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-[#3aa893] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="
            renderPhase === 'starting' ||
            renderPhase === 'queued' ||
            renderPhase === 'rendering' ||
            !draftStore.draft ||
            !cardsReady
          "
          @click="handleGenerateProof"
        >
          <template v-if="renderPhase === 'starting' || renderPhase === 'queued' || renderPhase === 'rendering'">
            <span
              class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin align-middle mr-1.5"
            />
            Generating…
          </template>
          <template v-else-if="renderPhase === 'done'">
            Regenerate Proof
          </template>
          <template v-else>
            Generate Proof
          </template>
        </button>
      </div>
    </div>

    <!-- BODY — fixed-height 2-column flex. Canvas column fills and NEVER
         scrolls; the right rail is width-constrained and scrolls itself.
         `min-h-0` is essential so the children can shrink below content
         height and the rail's internal overflow takes effect. -->
    <div class="flex-1 min-h-0 flex">
      <!-- CANVAS REGION (S79 Phase-2): the server-PNG card as hero, centered in
           a calm neutral surround. This element is the popover/drawer anchor —
           `relative` so the ContextDrawer overlays the right edge WITHOUT
           reflowing the canvas, and `canvasRegion` is measured so the zone
           popover anchoring math works in this element's pixel space. -->
      <div
        ref="canvasRegion"
        class="relative flex-1 min-w-0 min-h-0 flex flex-col bg-gray-50">
        <!-- BACK preview surface (S76 Phase-5) -->
        <div
          v-if="isBack"
          class="flex-1 min-h-0 flex items-center justify-center p-6 overflow-hidden"
          data-testid="back-preview-surface"
        >
          <div v-if="backPreviewLoading && !backPreviewUrl" class="w-full max-w-lg aspect-[3/2] bg-gray-100 rounded flex items-center justify-center">
            <span class="inline-block w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <div v-else-if="backPreviewUrl" ref="backCardBoxEl" class="relative aspect-[3/2] h-full max-w-full rounded-lg shadow-lg ring-1 ring-black/5">
            <!-- S79 Phase-3: flip wrapper — ONLY the img lives here so the
                 CSS 3D transform never disturbs the zone hotspot layer. -->
            <div ref="canvasFlipWrapperEl" :class="flipWrapperClass" class="absolute inset-0">
              <img
                :key="backPreviewUrl"
                :src="backPreviewUrl"
                alt="Postcard back preview"
                class="w-full h-full object-cover rounded-lg"
                :class="{ 'opacity-60': backPreviewLoading }"
                @load="measureCanvas"
              />
            </div>
            <!-- Back click-to-edit hotspots (S79 Phase-2): same model as the
                 front — click a back zone → its editor opens in a popover
                 (or the drawer for Back Style / Back Photo).
                 tabindex + focus ring added for a11y (S79 Phase-3). -->
            <button
              v-for="(zone, zoneIdx) in backEditZones"
              :key="`back-${zone.editor}-${zoneIdx}`"
              type="button"
              :data-testid="`card-zone-${zone.editor}`"
              :title="zone.label"
              :aria-label="zone.label"
              tabindex="0"
              class="absolute group cursor-pointer bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[#47bfa9] focus-visible:ring-offset-1 rounded"
              :style="{
                left: zone.left + '%',
                top: zone.top + '%',
                width: zone.width + '%',
                height: zone.height + '%',
              }"
              @click="openZone(zone)"
            >
              <span
                class="absolute inset-0 rounded border-2 border-transparent transition-[border-color,background-color] duration-150 group-hover:border-[#47bfa9]/80 group-hover:bg-[#47bfa9]/10"
              />
              <span
                class="absolute top-1.5 left-1.5 hidden group-hover:inline-block text-[10px] font-medium bg-[#0b2d50]/85 text-white px-1.5 py-0.5 rounded pointer-events-none"
              >
                {{ zone.label }}
              </span>
            </button>
          </div>
          <div v-else-if="backPreviewError" class="w-full max-w-lg aspect-[3/2] bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
            Back preview unavailable.
            <button class="ml-2 text-[#47bfa9] underline" @click="refreshBackPreview">Retry</button>
          </div>
          <div v-else class="w-full max-w-lg aspect-[3/2] bg-gray-100 rounded flex items-center justify-center text-sm text-gray-400">
            Loading back…
          </div>
        </div>

        <div v-show="!isBack" class="flex-1 min-h-0 flex items-center justify-center p-6 overflow-hidden">
          <!-- Pre-generation loading state. User reached Step 3 before
               auto-populate finished (fires from Step 1 goal commit in
               useCampaignDraftStore.setGoal → generateCardsForDraft).
               Warm treatment matches footer's "Generating your postcards…"
               copy; replaces previous "Preview unavailable" that fired
               when useCardPreview called the server before cards existed.
               S62 rehearsal fix. -->
          <div v-if="!cardsReady" class="w-full max-w-lg aspect-[3/2] bg-white border border-gray-200 rounded flex items-center justify-center">
            <div class="text-center space-y-3 px-6">
              <span class="inline-block w-8 h-8 border-2 border-[#47bfa9] border-t-transparent rounded-full animate-spin" />
              <div class="text-sm text-gray-700 font-medium">Designing your postcards…</div>
              <div class="text-xs text-gray-500">This usually takes about a minute.</div>
            </div>
          </div>
          <div v-else-if="previewLoading && !previewUrl" class="w-full max-w-lg aspect-[3/2] bg-gray-100 rounded flex items-center justify-center">
            <span class="inline-block w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <!-- 3:2 wrapper sized to fit the viewport: `aspect-[3/2] h-full
               max-w-full` makes the box height-bound but clamps to the
               column width — whichever binds wins, and the box stays
               EXACTLY 3:2 so the %-positioned hotspots + live overlay align
               with the painted artwork (the server PNG is exactly 1200×800,
               so the img fills the box with no letterbox/crop). -->
          <div v-else-if="previewUrl" ref="frontCardBoxEl" class="relative aspect-[3/2] h-full max-w-full rounded-lg shadow-lg ring-1 ring-black/5">
            <!-- S79 Phase-3: flip wrapper — ONLY the img lives here so the
                 CSS 3D transform never disturbs the zone hotspot layer.
                 ref="canvasFlipWrapperEl" assigns when front is active. -->
            <div ref="canvasFlipWrapperEl" :class="flipWrapperClass" class="absolute inset-0">
              <img
                :key="previewUrl"
                :src="previewUrl"
                alt="Postcard preview"
                class="w-full h-full object-cover rounded-lg"
                :class="{ 'opacity-60': previewLoading || switchingLayout }"
                @load="measureCanvas"
              />
              <!-- Layout switch feedback: the old render stays visible but
                   clearly transitional, so users don't re-click the picker. -->
              <div
                v-if="switchingLayout"
                data-testid="layout-switch-overlay"
                class="absolute inset-0 grid place-items-center bg-white/50 rounded"
              >
                <div class="flex items-center gap-2 bg-[#0b2d50]/90 text-white text-xs font-medium px-3 py-2 rounded-full shadow">
                  <span class="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Applying new layout…
                </div>
              </div>
            </div>
            <!-- Click-to-edit hotspots: invisible until hover, mapped to the
                 template's slot geometry. Lives OUTSIDE the flip wrapper so
                 hit-areas are NEVER transformed (S79 Phase-3 guard).
                 tabindex + focus ring added for a11y. -->
            <button
              v-for="(zone, zoneIdx) in editZones"
              :key="`${zone.editor}-${zoneIdx}`"
              type="button"
              :data-testid="`card-zone-${zone.editor}`"
              :title="zone.label"
              :aria-label="zone.label"
              tabindex="0"
              class="absolute group cursor-pointer bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[#47bfa9] focus-visible:ring-offset-1 rounded"
              :style="{
                left: zone.left + '%',
                top: zone.top + '%',
                width: zone.width + '%',
                height: zone.height + '%',
              }"
              @click="openZone(zone)"
            >
              <span
                class="absolute inset-0 rounded border-2 border-transparent transition-[border-color,background-color] duration-150 group-hover:border-[#47bfa9]/80 group-hover:bg-[#47bfa9]/10"
              />
              <span
                class="absolute top-1.5 left-1.5 hidden group-hover:inline-block text-[10px] font-medium bg-[#0b2d50]/85 text-white px-1.5 py-0.5 rounded pointer-events-none"
              >
                {{ zone.label }}
              </span>
            </button>
            <!-- Hybrid live-edit overlay: instant text feedback in the edited
                 zone while the authoritative server render catches up. The
                 PNG stays the only card imagery (ONE RENDERING RULE). -->
            <div
              v-if="liveOverlay && liveOverlayZone"
              :data-testid="`live-overlay-${liveOverlay.zone}`"
              class="absolute pointer-events-none flex"
              :class="liveOverlay.zone === 'offer' ? 'items-center justify-center' : 'items-start justify-start'"
              :style="{
                left: liveOverlayZone.left + '%',
                top: liveOverlayZone.top + '%',
                width: liveOverlayZone.width + '%',
                height: liveOverlayZone.height + '%',
                background: 'rgba(255,255,255,0.93)',
              }"
            >
              <span
                class="font-bold text-[#0b2d50] leading-tight break-words px-[6%] py-[5%]"
                :class="liveOverlay.zone === 'headline' ? 'text-[1.6vw] min-[1400px]:text-xl' : 'text-[1.2vw] min-[1400px]:text-base text-center'"
              >
                {{ liveOverlay.text }}
              </span>
              <span
                class="absolute bottom-1.5 right-1.5 text-[9px] font-medium bg-[#47bfa9] text-white px-1.5 py-0.5 rounded inline-flex items-center gap-1"
              >
                <span class="inline-block w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                Syncing…
              </span>
            </div>
          </div>
          <div v-else-if="previewError" class="w-full max-w-lg aspect-[3/2] bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
            Preview unavailable.
            <button class="ml-2 text-[#47bfa9] underline" @click="refreshPreview">Retry</button>
          </div>
          <div v-else class="w-full max-w-lg aspect-[3/2] bg-gray-100 rounded flex items-center justify-center text-sm text-gray-400">
            Waiting for card data…
          </div>
        </div>

        <!-- S81 ON-CANVAS photo adjust overlay. Sits ABOVE the card PNG but
             BELOW the popover/drawer layers (its internal z-20 is under the
             popover/drawer transitions that follow). Painted whenever adjust
             mode is active OR lingering through a reconcile (no flicker). The
             zone rect is mapped with the SAME canvasViewport the popover uses. -->
        <PhotoAdjustOverlay
          v-if="photoAdjust.overlayVisible.value && photoAdjust.target.value"
          :src="photoAdjust.target.value.src"
          :zone="photoAdjust.target.value.zone"
          :viewport="canvasViewport"
          :crop="photoAdjust.crop.value"
          :label="photoAdjust.target.value.label"
          @pan="(p) => photoAdjust.panBy(p.startCrop, p.dx, p.dy, p.w, p.h)"
          @zoom="(z) => photoAdjust.setZoom(z)"
          @zoom-by="(d) => photoAdjust.zoomBy(d)"
          @reset="photoAdjust.reset()"
          @done="exitPhotoAdjust()"
          @change-photo="onAdjustChangePhoto()"
        />

        <!-- First-run coach mark (S79 Phase-3): "Click any part of the card to
             edit it." One-time hint, stored in localStorage. -->
        <CanvasCoachMark />

        <!-- TIER-1 ANCHORED POPOVER (S79 Phase-2 / Phase-3): hosts a single
             editor section next to the clicked zone. Front popovers wrap
             EditPanel in section mode; back popovers wrap BackEditPanel.
             Esc / outside-click close; clicks inside never close (typing-safe).
             Wrapped in <Transition name="popover"> for 150ms fade+scale. -->
        <Transition name="popover">
          <ZonePopover
            v-if="popover"
            :zone="popover.zone"
            :viewport="canvasViewport"
            :label="popoverLabel"
            @close="closePopover"
          >
            <BackEditPanel
              v-if="isBack && backContent"
              mode="section"
              :section="(popover.editor as any)"
              :back-content="backContent"
              :brand-kit="brandKit"
              @update-back="updateBack"
            />
            <EditPanel
              v-else-if="activeCard"
              mode="section"
              :section="(popover.editor as any)"
              :card="activeCard"
              :brand-kit="brandKit"
              :requested-editor="requestedEditor"
              @update-field="updateCardField"
              @update-headline-lines="updateHeadlineLines"
              @update-service-rows="updateServiceRows"
              @update-offer-items="updateOfferItems"
              @update-tips="updateTips"
              @regenerate-cards="regenerateCards"
              @update-colors="updateColors"
              @update-photo="updatePhoto"
              @update-crop="updateCrop"
              @enter-photo-adjust="onEnterPhotoAdjustFromPanel"
              @update-map-settings="updateMapSettings"
              @open-template-browser="showTemplateBrowser = true"
              @reset="resetCard"
              @info-saved="refreshPreview"
            />
          </ZonePopover>
        </Transition>

        <!-- TIER-2 CONTEXT DRAWER (S79 Phase-2 / Phase-3): the heavy editors —
             Photo, Colors, Business Info, Back Style. Overlays the canvas
             region's right edge WITHOUT reflowing the hero (absolute). Collapsed
             by default. Wrapped in <Transition name="drawer"> for 200ms slide. -->
        <Transition name="drawer">
          <ContextDrawer
            v-if="drawerTab"
            :title="drawerTitle"
            @close="closeDrawer"
          >
            <BackEditPanel
              v-if="isBack && backContent"
              mode="section"
              :section="(drawerBackSection as any)"
              :back-content="backContent"
              :brand-kit="brandKit"
              @update-back="updateBack"
            />
            <EditPanel
              v-else-if="activeCard && drawerFrontSection"
              mode="section"
              :section="(drawerFrontSection as any)"
              :card="activeCard"
              :brand-kit="brandKit"
              :requested-editor="requestedEditor"
              @update-field="updateCardField"
              @update-headline-lines="updateHeadlineLines"
              @update-service-rows="updateServiceRows"
              @update-offer-items="updateOfferItems"
              @update-tips="updateTips"
              @regenerate-cards="regenerateCards"
              @update-colors="updateColors"
              @update-photo="updatePhoto"
              @update-crop="updateCrop"
              @enter-photo-adjust="onEnterPhotoAdjustFromPanel"
              @update-map-settings="updateMapSettings"
              @open-template-browser="showTemplateBrowser = true"
              @reset="resetCard"
              @info-saved="refreshPreview"
            />
          </ContextDrawer>
        </Transition>
      </div>
    </div>

    <!-- Proof panel (S79 Phase-1) — relocated OUT of the always-rendered
         stack into a centered overlay modal. Previously it lived as two
         full-width grid rows (proof bar + proof grid) under the canvas,
         which pushed the card up and forced page scroll. The Generate
         Proof action now lives in the slim toolbar; clicking it renders the
         proof previews here on top of the editing surface, so the canvas
         layout is never disturbed. The render-status text moved here too.
         PNG previews + per-card PDF links unchanged (ONE RENDERING RULE). -->
    <div
      v-if="showProofPanel"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      data-testid="proof-overlay"
      @click.self="showProofPanel = false"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-3">
          <div class="text-sm text-gray-500 min-w-0 flex-1">
            <template v-if="renderPhase === 'starting' || renderPhase === 'queued'">
              Queueing render…
            </template>
            <template v-else-if="renderPhase === 'rendering'">
              Rendering postcard{{ renderProgress && renderProgress.total > 1 ? "s" : "" }}…
              <span v-if="renderProgress" class="text-gray-400">
                ({{ renderProgress.completed }}/{{ renderProgress.total }})
              </span>
            </template>
            <template v-else-if="renderPhase === 'done'">
              Proof ready.
            </template>
            <template v-else-if="renderPhase === 'failed'">
              <span class="text-red-600 break-words">
                Render failed: {{ renderError?.message }}
              </span>
            </template>
          </div>
          <button
            type="button"
            data-testid="proof-overlay-close"
            class="text-gray-400 hover:text-gray-700 text-sm font-medium"
            @click="showProofPanel = false"
          >
            Close
          </button>
        </div>
        <div class="px-6 py-4">
      <div v-if="proofImages.length > 0" class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold text-[#0b2d50]">
            Print-ready proof ({{ proofImages.length }} card{{ proofImages.length > 1 ? "s" : "" }})
          </div>
          <a
            v-if="renderPhase === 'done' && renderedCards.length > 0"
            :href="mediaSrc(renderedCards[0]?.downloadUrl ?? '')"
            target="_blank"
            class="text-sm text-[#47bfa9] underline"
          >Download PDF</a>
        </div>
        <div
          v-if="proofRenderWarnings.some((warning) => BLOCKING_PROOF_WARNINGS.some((code) => warning.includes(code)))"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
          data-testid="proof-blocking-warnings"
        >
          Proof has missing or blocked artwork. Regenerate after fixing the brand kit.
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(imgUrl, idx) in proofImages"
            :key="idx"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div class="text-xs text-gray-400 px-3 pt-2">Card {{ idx + 1 }}</div>
            <img
              :src="imgUrl"
              :alt="`Proof for card ${idx + 1}`"
              class="w-full"
            />
            <div
              v-if="renderPhase === 'done' && renderedCards[idx]?.downloadUrl"
              class="border-t border-gray-100 px-3 py-2"
            >
              <a
                :href="mediaSrc(renderedCards[idx]?.downloadUrl ?? '')"
                target="_blank"
                class="text-xs font-medium text-[#47bfa9] underline"
                :data-testid="`proof-pdf-link-${idx + 1}`"
              >
                Open Card {{ idx + 1 }} PDF
              </a>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="renderPhase === 'failed'" class="text-sm text-red-600">
        {{ renderError?.message }}
        <button
          class="ml-2 text-[#47bfa9] underline"
          @click="handleGenerateProof"
        >
          Retry
        </button>
      </div>
      <div v-else class="text-sm text-gray-400">
        Proof will appear here once rendering finishes.
      </div>
        </div>
      </div>
    </div>

    <!-- Template browser overlay -->
    <TemplateBrowser
      v-if="showTemplateBrowser"
      :goal-type="goalType"
      :industry="brandKit?.industry ?? null"
      :current-layout="currentLayout"
      @select="selectTemplate"
      @close="showTemplateBrowser = false"
    />

    <!-- S90: "Generate with AI" — no website on file yet, ask for one. -->
    <div
      v-if="showAiWebsiteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      data-testid="ai-generate-website-modal"
      @click.self="cancelAiWebsiteModal"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 class="text-lg font-semibold text-[#0b2d50]">Design from your website</h2>
        <p class="mt-1 text-sm text-gray-500">
          We'll scan it for your logo, colors, and photos, then build your postcard.
        </p>
        <input
          v-model="aiWebsiteInput"
          type="text"
          placeholder="yourbusiness.com"
          data-testid="ai-generate-website-input"
          class="mt-4 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @keyup.enter="submitAiWebsiteModal"
        />
        <p v-if="aiWebsiteModalError" class="mt-1.5 text-xs text-red-600">
          {{ aiWebsiteModalError }}
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900"
            @click="cancelAiWebsiteModal"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="ai-generate-website-submit"
            class="bg-[#47bfa9] text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-[#3aa893] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="aiSavingWebsite"
            @click="submitAiWebsiteModal"
          >
            {{ aiSavingWebsite ? "Saving…" : "Scan & Generate" }}
          </button>
        </div>
      </div>
    </div>

    <!-- S90: "Generate with AI" — design already has manual edits, confirm
         before overwriting them with a fresh AI regeneration. -->
    <div
      v-if="showAiConfirmModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      data-testid="ai-generate-confirm"
      @click.self="cancelAiConfirm"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 class="text-lg font-semibold text-[#0b2d50]">Replace your card copy?</h2>
        <p class="mt-1 text-sm text-gray-500">
          This rewrites your card copy with fresh AI content — your manual edits will be replaced.
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            data-testid="ai-generate-cancel"
            class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900"
            @click="cancelAiConfirm"
          >
            Cancel
          </button>
          <button
            type="button"
            class="bg-[#47bfa9] text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-[#3aa893] transition-colors"
            @click="confirmAiRegenerate"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
