<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type {
  CardDesign,
  BrandKit,
  BrandKitPhoto,
  BrandKitReview,
  ColorOverride,
  HeadlineLines,
  Industry,
  OfferStackItem,
  PhotoCrop,
  MapSettings,
} from "@/types/campaign";
import { hasAnyLine, splitHeadline } from "@/utils/headlineSplit";
import { COLOR_PALETTES, isCompleteOverride, isValidHex } from "@/data/colorPalettes";
import { getPhotosForIndustry } from "@/data/stockPhotos";
import { editZonesFor, type CardEditor } from "@/data/templateEditZones";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useAuthStore } from "@/stores/auth";
import {
  generateMapImage,
  getMediaFeaturesCached,
  searchStockPhotos,
  type StockPhotoResult,
} from "@/api/brandKit";
import { onMounted } from "vue";
import { API_BASE } from "@/api/http";

/**
 * Brand-kit photos store relative /media/... URLs; the API host serves
 * them. On same-origin deployments API_BASE is "" and this is a no-op; on
 * cross-origin deployments (Vercel preview + Railway API) the browser
 * would otherwise resolve them against the SPA host and 404 — which is
 * why picker thumbnails showed alt text while the rendered card (whose
 * URLs the server absolutizes) was fine.
 */
function mediaSrc(url: string): string {
  return url && url.startsWith("/") ? `${API_BASE}${url}` : url;
}

type EditorType =
  | "headline"
  | "offer"
  | "review"
  | "photo"
  | "colors"
  | "business"
  | "checklist"
  | "notice"
  | "tips"
  | "letter"
  | "map"
  | null;

const props = defineProps<{
  card: CardDesign;
  brandKit: BrandKit | null;
  /** Click-to-edit: set by StepDesign when a card hotspot is clicked. */
  requestedEditor?: { editor: CardEditor; ts: number } | null;
  /**
   * S79 Phase-2: "panel" = the legacy accordion (still used by specs and as a
   * fallback). "section" = render ONLY the `section` editor's inputs (no
   * accordion buttons, no outer rail chrome) so the ZonePopover / ContextDrawer
   * can host a single editor in-context. The editor internals/emits are reused
   * verbatim — this just chooses which subset is visible.
   */
  mode?: "panel" | "section";
  /** Which editor to render in section mode. */
  section?: EditorType;
}>();

const emit = defineEmits<{
  (e: "update-field", field: string, value: string): void;
  (e: "update-headline-lines", lines: HeadlineLines): void;
  (e: "update-service-rows", rows: string[]): void;
  (e: "update-offer-items", items: OfferStackItem[]): void;
  (e: "update-tips", tips: string[]): void;
  (e: "regenerate-cards"): void;
  (e: "update-colors", colors: ColorOverride | null): void;
  (e: "update-photo", url: string): void;
  // S80 photo positioning/cropping. `field` is the override key to write
  // (photoCrop | beforePhotoCrop | afterPhotoCrop); `crop` undefined = reset.
  (e: "update-crop", field: string, crop: PhotoCrop | undefined): void;
  // S81: enter ON-CANVAS adjust mode for the active photo slot. The S80
  // in-panel mini-frame is replaced by this entry button — direct manipulation
  // over the rendered card happens in StepDesign. `field` scopes the slot.
  (e: "enter-photo-adjust", field: string): void;
  // S80 persist the chosen neighborhood-map view controls on the card.
  (e: "update-map-settings", settings: MapSettings): void;
  (e: "open-template-browser"): void;
  (e: "reset"): void;
  (e: "info-saved"): void;
}>();

const activeEditor = ref<EditorType>(null);

// S79 Phase-2 section mode. In section mode the panel is hosted inside a
// popover/drawer and shows exactly one editor's inputs.
const isSectionMode = computed(() => props.mode === "section");
// Accordion toggle buttons + outer rail chrome are hidden in section mode.
const showToggles = computed(() => !isSectionMode.value);
// Is the given editor's content currently visible?
function isOpen(editor: EditorType): boolean {
  return isSectionMode.value
    ? props.section === editor
    : activeEditor.value === editor;
}
// In section mode the parent picks the editor; keep activeEditor mirrored so
// any internal reads stay consistent.
watch(
  () => [props.mode, props.section] as const,
  ([m, s]) => {
    if (m === "section") activeEditor.value = (s ?? null) as EditorType;
  },
  { immediate: true },
);

// --- Color profiles (S72) --------------------------------------------------
const customColors = ref<ColorOverride>({
  primary: props.card.colorOverride?.primary ?? "#d63a2f",
  secondary: props.card.colorOverride?.secondary ?? "#2a7de1",
  accent: props.card.colorOverride?.accent ?? "#f5b50a",
});

watch(
  () => props.card.colorOverride,
  (next) => {
    if (next) customColors.value = { ...next };
  },
);

function isActivePalette(palette: ColorOverride): boolean {
  const o = props.card.colorOverride;
  return Boolean(
    o &&
      o.primary === palette.primary &&
      o.secondary === palette.secondary &&
      o.accent === palette.accent,
  );
}

// --- Brand color editing (S72: edit org colors from the designer) ----------
// Saves to the brand kit (PUT /api/brand-kit), so EVERY card that uses
// "my brand colors" picks the change up — unlike palettes, which are
// per-card overrides.
const editingBrandColors = ref(false);
const savingBrandColors = ref(false);
const brandColorError = ref<string | null>(null);
const brandColorDraft = ref<ColorOverride>({
  primary: "#d63a2f",
  secondary: "#2a7de1",
  accent: "#f5b50a",
});

function toggleBrandColorEditor() {
  if (!editingBrandColors.value) {
    const bc = props.brandKit?.brandColors ?? [];
    brandColorDraft.value = {
      primary: bc[0] && isValidHex(bc[0]) ? bc[0] : "#d63a2f",
      secondary: bc[1] && isValidHex(bc[1]) ? bc[1] : "#2a7de1",
      accent: bc[2] && isValidHex(bc[2]) ? bc[2] : "#f5b50a",
    };
    brandColorError.value = null;
  }
  editingBrandColors.value = !editingBrandColors.value;
}

async function saveBrandColors() {
  if (savingBrandColors.value) return;
  savingBrandColors.value = true;
  brandColorError.value = null;
  try {
    await brandKitStore.update({
      brandColors: [
        brandColorDraft.value.primary,
        brandColorDraft.value.secondary,
        brandColorDraft.value.accent,
      ],
    });
    if (brandKitStore.error) {
      brandColorError.value = brandKitStore.error;
      return;
    }
    editingBrandColors.value = false;
    // Put the active card on brand colors so the change shows right away,
    // and refresh the authoritative render.
    emit("update-colors", null);
    emit("info-saved");
  } finally {
    savingBrandColors.value = false;
  }
}

function applyPalette(palette: ColorOverride | null) {
  emit(
    "update-colors",
    palette ? { primary: palette.primary, secondary: palette.secondary, accent: palette.accent } : null,
  );
}

function onCustomColor(slot: keyof ColorOverride, value: string) {
  customColors.value = { ...customColors.value, [slot]: value };
  if (isCompleteOverride(customColors.value)) {
    emit("update-colors", { ...customColors.value });
  }
}

// Photo-free layouts (bold-graphic, review-forward) have no photo slot —
// the zone map is the single source of truth for which surfaces exist.
const layoutUsesPhoto = computed(() =>
  editZonesFor(props.card.renderTemplateId ?? null, props.card.cardPurpose).some(
    (z) => z.editor === "photo",
  ),
);

function toggleEditor(editor: EditorType) {
  activeEditor.value = activeEditor.value === editor ? null : editor;
}

// Click-to-edit: open the editor the card hotspot asked for. The ts field
// retriggers the watcher when the same zone is clicked twice.
const PANEL_EDITORS = new Set<EditorType>([
  "headline",
  "offer",
  "review",
  "photo",
  "colors",
  "business",
  "checklist",
  "notice",
  "tips",
  "letter",
  "map",
]);
watch(
  () => props.requestedEditor,
  (req) => {
    // Only honor editors this panel actually hosts (back-* editors are routed
    // elsewhere); narrows the wider CardEditor union to EditorType.
    const e = req?.editor;
    if (e && PANEL_EDITORS.has(e as EditorType)) {
      activeEditor.value = e as EditorType;
    }
  },
);

// Line-level editing (S72): the headline editor exposes the card's five
// text slots directly — what you click is what you edit, empty slots stay
// empty on the print (no template filler). Legacy cards that predate
// headlineLines get their slots derived once from the joined headline.
function linesForCard(): HeadlineLines {
  const stored = props.card.resolvedContent.headlineLines;
  if (hasAnyLine(stored)) return { ...(stored as HeadlineLines) };
  return splitHeadline(props.card.resolvedContent.headline);
}

const editableLines = ref<HeadlineLines>(linesForCard());
const editableOffer = ref(props.card.resolvedContent.offerText);

const HEADLINE_LINE_FIELDS: {
  key: keyof HeadlineLines;
  label: string;
  max: number;
}[] = [
  { key: "red1", label: "Top line", max: 26 },
  { key: "red2", label: "Top line 2", max: 26 },
  { key: "bridge", label: "Connector (small text)", max: 32 },
  { key: "blue1", label: "Main line", max: 24 },
  { key: "blue2", label: "Main line 2", max: 24 },
];

// Re-sync inline editor buffers when the active card changes OR when
// the server-derived resolvedContent for the active card is replaced
// (Reset to Original does this without bumping cardNumber). S60 Bug
// #1+#2: before this fix, watch only fired on cardNumber change, so
// Reset to Original cleared the preview PNG but left editableHeadline/
// editableOffer holding stale typed text; typing one character after
// Reset replayed the stale buffer and re-corrupted the card silently.
// Typing-loop safety: when user types, applyHeadline emits update-field,
// parent mutates override, computed resolvedContent updates to the same
// string the user typed, watch fires, ref is assigned the same value
// (no-op for Vue reactivity, does not disrupt caret). See Codex S61
// LOW 7 trace verification + S60 Codex Session 57 HIGH 1 (Card 2 switch
// sync) still covered via cardNumber in the key.
watch(
  () => [
    props.card.cardNumber,
    props.card.resolvedContent.headline,
    JSON.stringify(props.card.resolvedContent.headlineLines ?? null),
    props.card.resolvedContent.offerText,
    JSON.stringify(props.card.resolvedContent.offerItems ?? []),
  ],
  () => {
    editableLines.value = linesForCard();
    editableOffer.value = props.card.resolvedContent.offerText;
    editableTiers.value = (props.card.resolvedContent.offerItems ?? []).map(
      (tier) => ({ ...tier }),
    );
  },
);

function applyLines() {
  emit("update-headline-lines", { ...editableLines.value });
}

function applyOffer() {
  emit("update-field", "offerText", editableOffer.value);
}

// --- Offer tiers (S74: good/better/best coupon row) -------------------------
// 2-3 tiers render the coupon strip on the card; 0-1 keeps the classic
// single-offer strip (which the textarea above edits).
const editableTiers = ref<OfferStackItem[]>(
  (props.card.resolvedContent.offerItems ?? []).map((tier) => ({ ...tier })),
);

function applyTiers() {
  emit(
    "update-offer-items",
    editableTiers.value.map((tier) => ({ ...tier })),
  );
}

function addTier() {
  if (editableTiers.value.length >= 3) return;
  editableTiers.value.push({ label: "", value: "" });
}

function removeTier(index: number) {
  editableTiers.value.splice(index, 1);
  applyTiers();
}

// --- Checklist rows + notice text (S73: layout-specific editors) ------------
const isChecklistLayout = computed(() =>
  (props.card.renderTemplateId ?? "").startsWith("service-checklist"),
);
const isNoticeLayout = computed(() =>
  (props.card.renderTemplateId ?? "").startsWith("urgency-notice"),
);
// Both panels are replaced by the review panel on proof cards.
const showChecklistEditor = computed(
  () => isChecklistLayout.value && props.card.cardPurpose !== "proof",
);
const showNoticeEditor = computed(
  () => isNoticeLayout.value && props.card.cardPurpose !== "proof",
);

// Mirrors the worker derivation (postcard_renderer._service_rows) so the
// editor opens showing exactly what's printed before any edit exists.
const DEFAULT_SERVICE_ROWS = [
  "Repairs & Service",
  "New Installations",
  "Maintenance & Tune-Ups",
  "Free Estimates",
];
// S75-D mirror of the worker's per-trade checklist padding.
const INDUSTRY_SERVICE_ROWS: Record<string, string[]> = {
  hvac: ["A/C & Heating Repairs", "New System Installs", "Seasonal Tune-Ups", "Free Estimates"],
  plumbing: ["Drain Cleaning", "Water Heaters", "Leak Repairs", "Free Estimates"],
  roofing: ["Roof Repairs", "Full Replacements", "Storm Inspections", "Insurance Claim Help"],
  cleaning: ["Recurring Cleans", "Deep Cleans", "Move-In/Move-Out", "Supplies Included"],
  electrical: ["Repairs & Troubleshooting", "Panel Upgrades", "EV Chargers", "Safety Inspections"],
  pest_control: ["Quarterly Protection", "Termite Treatment", "Rodent Control", "Free Inspections"],
  landscaping: ["Weekly Mowing", "Spring & Fall Cleanups", "Irrigation Service", "Free Design Quotes"],
};

function rowsForCard(): string[] {
  const stored = props.card.resolvedContent.serviceRows;
  if (stored?.some((r) => r.trim())) return [...stored];
  const rows = (props.brandKit?.serviceTypes ?? [])
    .map((s) => s.trim().slice(0, 26))
    .filter(Boolean)
    .slice(0, 5);
  const pad =
    INDUSTRY_SERVICE_ROWS[(props.brandKit?.industry ?? "").toLowerCase()] ??
    DEFAULT_SERVICE_ROWS;
  for (const d of pad) {
    if (rows.length >= 4) break;
    if (!rows.includes(d)) rows.push(d);
  }
  return rows;
}

// Worker defaults shown as placeholders so an untouched card reads true.
const INDUSTRY_URGENCY: Record<string, string> = {
  hvac: "Schedule before the seasonal rush - appointments are filling fast.",
  plumbing: "Small leaks become big repairs - book your inspection this week.",
  roofing: "Storm season is coming - get your roof inspected before leaks start.",
  cleaning: "Holiday-ready homes book out early - reserve your deep clean now.",
  electrical: "Outdated panels are fire risks - book a safety inspection this month.",
  pest_control: "Pests are moving in this season - secure your home before they settle.",
  landscaping: "The best lawns book early - reserve your seasonal cleanup now.",
};
const URGENCY_DEFAULT =
  "Schedule before the seasonal rush - appointments are filling fast.";
const RISK_REVERSAL_DEFAULT = "100% Satisfaction Guarantee";

const editableRows = ref<string[]>(rowsForCard());
const editableUrgency = ref(props.card.resolvedContent.urgencyText);
const editableRiskReversal = ref(props.card.resolvedContent.riskReversal);

// Same typing-loop-safe shape as the headline watch above: the emitted
// value round-trips through resolvedContent identical to what was typed.
watch(
  () => [
    props.card.cardNumber,
    JSON.stringify(props.card.resolvedContent.serviceRows ?? null),
    props.card.resolvedContent.urgencyText,
    props.card.resolvedContent.riskReversal,
  ],
  () => {
    editableRows.value = rowsForCard();
    editableUrgency.value = props.card.resolvedContent.urgencyText;
    editableRiskReversal.value = props.card.resolvedContent.riskReversal;
  },
);

function applyRows() {
  emit("update-service-rows", [...editableRows.value]);
}

function addChecklistRow() {
  if (editableRows.value.length >= 5) return;
  editableRows.value.push("");
}

function removeChecklistRow(index: number) {
  editableRows.value.splice(index, 1);
  applyRows();
}

// --- Tips editor (S74 wave 3: tips-card layout) ------------------------------
const isTipsLayout = computed(() =>
  (props.card.renderTemplateId ?? "").startsWith("tips-card"),
);
const showTipsEditor = computed(
  () => isTipsLayout.value && props.card.cardPurpose !== "proof",
);

// Mirrors the worker's industry tip packs so the editor opens showing
// exactly what prints before any edit exists.
const INDUSTRY_TIPS: Record<string, string[]> = {
  hvac: [
    "Replace filters every 60-90 days",
    "Clear debris around the outdoor unit",
    "Keep vents open in every room",
    "Book a tune-up before peak season",
    "Listen for new rattles or buzzing",
  ],
  plumbing: [
    "Know where your water shut-off is",
    "Never pour grease down the drain",
    "Fix dripping faucets early",
    "Insulate pipes before winter",
    "Watch your water bill for spikes",
  ],
  roofing: [
    "Check shingles after every storm",
    "Keep gutters clear year-round",
    "Look for ceiling stains early",
    "Trim branches over the roof",
    "Get an inspection every 2 years",
  ],
  electrical: [
    "Test GFCI outlets twice a year",
    "Never ignore flickering lights",
    "Don't overload power strips",
    "Label your breaker panel",
    "Upgrade aging smoke detectors",
  ],
  cleaning: [
    "Declutter before deep cleans",
    "Microfiber beats paper towels",
    "Vent bathrooms to stop mildew",
    "Book recurring to keep it easy",
    "Ask about move-out checklists",
  ],
  pest_control: [
    "Seal gaps around doors and pipes",
    "Keep firewood away from the house",
    "Fix leaks - pests follow water",
    "Trim branches touching the roof",
    "Treat quarterly, not just once",
  ],
  landscaping: [
    "Water deeply, not daily",
    "Mow high in summer heat",
    "Mulch beds to lock in moisture",
    "Aerate compacted lawns each fall",
    "Book spring cleanup early",
  ],
};
const DEFAULT_TIPS = [
  "Book service before peak season",
  "Ask about maintenance plans",
  "Don't ignore small problems",
  "Keep equipment areas clear",
  "Save your service records",
];

function tipsForCard(): string[] {
  const stored = props.card.resolvedContent.tips;
  if (stored && stored.filter((t) => t.trim()).length >= 3) return [...stored];
  const industry = (props.brandKit?.industry ?? "").toLowerCase();
  return [...(INDUSTRY_TIPS[industry] ?? DEFAULT_TIPS)];
}

const editableTips = ref<string[]>(tipsForCard());

watch(
  () => [
    props.card.cardNumber,
    JSON.stringify(props.card.resolvedContent.tips ?? null),
  ],
  () => {
    editableTips.value = tipsForCard();
  },
);

function applyTips() {
  emit("update-tips", [...editableTips.value]);
}

function addTip() {
  if (editableTips.value.length >= 5) return;
  editableTips.value.push("");
}

function removeTip(index: number) {
  editableTips.value.splice(index, 1);
  applyTips();
}

// --- Letter editor (S76-C: letter-note layout) ------------------------------
const isLetterLayout = computed(() =>
  (props.card.renderTemplateId ?? "").startsWith("letter-note"),
);
const showLetterEditor = computed(
  () => isLetterLayout.value && props.card.cardPurpose !== "proof",
);

const LETTER_BODY_MAX = 520;
const SALUTATION_MAX = 48;

// Mirror the server-side default so the panel opens showing exactly what
// prints before any edit exists. Mirrors ai_generator._default_salutation:
// "Dear {City} Neighbor," when the brand kit location parses, else the
// city-less floor.
const GENERIC_LOCATIONS = new Set([
  "",
  "your area",
  "your city",
  "your town",
  "your neighborhood",
  "local",
]);
function defaultSalutation(): string {
  const loc = (props.brandKit?.location ?? "").trim();
  if (GENERIC_LOCATIONS.has(loc.toLowerCase())) return "Dear Neighbor,";
  const city = loc.split(",", 1)[0]!.trim();
  if (!city || /\d/.test(city)) return "Dear Neighbor,";
  return `Dear ${city} Neighbor,`;
}

function salutationForCard(): string {
  const stored = props.card.resolvedContent.salutation;
  return stored && stored.trim() ? stored : defaultSalutation();
}

function letterBodyForCard(): string {
  // The body is synthesized server-side when empty; until the customer
  // edits, the resolvedContent value is what prints. Empty placeholder is
  // fine here — the textarea placeholder explains the auto-fill.
  return props.card.resolvedContent.letterBody ?? "";
}

const editableSalutation = ref(salutationForCard());
const editableLetterBody = ref(letterBodyForCard());

watch(
  () => [
    props.card.cardNumber,
    props.card.resolvedContent.salutation,
    props.card.resolvedContent.letterBody,
  ],
  () => {
    editableSalutation.value = salutationForCard();
    editableLetterBody.value = letterBodyForCard();
  },
);

function applySalutation() {
  emit("update-field", "salutation", editableSalutation.value);
}

function applyLetterBody() {
  emit("update-field", "letterBody", editableLetterBody.value);
}

// --- Before/after photo slots (S74 wave 3) ----------------------------------
const isBeforeAfterLayout = computed(() =>
  (props.card.renderTemplateId ?? "").startsWith("before-after"),
);
const photoSlot = ref<"after" | "before">("after");

function applyUrgency() {
  emit("update-field", "urgencyText", editableUrgency.value);
}

function applyRiskReversal() {
  emit("update-field", "riskReversal", editableRiskReversal.value);
}

// --- Photo picker ---------------------------------------------------------
// Brand photos first (mirrors the printReady filter from usePostcardGenerator
// so operators never see low-quality scraped icons as pickable options).
// Stock photos from the industry fallback are appended so customers with a
// photo-poor brand kit still have options beyond their own library.
type PickerPhoto = {
  url: string;
  alt: string;
  source: "brand" | "stock";
  lowRes?: boolean;
};

// Sources a customer added on purpose (AI generation, stock import, upload).
// These must never silently vanish from the gallery — the printReady filter
// exists to hide low-quality SCRAPED icons, not the customer's own photos
// (S77: AI images were generated below the print bar and disappeared).
const DELIBERATE_PHOTO_SOURCES = new Set(["ai", "stock", "upload"]);

const pickerPhotos = computed<PickerPhoto[]>(() => {
  const bk = props.brandKit;
  if (!bk) return [];
  const brand: PickerPhoto[] = (bk.photos ?? [])
    .filter(
      (p: BrandKitPhoto) =>
        p.printReady !== false ||
        DELIBERATE_PHOTO_SOURCES.has((p as any).source ?? ""),
    )
    .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
    .map((p) => ({
      url: p.url,
      alt: p.alt,
      source: "brand" as const,
      lowRes: p.printReady === false,
    }));
  const stock: PickerPhoto[] = getPhotosForIndustry(bk.industry).map((p) => ({
    url: p.url,
    alt: p.description,
    source: "stock" as const,
  }));
  return [...brand, ...stock];
});

const currentPhotoUrl = computed(
  () =>
    (props.card.overrides.photoUrl as string | undefined) ??
    props.card.resolvedContent.photoUrl ??
    "",
);

function applyPhoto(url: string) {
  // before-after: each slot writes its OWN field. The After slot used to
  // write the generic photoUrl, which the worker uses as the BEFORE half's
  // fallback too — so changing After visually changed both halves until
  // Before was explicitly set (Dustin, S77).
  if (isBeforeAfterLayout.value) {
    emit(
      "update-field",
      photoSlot.value === "before" ? "beforePhotoUrl" : "afterPhotoUrl",
      url,
    );
    return;
  }
  emit("update-photo", url);
}

// --- S80 photo positioning/cropping ----------------------------------------
// Which override key the crop writes, scoped to the active slot. On
// before-after the slot toggle (before/after) picks the field; otherwise the
// main photoCrop.
const cropField = computed(() => {
  if (isBeforeAfterLayout.value) {
    return photoSlot.value === "before" ? "beforePhotoCrop" : "afterPhotoCrop";
  }
  return "photoCrop";
});

// The photo the active slot resolves to — gates the Adjust-position entry
// button (no photo → nothing to position). The crop itself is resolved + edited
// on the canvas (S81), so the panel no longer needs the per-slot crop value.
const activePhotoSrc = computed(() => {
  if (isBeforeAfterLayout.value) {
    const ov = props.card.overrides;
    const rc = props.card.resolvedContent;
    const url =
      photoSlot.value === "before"
        ? (ov.beforePhotoUrl ?? rc.beforePhotoUrl ?? rc.photoUrl)
        : (ov.afterPhotoUrl ?? rc.afterPhotoUrl ?? rc.photoUrl);
    return url ? mediaSrc(url) : "";
  }
  return currentPhotoUrl.value ? mediaSrc(currentPhotoUrl.value) : "";
});

// S81: entry point — ask the host to start ON-CANVAS adjust mode for the
// active slot (the panel no longer hosts the mini-frame). The slot's crop is
// then dragged/zoomed directly over the rendered card.
function onEnterAdjust() {
  emit("enter-photo-adjust", cropField.value);
}

// --- Stock photo search (Pexels; S72) ---------------------------------------
// S75: prefilled with a people-first trade query (the research's strongest
// finding: faces sell) so the first search lands on usable results.
const INDUSTRY_STOCK_QUERIES: Record<string, string> = {
  hvac: "hvac technician smiling homeowner",
  plumbing: "plumber working home",
  roofing: "roofer working house",
  cleaning: "house cleaner smiling",
  electrical: "electrician working home",
  pest_control: "pest control technician home",
  landscaping: "landscaper lawn home",
};
const stockQuery = ref("");
const stockResults = ref<StockPhotoResult[]>([]);
const stockSearching = ref(false);
const stockImportingId = ref<number | null>(null);
const stockError = ref<string | null>(null);
const stockConfigured = ref(false);
const stockSearched = ref(false);

// --- AI image generation (fal.ai; S72) --------------------------------------
const aiConfigured = ref(false);
const aiPrompt = ref("");
const aiGenerating = ref(false);
const aiError = ref<string | null>(null);

// --- Service-area map (Geoapify; S76) ---------------------------------------
const mapsConfigured = ref(false);
const isMapLayout = computed(() =>
  (props.card.renderTemplateId ?? "").startsWith("neighborhood-map"),
);
// The map zone is only editable on the non-proof positions (proof swaps the
// band + map callout for the review panel).
const showMapEditor = computed(
  () => isMapLayout.value && props.card.cardPurpose !== "proof",
);
// Radius options offered in the selector (miles). Default 3 matches the server.
const MAP_RADIUS_OPTIONS = [1, 2, 3, 5, 10];
// S80 view controls. Seeded from the persisted mapSettings so a reload reuses
// the customer's choices (radius + zoom + ring + offset).
const persistedMapSettings = (props.card.overrides.mapSettings ??
  null) as MapSettings | null;
const mapRadiusMiles = ref<number>(persistedMapSettings?.radiusMiles ?? 3);
const mapZoomDelta = ref<-1 | 0 | 1>(persistedMapSettings?.zoomDelta ?? 0);
const mapShowRing = ref<boolean>(persistedMapSettings?.showRing ?? true);
const mapOffsetX = ref<number>(
  persistedMapSettings?.centerOffset?.dxMiles ?? 0,
);
const mapOffsetY = ref<number>(
  persistedMapSettings?.centerOffset?.dyMiles ?? 0,
);
const MAP_ZOOM_OPTIONS: Array<{ label: string; value: -1 | 0 | 1 }> = [
  { label: "Close-up", value: 1 },
  { label: "Standard", value: 0 },
  { label: "Wide", value: -1 },
];
const MAP_MAX_OFFSET = 5;

// Nudge the view center by 1-mile steps, clamped to ±5mi. Pure so it is
// unit-tested in EditPanel.map.spec.
function nudgeMap(dx: number, dy: number) {
  mapOffsetX.value = Math.max(
    -MAP_MAX_OFFSET,
    Math.min(MAP_MAX_OFFSET, mapOffsetX.value + dx),
  );
  mapOffsetY.value = Math.max(
    -MAP_MAX_OFFSET,
    Math.min(MAP_MAX_OFFSET, mapOffsetY.value + dy),
  );
  void generateMap();
}

function resetMapView() {
  mapZoomDelta.value = 0;
  mapShowRing.value = true;
  mapOffsetX.value = 0;
  mapOffsetY.value = 0;
  void generateMap();
}

function setMapZoom(value: -1 | 0 | 1) {
  mapZoomDelta.value = value;
  void generateMap();
}

function toggleMapRing() {
  mapShowRing.value = !mapShowRing.value;
  void generateMap();
}

const mapGenerating = ref(false);
const mapError = ref<string | null>(null);
const currentMapUrl = computed(
  () =>
    (props.card.overrides.mapImageUrl as string | undefined) ??
    props.card.resolvedContent.mapImageUrl ??
    "",
);

const mapAddressDraft = ref("");

async function generateMap() {
  if (mapGenerating.value) return;
  mapGenerating.value = true;
  mapError.value = null;
  try {
    // Inline rescue path: save the freshly-typed address before generating.
    if (!props.brandKit?.address && mapAddressDraft.value.trim()) {
      await brandKitStore.update({ address: mapAddressDraft.value.trim() });
      if (brandKitStore.error) {
        mapError.value = brandKitStore.error;
        return;
      }
    }
    const res = await generateMapImage(mapRadiusMiles.value, {
      zoomDelta: mapZoomDelta.value,
      showRing: mapShowRing.value,
      centerOffset: { dxMiles: mapOffsetX.value, dyMiles: mapOffsetY.value },
    });
    if (res?.url) {
      // Apply via the same update-field pattern as before-after's
      // beforePhotoUrl flow — the card re-renders with the new map.
      emit("update-field", "mapImageUrl", res.url);
      // Persist the chosen view controls so Regenerate after reload reuses
      // them (S80). Stored on overrides.mapSettings; the worker ignores it
      // (it only consumes map_image_url) — these are client/endpoint params.
      emit("update-map-settings", {
        radiusMiles: mapRadiusMiles.value,
        zoomDelta: mapZoomDelta.value,
        showRing: mapShowRing.value,
        centerOffset: {
          dxMiles: mapOffsetX.value,
          dyMiles: mapOffsetY.value,
        },
      });
    } else {
      mapError.value = "Map generation failed — try again.";
    }
  } catch (e: any) {
    // APIError JSON shape is {error: {type, message}} — show the message,
    // not "[object Object]" or a bare status code.
    mapError.value =
      e?.data?.error?.message ||
      (typeof e?.data?.error === "string" ? e.data.error : null) ||
      e?.message ||
      "Couldn't generate the map.";
  } finally {
    mapGenerating.value = false;
  }
}

onMounted(async () => {
  if (!stockQuery.value) {
    stockQuery.value =
      INDUSTRY_STOCK_QUERIES[(props.brandKit?.industry ?? "").toLowerCase()] ??
      "friendly home service technician";
  }
  try {
    const features = await getMediaFeaturesCached();
    stockConfigured.value = features.stockConfigured;
    aiConfigured.value = features.aiConfigured;
    mapsConfigured.value = features.mapsConfigured;
  } catch {
    // Feature probe failing should never break the panel — both sections
    // simply stay hidden.
  }
});

async function generateAiPhoto() {
  const prompt = aiPrompt.value.trim();
  if (!prompt || aiGenerating.value) return;
  aiGenerating.value = true;
  aiError.value = null;
  try {
    const url = await brandKitStore.generateAiPhoto(prompt);
    if (url) {
      applyPhoto(url);
      aiPrompt.value = "";
    } else {
      aiError.value = brandKitStore.error || "Image generation failed";
    }
  } finally {
    aiGenerating.value = false;
  }
}

async function searchStock() {
  const q = stockQuery.value.trim();
  if (!q || stockSearching.value) return;
  stockSearching.value = true;
  stockError.value = null;
  try {
    const res = await searchStockPhotos(q);
    stockConfigured.value = res.configured;
    stockResults.value = res.photos;
    stockSearched.value = true;
  } catch (e: any) {
    stockError.value = e?.data?.error || e?.message || "Search failed";
  } finally {
    stockSearching.value = false;
  }
}

async function importStock(photo: StockPhotoResult) {
  if (stockImportingId.value !== null) return;
  stockImportingId.value = photo.id;
  stockError.value = null;
  try {
    const url = await brandKitStore.importStockPhoto(photo.fullUrl, photo.alt);
    if (url) {
      applyPhoto(url);
    } else {
      stockError.value = brandKitStore.error || "Import failed";
    }
  } finally {
    stockImportingId.value = null;
  }
}

// --- Photo upload (designer-side; Phase 0.2a) ------------------------------
const brandKitStore = useBrandKitStore();
const photoInput = ref<HTMLInputElement | null>(null);
const uploadingPhoto = ref(false);
const photoUploadError = ref<string | null>(null);

function pickPhotoFile() {
  photoInput.value?.click();
}

async function onPhotoFilePicked(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  photoUploadError.value = null;
  uploadingPhoto.value = true;
  try {
    const url = await brandKitStore.uploadPhoto(file);
    if (url) {
      // Select the fresh upload for this card right away.
      applyPhoto(url);
    } else {
      photoUploadError.value =
        brandKitStore.error || "Upload failed — try a JPG, PNG, or WebP.";
    }
  } finally {
    uploadingPhoto.value = false;
  }
}

// --- Review picker --------------------------------------------------------
const pickerReviews = computed<BrandKitReview[]>(
  () => props.brandKit?.reviews ?? [],
);

const currentReviewQuote = computed(
  () => props.card.resolvedContent.reviewQuote ?? "",
);

function applyReview(review: BrandKitReview) {
  emit("update-field", "reviewQuote", review.quote);
  emit("update-field", "reviewerName", review.reviewerName);
}

// --- Business info completion (skipped-onboarding rescue) ------------------
// The card PRINTS the phone number and a QR code derived from phone/website.
// A brand kit fresh out of a skipped onboarding has neither; instead of an
// unexplained "Preview unavailable", collect it right here. Saving goes
// through the normal brand-kit update path, which regenerates the QR.
const missingPhone = computed(() => !(props.brandKit?.phone ?? "").trim());
const infoPhone = ref("");
const savingInfo = ref(false);
const infoError = ref<string | null>(null);

async function saveBusinessInfo() {
  const phone = infoPhone.value.trim();
  if (!phone) return;
  infoError.value = null;
  savingInfo.value = true;
  try {
    await brandKitStore.update({ phone });
    if (brandKitStore.error) {
      infoError.value = brandKitStore.error;
      return;
    }
    emit("info-saved");
  } finally {
    savingInfo.value = false;
  }
}

// --- Business Info editor (S72: name/phone/website/logo from the designer) -
const bizDraft = ref({
  businessName: "",
  phone: "",
  websiteUrl: "",
  address: "",
  tagline: "",
  licenseNumber: "",
});
const savingBiz = ref(false);
const bizError = ref<string | null>(null);
const logoInput = ref<HTMLInputElement | null>(null);
const uploadingLogo = ref(false);
const logoError = ref<string | null>(null);

watch(
  () => [
    props.brandKit?.businessName,
    props.brandKit?.phone,
    props.brandKit?.websiteUrl,
    props.brandKit?.address,
    props.brandKit?.tagline,
    props.brandKit?.licenseNumber,
  ],
  () => {
    bizDraft.value = {
      businessName: props.brandKit?.businessName ?? "",
      phone: props.brandKit?.phone ?? "",
      websiteUrl: props.brandKit?.websiteUrl ?? "",
      address: props.brandKit?.address ?? "",
      // null = industry-derived default; show empty input with a hint.
      tagline: props.brandKit?.tagline ?? "",
      licenseNumber: props.brandKit?.licenseNumber ?? "",
    };
  },
  { immediate: true },
);

const bizDirty = computed(() => {
  const bk = props.brandKit;
  return (
    bizDraft.value.businessName.trim() !== (bk?.businessName ?? "").trim() ||
    bizDraft.value.phone.trim() !== (bk?.phone ?? "").trim() ||
    bizDraft.value.websiteUrl.trim() !== (bk?.websiteUrl ?? "").trim() ||
    bizDraft.value.address.trim() !== (bk?.address ?? "").trim() ||
    bizDraft.value.tagline.trim() !== (bk?.tagline ?? "").trim() ||
    bizDraft.value.licenseNumber.trim() !== (bk?.licenseNumber ?? "").trim()
  );
});

async function saveBizInfo() {
  if (savingBiz.value || !bizDirty.value) return;
  const addressChanged =
    bizDraft.value.address.trim() !== (props.brandKit?.address ?? "").trim();
  if (!bizDraft.value.businessName.trim()) {
    bizError.value = "Business name can't be empty — it prints on every card.";
    return;
  }
  savingBiz.value = true;
  bizError.value = null;
  try {
    // QR regenerates server-side when phone/website change.
    const payload: Record<string, string> = {
      businessName: bizDraft.value.businessName.trim(),
      phone: bizDraft.value.phone.trim(),
      websiteUrl: bizDraft.value.websiteUrl.trim(),
      address: bizDraft.value.address.trim(),
      licenseNumber: bizDraft.value.licenseNumber.trim(),
    };
    // Only send the tagline when the user actually changed it — an
    // untouched empty input on a brand with the industry-derived default
    // (tagline === null) must NOT silently remove that default when
    // saving other fields.
    if (bizDraft.value.tagline.trim() !== (props.brandKit?.tagline ?? "").trim()) {
      payload.tagline = bizDraft.value.tagline.trim();
    }
    await brandKitStore.update(payload);
    if (brandKitStore.error) {
      bizError.value = brandKitStore.error;
      return;
    }
    emit("info-saved");
    // A changed address moves the map's center — regenerate it in place so
    // the customer never has to find the Service Area Map section (S77 UX).
    if (addressChanged && isMapLayout.value && bizDraft.value.address.trim()) {
      void generateMap();
    }
  } finally {
    savingBiz.value = false;
  }
}

// --- Industry switcher (S75: internal test tool) ----------------------------
// Visible only to allowlisted internal accounts. Cosmetic gate: the
// brand-kit PUT already accepts industry from any org member; this just
// keeps the control out of customers' sight.
const TEST_TOOLS_EMAILS = new Set([
  "dustin@postcanary.com",
  "dthompson@2020tek.com",
]);
const showIndustrySwitcher = computed(() =>
  TEST_TOOLS_EMAILS.has((useAuthStore().userEmail ?? "").toLowerCase()),
);
const INDUSTRY_OPTIONS = [
  "hvac",
  "plumbing",
  "roofing",
  "cleaning",
  "electrical",
  "pest_control",
  "landscaping",
  "other",
] as const;
// The AI anchors copy in the kit's REAL services/offers (it refuses to
// invent services a business doesn't perform), so a coherent trade demo
// must swap those too — not just the industry label.
const TEST_INDUSTRY_PRESETS: Record<
  string,
  { serviceTypes: string[]; currentOffers: string[] }
> = {
  hvac: {
    serviceTypes: ["AC Repair", "Heating", "Maintenance"],
    currentOffers: ["$79 seasonal tune-up"],
  },
  plumbing: {
    serviceTypes: ["Drain Cleaning", "Water Heaters", "Leak Repair"],
    currentOffers: ["$99 drain cleaning special"],
  },
  roofing: {
    serviceTypes: ["Roof Repair", "Roof Replacement", "Storm Damage Inspections"],
    currentOffers: ["Free storm damage inspection"],
  },
  cleaning: {
    serviceTypes: ["Recurring House Cleaning", "Deep Cleans", "Move-Out Cleans"],
    currentOffers: ["$50 off your first clean"],
  },
  electrical: {
    serviceTypes: ["Electrical Repair", "Panel Upgrades", "EV Charger Installs"],
    currentOffers: ["$99 electrical safety inspection"],
  },
  pest_control: {
    serviceTypes: ["Quarterly Pest Control", "Termite Treatment", "Rodent Control"],
    currentOffers: ["$49 initial treatment"],
  },
  landscaping: {
    serviceTypes: ["Weekly Mowing", "Seasonal Cleanups", "Irrigation"],
    currentOffers: ["$75 off spring cleanup"],
  },
};
const switchingIndustry = ref(false);

async function switchIndustry(event: Event) {
  const industry = (event.target as HTMLSelectElement).value;
  if (!industry || switchingIndustry.value) return;
  switchingIndustry.value = true;
  try {
    const preset = TEST_INDUSTRY_PRESETS[industry];
    await brandKitStore.update({
      industry: industry as Industry,
      ...(preset ?? {}),
    });
    // Full trade demo: regenerate the 3 cards so headlines/offers/tiers
    // come from the new trade's playbook (replaces manual copy edits —
    // it's a test tool). Packs/taglines/defaults follow on the render.
    emit("regenerate-cards");
  } finally {
    switchingIndustry.value = false;
  }
}

function pickLogoFile() {
  logoInput.value?.click();
}

async function onLogoFilePicked(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  logoError.value = null;
  uploadingLogo.value = true;
  try {
    const ok = await brandKitStore.uploadLogo(file);
    if (!ok) {
      logoError.value = brandKitStore.error || "Logo upload failed.";
      return;
    }
    emit("info-saved");
  } finally {
    uploadingLogo.value = false;
  }
}

// --- Review add (designer-side; Phase 0.2b) --------------------------------
const addingReview = ref(false);
const newReviewText = ref("");
const newReviewName = ref("");
const newReviewRating = ref(5);
const savingReview = ref(false);
const reviewAddError = ref<string | null>(null);

async function saveNewReview() {
  const text = newReviewText.value.trim();
  if (!text) return;
  reviewAddError.value = null;
  savingReview.value = true;
  const countBefore = pickerReviews.value.length;
  try {
    await brandKitStore.addReview(
      text,
      newReviewName.value.trim(),
      newReviewRating.value,
    );
    if (brandKitStore.error) {
      reviewAddError.value = brandKitStore.error;
      return;
    }
    // Apply the just-added review to the card and reset the form.
    const added =
      pickerReviews.value[countBefore] ??
      pickerReviews.value[pickerReviews.value.length - 1];
    if (added) applyReview(added);
    newReviewText.value = "";
    newReviewName.value = "";
    newReviewRating.value = 5;
    addingReview.value = false;
  } finally {
    savingReview.value = false;
  }
}
</script>

<template>
  <div :class="isSectionMode ? '' : 'w-80 border-l border-gray-200 p-4 overflow-y-auto bg-white'">
    <h3 v-if="!isSectionMode" class="text-sm font-semibold text-[#0b2d50] mb-4">Edit Card</h3>

    <!-- Business-info completion: the phone prints on the card; collect it
         here when onboarding was skipped instead of failing the preview. -->
    <div
      v-if="missingPhone && !isSectionMode"
      data-testid="business-info-prompt"
      class="mb-3 p-3 rounded-lg border border-amber-300 bg-amber-50 space-y-2"
    >
      <div class="text-xs font-medium text-amber-800">
        Your phone number appears on the postcard — add it to finish your design.
      </div>
      <input
        v-model="infoPhone"
        data-testid="business-info-phone"
        type="tel"
        maxlength="20"
        placeholder="(555) 555-0123"
        class="w-full border border-amber-200 rounded-lg px-2 py-1.5 text-xs bg-white"
      />
      <div v-if="infoError" class="text-[11px] text-red-500">{{ infoError }}</div>
      <button
        type="button"
        data-testid="business-info-save"
        class="w-full px-3 py-1.5 rounded-lg bg-[#47bfa9] text-white text-xs font-medium hover:bg-[#3aa893] transition-colors disabled:opacity-60"
        :disabled="savingInfo || !infoPhone.trim()"
        @click="saveBusinessInfo"
      >
        {{ savingInfo ? "Saving…" : "Save & update preview" }}
      </button>
    </div>

    <div class="space-y-2">
      <!-- Edit Headline -->
      <button
        v-if="showToggles"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'headline' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('headline')"
      >
        Edit Headline
      </button>
      <div v-if="isOpen('headline')" class="px-3 pb-3 space-y-2">
        <p class="text-[11px] text-gray-500">
          Each line below is one line on the card. Leave a line blank to
          remove it from the card.
        </p>
        <div v-for="field in HEADLINE_LINE_FIELDS" :key="field.key">
          <label class="text-[10px] uppercase tracking-wide text-gray-400">
            {{ field.label }}
          </label>
          <input
            v-model="editableLines[field.key]"
            type="text"
            :maxlength="field.max"
            :data-testid="`headline-line-${field.key}`"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            @input="applyLines"
          />
        </div>
      </div>

      <!-- Edit Offer -->
      <button
        v-if="showToggles"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'offer' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('offer')"
      >
        Edit Offer
      </button>
      <div v-if="isOpen('offer')" class="px-3 pb-3">
        <textarea
          v-model="editableOffer"
          maxlength="200"
          rows="3"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          @input="applyOffer"
        />
        <div class="text-[10px] text-gray-400 mt-1 text-right">
          {{ editableOffer.length }}/200
        </div>

        <!-- Coupon tiers (S74: good/better/best row). 2-3 tiers replace the
             single offer strip on the card; below 2 the text above prints. -->
        <div class="pt-2 mt-1 border-t border-gray-100 space-y-2">
          <p class="text-[10px] uppercase tracking-wide text-gray-400">
            Coupon tiers (2&ndash;3 print as cut-out coupons)
          </p>
          <div
            v-for="(tier, i) in editableTiers"
            :key="i"
            class="flex items-center gap-2"
          >
            <input
              v-model="tier.value"
              type="text"
              maxlength="10"
              placeholder="$79"
              :data-testid="`offer-tier-value-${i}`"
              class="w-24 border border-gray-200 rounded-lg px-2 py-2 text-sm"
              @input="applyTiers"
            />
            <input
              v-model="tier.label"
              type="text"
              maxlength="30"
              placeholder="A/C Tune-Up & Safety Check"
              :data-testid="`offer-tier-label-${i}`"
              class="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm"
              @input="applyTiers"
            />
            <button
              type="button"
              :data-testid="`offer-tier-remove-${i}`"
              class="text-gray-400 hover:text-red-500 text-lg leading-none px-1"
              aria-label="Remove tier"
              @click="removeTier(i)"
            >
              &times;
            </button>
          </div>
          <button
            v-if="editableTiers.length < 3"
            type="button"
            data-testid="offer-tier-add"
            class="w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors"
            @click="addTier"
          >
            + Add coupon tier
          </button>
          <p v-if="editableTiers.length === 1" class="text-[10px] text-amber-600">
            One tier isn't enough for the coupon row — add a second, or
            remove it to print the single offer above.
          </p>
        </div>
      </div>

      <!-- Checklist rows (S73: service-checklist layout; panel is replaced
           by the review panel on proof cards) -->
      <button
        v-if="showChecklistEditor && showToggles"
        data-testid="edit-checklist-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'checklist' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('checklist')"
      >
        Edit Checklist
      </button>
      <div v-if="showChecklistEditor && isOpen('checklist')" class="px-3 pb-3 space-y-2">
        <div
          v-for="(_row, i) in editableRows"
          :key="i"
          class="flex items-center gap-2"
        >
          <input
            v-model="editableRows[i]"
            type="text"
            maxlength="26"
            :data-testid="`checklist-row-${i}`"
            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            @input="applyRows"
          />
          <button
            type="button"
            :data-testid="`checklist-row-remove-${i}`"
            class="text-gray-400 hover:text-red-500 text-lg leading-none px-1"
            aria-label="Remove row"
            @click="removeChecklistRow(i)"
          >
            &times;
          </button>
        </div>
        <button
          v-if="editableRows.length < 5"
          type="button"
          data-testid="checklist-row-add"
          class="w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors"
          @click="addChecklistRow"
        >
          + Add row
        </button>
        <p class="text-[10px] text-gray-400">
          Up to 5 rows. Remove every row to reset to your services list.
        </p>
      </div>

      <!-- Notice text (S73: urgency-notice layout; panel is replaced by
           the review panel on proof cards) -->
      <button
        v-if="showNoticeEditor && showToggles"
        data-testid="edit-notice-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'notice' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('notice')"
      >
        Edit Notice Text
      </button>
      <div v-if="showNoticeEditor && isOpen('notice')" class="px-3 pb-3 space-y-2">
        <label class="block">
          <span class="text-[10px] uppercase tracking-wide text-gray-400">Notice body</span>
          <textarea
            v-model="editableUrgency"
            maxlength="110"
            rows="3"
            data-testid="notice-body-input"
            :placeholder="INDUSTRY_URGENCY[(brandKit?.industry ?? '').toLowerCase()] ?? URGENCY_DEFAULT"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
            @input="applyUrgency"
          />
          <span class="block text-[10px] text-gray-400 mt-0.5 text-right">
            {{ editableUrgency.length }}/110 — blank prints the default above
          </span>
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-wide text-gray-400">Guarantee chip</span>
          <input
            v-model="editableRiskReversal"
            type="text"
            maxlength="60"
            data-testid="notice-guarantee-input"
            :placeholder="RISK_REVERSAL_DEFAULT"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            @input="applyRiskReversal"
          />
        </label>
      </div>

      <!-- Tips (S74: tips-card layout; panel replaced by review on proof) -->
      <button
        v-if="showTipsEditor && showToggles"
        data-testid="edit-tips-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'tips' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('tips')"
      >
        Edit Tips
      </button>
      <div v-if="showTipsEditor && isOpen('tips')" class="px-3 pb-3 space-y-2">
        <div
          v-for="(_tip, i) in editableTips"
          :key="i"
          class="flex items-center gap-2"
        >
          <input
            v-model="editableTips[i]"
            type="text"
            maxlength="38"
            :data-testid="`tip-row-${i}`"
            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            @input="applyTips"
          />
          <button
            type="button"
            :data-testid="`tip-row-remove-${i}`"
            class="text-gray-400 hover:text-red-500 text-lg leading-none px-1"
            aria-label="Remove tip"
            @click="removeTip(i)"
          >
            &times;
          </button>
        </div>
        <button
          v-if="editableTips.length < 5"
          type="button"
          data-testid="tip-row-add"
          class="w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors"
          @click="addTip"
        >
          + Add tip
        </button>
        <p class="text-[10px] text-gray-400">
          3-5 tips. Fewer than 3 prints your industry's standard tips.
        </p>
      </div>

      <!-- Letter (S76-C: letter-note layout; panel replaced by review on proof) -->
      <button
        v-if="showLetterEditor && showToggles"
        data-testid="edit-letter-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'letter' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('letter')"
      >
        Edit Letter
      </button>
      <div v-if="showLetterEditor && isOpen('letter')" class="px-3 pb-3 space-y-3">
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-600">Greeting</label>
          <input
            v-model="editableSalutation"
            type="text"
            :maxlength="SALUTATION_MAX"
            data-testid="letter-salutation"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            @input="applySalutation"
          />
          <p class="text-[10px] text-gray-400">
            Defaults from your city, e.g. "Dear {{ (brandKit?.location ?? '').split(',')[0] || 'Phoenix' }} Neighbor,". This version greets the whole neighborhood, not a specific name.
          </p>
        </div>
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-600">Letter body</label>
          <textarea
            v-model="editableLetterBody"
            rows="6"
            :maxlength="LETTER_BODY_MAX"
            data-testid="letter-body"
            placeholder="Leave blank to auto-write a warm note from your offer and reviews."
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
            @input="applyLetterBody"
          ></textarea>
          <p class="text-[10px] text-gray-400">
            {{ editableLetterBody.length }}/{{ LETTER_BODY_MAX }} characters. Your offer rides the P.S. line automatically.
          </p>
        </div>
      </div>

      <!-- Service Area Map (neighborhood-map layout; S76). Key-gated:
           only shown when the layout is active AND mapsConfigured. -->
      <button
        v-if="showMapEditor && showToggles"
        data-testid="edit-map-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'map' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('map')"
      >
        Service Area Map
      </button>
      <div v-if="showMapEditor && isOpen('map')" class="px-3 pb-3 space-y-3">
        <div v-if="!mapsConfigured" class="text-xs text-gray-500">
          Service-area maps aren't available right now.
        </div>
        <template v-else>
          <!-- No address yet: collect it INLINE — customers shouldn't have
               to discover that Business Info feeds the map (Dustin S77). -->
          <div v-if="!props.brandKit?.address" class="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
            <p class="text-xs text-amber-800 font-medium">
              First, where's your business? The map centers on your address.
            </p>
            <input
              v-model="mapAddressDraft"
              type="text"
              maxlength="140"
              placeholder="2200 E Camelback Rd, Phoenix, AZ 85016"
              data-testid="map-address-input"
              class="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              Service radius
            </label>
            <div class="flex gap-1.5" data-testid="map-radius-options">
              <button
                v-for="r in MAP_RADIUS_OPTIONS"
                :key="r"
                type="button"
                :data-testid="`map-radius-${r}`"
                class="flex-1 px-2 py-1.5 rounded-lg border text-xs transition-colors"
                :class="mapRadiusMiles === r
                  ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50] font-semibold'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                @click="mapRadiusMiles = r"
              >
                {{ r }} mi
              </button>
            </div>
          </div>

          <!-- S80 zoom level (segmented). Close-up / Standard / Wide map to
               +1 / 0 / -1 zoomDelta on the server. -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              Zoom level
            </label>
            <div class="flex gap-1.5" data-testid="map-zoom-options">
              <button
                v-for="opt in MAP_ZOOM_OPTIONS"
                :key="opt.value"
                type="button"
                :data-testid="`map-zoom-${opt.value}`"
                class="flex-1 px-2 py-1.5 rounded-lg border text-xs transition-colors"
                :class="mapZoomDelta === opt.value
                  ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50] font-semibold'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                @click="setMapZoom(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- S80 radius-ring toggle -->
          <label
            class="flex items-center justify-between text-xs font-medium text-gray-600"
          >
            <span>Show radius ring</span>
            <button
              type="button"
              role="switch"
              :aria-checked="mapShowRing"
              data-testid="map-ring-toggle"
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              :class="mapShowRing ? 'bg-[#47bfa9]' : 'bg-gray-300'"
              @click="toggleMapRing"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="mapShowRing ? 'translate-x-4' : 'translate-x-0.5'"
              />
            </button>
          </label>

          <!-- S80 3x3 nudge pad: shift the view center by 1-mile steps.
               The business pin stays put; only the framing moves. -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              Recenter view
            </label>
            <div
              class="grid grid-cols-3 gap-1 w-28"
              data-testid="map-nudge-pad"
            >
              <span></span>
              <button
                type="button"
                data-testid="map-nudge-n"
                class="px-2 py-1.5 rounded border border-gray-200 text-gray-600 hover:border-[#47bfa9]"
                aria-label="Nudge north"
                @click="nudgeMap(0, 1)"
              >↑</button>
              <span></span>
              <button
                type="button"
                data-testid="map-nudge-w"
                class="px-2 py-1.5 rounded border border-gray-200 text-gray-600 hover:border-[#47bfa9]"
                aria-label="Nudge west"
                @click="nudgeMap(-1, 0)"
              >←</button>
              <button
                type="button"
                data-testid="map-nudge-center"
                class="px-2 py-1.5 rounded border border-gray-200 text-gray-400 hover:border-[#47bfa9] text-[10px]"
                aria-label="Reset center"
                @click="nudgeMap(-mapOffsetX, -mapOffsetY)"
              >•</button>
              <button
                type="button"
                data-testid="map-nudge-e"
                class="px-2 py-1.5 rounded border border-gray-200 text-gray-600 hover:border-[#47bfa9]"
                aria-label="Nudge east"
                @click="nudgeMap(1, 0)"
              >→</button>
              <span></span>
              <button
                type="button"
                data-testid="map-nudge-s"
                class="px-2 py-1.5 rounded border border-gray-200 text-gray-600 hover:border-[#47bfa9]"
                aria-label="Nudge south"
                @click="nudgeMap(0, -1)"
              >↓</button>
              <span></span>
            </div>
            <p class="text-[10px] text-gray-400 mt-1">
              Offset: {{ mapOffsetX }}mi E/W, {{ mapOffsetY }}mi N/S
              <button
                type="button"
                data-testid="map-view-reset"
                class="ml-1 text-[#0b2d50] underline disabled:opacity-40 disabled:no-underline"
                :disabled="mapZoomDelta === 0 && mapShowRing && mapOffsetX === 0 && mapOffsetY === 0"
                @click="resetMapView"
              >Reset view</button>
            </p>
          </div>

          <img
            v-if="currentMapUrl"
            :src="mediaSrc(currentMapUrl)"
            alt="Service area map preview"
            data-testid="map-preview"
            class="w-full rounded-lg border border-gray-200"
          />

          <button
            type="button"
            data-testid="map-generate"
            :disabled="mapGenerating"
            class="w-full px-3 py-2 rounded-lg bg-[#0b2d50] text-white text-sm font-medium disabled:opacity-60"
            @click="generateMap"
          >
            {{ mapGenerating ? "Generating map…" : currentMapUrl ? "Regenerate map" : "Generate map" }}
          </button>

          <p v-if="mapError" data-testid="map-error" class="text-xs text-red-600">
            {{ mapError }}
          </p>

          <p class="text-[10px] text-gray-400 leading-snug">
            Map data © OpenStreetMap contributors © Geoapify. We use your
            business address — update it in Business Info if the map is off.
          </p>
        </template>
      </div>

      <!-- Change Photo (hidden on layouts with no photo slot —
           bold-graphic / review-forward) -->
      <button
        v-if="layoutUsesPhoto && showToggles"
        data-testid="edit-photo-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'photo' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('photo')"
      >
        Change Photo
      </button>
      <div v-if="isOpen('photo')" class="px-3 pb-3 space-y-2">
        <!-- before-after: pick which half the next photo applies to -->
        <div v-if="isBeforeAfterLayout" class="flex gap-2 mb-1">
          <button
            type="button"
            data-testid="photo-slot-after"
            class="flex-1 px-3 py-1.5 rounded-lg border text-xs transition-colors"
            :class="photoSlot === 'after' ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]' : 'border-gray-200 text-gray-500'"
            @click="photoSlot = 'after'"
          >
            After photo
          </button>
          <button
            type="button"
            data-testid="photo-slot-before"
            class="flex-1 px-3 py-1.5 rounded-lg border text-xs transition-colors"
            :class="photoSlot === 'before' ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]' : 'border-gray-200 text-gray-500'"
            @click="photoSlot = 'before'"
          >
            Before photo
          </button>
        </div>
        <input
          ref="photoInput"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          class="hidden"
          data-testid="photo-upload-input"
          @change="onPhotoFilePicked"
        />
        <button
          type="button"
          data-testid="photo-upload-button"
          class="w-full text-center px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors disabled:opacity-60"
          :disabled="uploadingPhoto"
          @click="pickPhotoFile"
        >
          {{ uploadingPhoto ? "Uploading…" : "Upload a photo (JPG, PNG, WebP)" }}
        </button>
        <div v-if="photoUploadError" class="text-[11px] text-red-500">
          {{ photoUploadError }}
        </div>
        <div v-if="pickerPhotos.length === 0" class="text-xs text-gray-400 py-1">
          No photos yet — upload one above, or add brand photos in onboarding.
        </div>
        <div v-else class="grid grid-cols-3 gap-2">
          <button
            v-for="(photo, i) in pickerPhotos"
            :key="photo.url"
            :data-testid="`photo-option-${i}`"
            :data-source="photo.source"
            :data-active="photo.url === currentPhotoUrl ? 'true' : 'false'"
            class="relative aspect-square rounded-md overflow-hidden border-2 transition-colors"
            :class="photo.url === currentPhotoUrl ? 'border-[#47bfa9]' : 'border-transparent hover:border-gray-300'"
            :title="photo.alt"
            @click="applyPhoto(photo.url)"
          >
            <img :src="mediaSrc(photo.url)" :alt="photo.alt" class="w-full h-full object-cover" />
            <span
              v-if="photo.source === 'stock'"
              class="absolute bottom-0 right-0 text-[8px] font-medium bg-gray-900/70 text-white px-1 rounded-tl"
            >Stock</span>
            <span
              v-if="photo.lowRes"
              data-testid="photo-lowres-badge"
              class="absolute top-0 left-0 text-[8px] font-medium bg-amber-500/90 text-white px-1 rounded-br"
              title="Below print resolution — may look soft when printed"
            >Low res</span>
          </button>
        </div>

        <!-- S81 Adjust position: ENTRY BUTTON. Direct manipulation moved onto
             the canvas (Dustin's S80 feedback: the side-panel mini-frame was
             small/hard to use and every nudge waited on a re-render). Clicking
             this enters on-canvas adjust mode for the active slot. Shown only
             once a photo is applied so there is something to position. -->
        <div
          v-if="activePhotoSrc"
          class="pt-2 border-t border-gray-100"
          data-testid="photo-adjust-section"
        >
          <button
            type="button"
            data-testid="photo-adjust-entry"
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#47bfa9] hover:text-[#0b2d50]"
            @click="onEnterAdjust"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path d="M10 3v14M3 10h14" stroke-linecap="round" />
              <rect x="5.5" y="5.5" width="9" height="9" rx="1.5" />
            </svg>
            Adjust position on the card
          </button>
          <p class="mt-1 text-[10px] leading-snug text-gray-400">
            Drag the photo on the card to reposition; scroll or use the slider to zoom.
          </p>
        </div>

        <!-- Stock photo search (Pexels; S72) -->
        <div v-if="stockConfigured" class="pt-2 border-t border-gray-100">
          <p class="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
            Search stock photos
          </p>
          <div class="flex gap-1">
            <input
              v-model="stockQuery"
              type="text"
              placeholder="e.g. AC technician, cozy living room"
              data-testid="stock-search-input"
              class="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
              @keydown.enter.prevent="searchStock"
            />
            <button
              type="button"
              data-testid="stock-search-button"
              class="px-3 py-1.5 rounded-lg bg-[#0b2d50] text-white text-xs disabled:opacity-50"
              :disabled="stockSearching || !stockQuery.trim()"
              @click="searchStock"
            >
              {{ stockSearching ? "…" : "Search" }}
            </button>
          </div>
          <div v-if="stockError" class="text-[11px] text-red-500 mt-1">
            {{ stockError }}
          </div>
          <div
            v-if="stockSearched && stockResults.length === 0 && !stockSearching"
            class="text-xs text-gray-400 mt-2"
          >
            No results — try a different search.
          </div>
          <div v-if="stockResults.length" class="grid grid-cols-3 gap-1.5 mt-2 max-h-56 overflow-y-auto">
            <button
              v-for="photo in stockResults"
              :key="photo.id"
              type="button"
              :data-testid="`stock-result-${photo.id}`"
              class="relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-[#47bfa9] transition-colors disabled:opacity-60"
              :disabled="stockImportingId !== null"
              :title="photo.alt || photo.photographer"
              @click="importStock(photo)"
            >
              <img :src="photo.thumbUrl" :alt="photo.alt" class="w-full h-full object-cover" loading="lazy" />
              <span
                v-if="stockImportingId === photo.id"
                class="absolute inset-0 grid place-items-center bg-white/70 text-[10px] font-medium text-gray-700"
              >Adding…</span>
            </button>
          </div>
        </div>

        <!-- AI image generation (fal.ai; S72) -->
        <div v-if="aiConfigured" class="pt-2 border-t border-gray-100">
          <p class="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
            Generate a photo with AI
          </p>
          <textarea
            v-model="aiPrompt"
            rows="2"
            maxlength="400"
            placeholder="Describe the photo — e.g. technician installing an AC unit outside a sunny suburban home"
            data-testid="ai-image-prompt"
            class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none"
          />
          <button
            type="button"
            data-testid="ai-image-generate"
            class="w-full mt-1 px-3 py-2 rounded-lg bg-[#0b2d50] text-white text-xs disabled:opacity-50"
            :disabled="aiGenerating || !aiPrompt.trim()"
            @click="generateAiPhoto"
          >
            {{ aiGenerating ? "Generating… (can take ~20s)" : "Generate photo" }}
          </button>
          <div v-if="aiError" class="text-[11px] text-red-500 mt-1">
            {{ aiError }}
          </div>
        </div>
      </div>

      <!-- Colors (S72 color profiles) -->
      <button
        v-if="showToggles"
        data-testid="edit-colors-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'colors' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('colors')"
      >
        Colors
      </button>
      <div v-if="isOpen('colors')" class="px-3 pb-3 space-y-2">
        <button
          data-testid="palette-brand"
          class="w-full text-left p-2 rounded-md border text-xs transition-colors"
          :class="!card.colorOverride ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
          @click="applyPalette(null)"
        >
          <span class="font-medium">My brand colors</span>
          <span class="text-gray-400 ml-1">(default)</span>
        </button>
        <button
          type="button"
          data-testid="edit-brand-colors-toggle"
          class="w-full text-left text-[11px] text-gray-500 hover:text-[#0b2d50] px-2"
          @click="toggleBrandColorEditor"
        >
          {{ editingBrandColors ? "Close brand color editor" : "Edit my brand colors" }}
        </button>
        <div
          v-if="editingBrandColors"
          class="p-2 rounded-md border border-gray-200 space-y-2"
        >
          <p class="text-[10px] text-gray-500">
            These are your organization's colors — saving updates every card
            that uses "My brand colors".
          </p>
          <div class="flex gap-2">
            <label
              v-for="slot in (['primary', 'secondary', 'accent'] as const)"
              :key="slot"
              class="flex-1"
            >
              <span class="block text-[10px] text-gray-400 capitalize">{{ slot }}</span>
              <input
                type="color"
                v-model="brandColorDraft[slot]"
                :data-testid="`brand-color-${slot}`"
                class="w-full h-8 rounded border border-gray-200 cursor-pointer"
              />
            </label>
          </div>
          <button
            type="button"
            data-testid="brand-colors-save"
            class="w-full px-3 py-2 rounded-lg bg-[#0b2d50] text-white text-xs disabled:opacity-50"
            :disabled="savingBrandColors"
            @click="saveBrandColors"
          >
            {{ savingBrandColors ? "Saving…" : "Save brand colors" }}
          </button>
          <div v-if="brandColorError" class="text-[11px] text-red-500">
            {{ brandColorError }}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="palette in COLOR_PALETTES"
            :key="palette.id"
            :data-testid="`palette-${palette.id}`"
            :data-active="isActivePalette(palette) ? 'true' : 'false'"
            class="text-left p-2 rounded-md border text-xs transition-colors"
            :class="isActivePalette(palette) ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
            @click="applyPalette(palette)"
          >
            <span class="flex gap-1 mb-1">
              <span class="w-4 h-4 rounded-sm" :style="{ backgroundColor: palette.primary }" />
              <span class="w-4 h-4 rounded-sm" :style="{ backgroundColor: palette.secondary }" />
              <span class="w-4 h-4 rounded-sm" :style="{ backgroundColor: palette.accent }" />
            </span>
            {{ palette.name }}
          </button>
        </div>
        <div class="pt-1">
          <p class="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Custom</p>
          <div class="flex gap-2">
            <label
              v-for="slot in (['primary', 'secondary', 'accent'] as const)"
              :key="slot"
              class="flex-1"
            >
              <span class="block text-[10px] text-gray-400 capitalize">{{ slot }}</span>
              <input
                type="color"
                :value="customColors[slot]"
                :data-testid="`custom-color-${slot}`"
                class="w-full h-8 rounded border border-gray-200 cursor-pointer"
                @input="onCustomColor(slot, ($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- Business Info (S72: org profile editable from the designer) -->
      <button
        v-if="showToggles"
        data-testid="edit-business-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'business' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('business')"
      >
        Business Info
      </button>
      <div v-if="isOpen('business')" class="px-3 pb-3 space-y-2">
        <label class="block">
          <span class="text-[10px] uppercase tracking-wide text-gray-400">Business name</span>
          <input
            v-model="bizDraft.businessName"
            type="text"
            maxlength="60"
            data-testid="biz-name-input"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-wide text-gray-400">Phone (prints on the card)</span>
          <input
            v-model="bizDraft.phone"
            type="tel"
            maxlength="20"
            data-testid="biz-phone-input"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-wide text-gray-400">Website (drives the QR code)</span>
          <input
            v-model="bizDraft.websiteUrl"
            type="text"
            maxlength="120"
            data-testid="biz-website-input"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-wide text-gray-400">Business address (return address + service-area map)</span>
          <input
            v-model="bizDraft.address"
            type="text"
            maxlength="140"
            placeholder="2200 E Camelback Rd, Phoenix, AZ 85016"
            data-testid="biz-address-input"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-wide text-gray-400">Tagline (under your name on the card)</span>
          <input
            v-model="bizDraft.tagline"
            type="text"
            maxlength="26"
            data-testid="biz-tagline-input"
            :placeholder="brandKit?.tagline == null ? 'Auto from your industry — type to replace' : ''"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <span class="block text-[10px] text-gray-400 mt-0.5">
            Leave blank and save to remove it from the card.
          </span>
        </label>
        <div
          v-if="showIndustrySwitcher"
          class="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2"
        >
          <span class="text-[10px] uppercase tracking-wide text-amber-600">Industry (internal test tool)</span>
          <select
            data-testid="industry-switcher"
            :value="brandKit?.industry ?? 'other'"
            :disabled="switchingIndustry"
            class="w-full mt-1 border border-amber-200 rounded-lg px-2 py-2 text-sm bg-white"
            @change="switchIndustry"
          >
            <option v-for="ind in INDUSTRY_OPTIONS" :key="ind" :value="ind">
              {{ ind.replace("_", " ") }}
            </option>
          </select>
          <span class="block text-[10px] text-amber-600/80 mt-1">
            Swaps services + offers to the trade's preset and regenerates
            all 3 cards (~30s). Manual edits are replaced; reviews keep
            their original wording.
          </span>
        </div>
        <label class="block">
          <span class="text-[10px] uppercase tracking-wide text-gray-400">License number (small print on the card)</span>
          <input
            v-model="bizDraft.licenseNumber"
            type="text"
            maxlength="32"
            data-testid="biz-license-input"
            placeholder="e.g. CSLB #1042689"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <span class="block text-[10px] text-gray-400 mt-0.5">
            Required on contractor ads in some states (incl. CA and FL).
          </span>
        </label>
        <button
          type="button"
          data-testid="biz-save"
          class="w-full px-3 py-2 rounded-lg bg-[#0b2d50] text-white text-xs disabled:opacity-50"
          :disabled="savingBiz || !bizDirty"
          @click="saveBizInfo"
        >
          {{ savingBiz ? "Saving…" : "Save business info" }}
        </button>
        <div v-if="bizError" class="text-[11px] text-red-500">{{ bizError }}</div>

        <div class="pt-2 border-t border-gray-100 space-y-2">
          <p class="text-[10px] uppercase tracking-wide text-gray-400">Logo</p>
          <div class="flex items-center gap-3">
            <div class="w-24 h-14 rounded border border-gray-200 bg-white grid place-items-center overflow-hidden">
              <img
                v-if="brandKit?.logoUrl"
                :src="mediaSrc(brandKit.logoUrl)"
                alt="Current logo"
                class="max-w-full max-h-full object-contain"
              />
              <span v-else class="text-[10px] text-gray-400">No logo</span>
            </div>
            <div class="flex-1">
              <input
                ref="logoInput"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                class="hidden"
                data-testid="logo-upload-input"
                @change="onLogoFilePicked"
              />
              <button
                type="button"
                data-testid="logo-upload-button"
                class="w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors disabled:opacity-60"
                :disabled="uploadingLogo"
                @click="pickLogoFile"
              >
                {{ uploadingLogo ? "Uploading…" : brandKit?.logoUrl ? "Replace logo" : "Upload logo" }}
              </button>
            </div>
          </div>
          <p class="text-[10px] text-gray-500 leading-relaxed">
            For crisp print: PNG with a transparent background, at least
            <strong>600px wide</strong> (it prints about 2.3in wide on the
            card). Wide/horizontal logos fit the layout best. JPG, PNG, or
            WebP, 15MB max.
          </p>
          <div
            v-if="brandKit?.logoUrl && brandKit?.logoPrintReady === false"
            class="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5"
            data-testid="logo-lowres-warning"
          >
            This logo is {{ brandKit?.logoWidth }}px wide — it may look soft
            when printed. A version at 600px or wider is recommended.
          </div>
          <div v-if="logoError" class="text-[11px] text-red-500">{{ logoError }}</div>
        </div>
      </div>

      <!-- Change Review -->
      <button
        v-if="showToggles"
        data-testid="edit-review-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'review' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('review')"
      >
        Change Review
      </button>
      <div v-if="isOpen('review')" class="px-3 pb-3 space-y-2">
        <div v-if="pickerReviews.length === 0 && !addingReview" class="text-xs text-gray-400 py-1">
          No reviews yet — add one below.
        </div>
        <div v-if="pickerReviews.length > 0" class="space-y-2">
          <button
            v-for="(review, i) in pickerReviews"
            :key="i"
            :data-testid="`review-option-${i}`"
            :data-active="review.quote === currentReviewQuote ? 'true' : 'false'"
            class="w-full text-left p-2 rounded-md border text-xs transition-colors"
            :class="review.quote === currentReviewQuote ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
            @click="applyReview(review)"
          >
            <div class="font-medium text-[#0b2d50] mb-0.5">
              {{ "★".repeat(Math.max(0, Math.min(5, Math.round(review.rating ?? 5)))) }}
              <span class="text-gray-500 font-normal">— {{ review.reviewerName || "Anon" }}</span>
            </div>
            <div class="text-gray-600 line-clamp-2">"{{ review.quote }}"</div>
          </button>
        </div>

        <button
          v-if="!addingReview"
          type="button"
          data-testid="review-add-button"
          class="w-full text-center px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors"
          @click="addingReview = true"
        >
          ＋ Add a customer review
        </button>
        <div v-else class="space-y-2 border border-gray-200 rounded-lg p-2">
          <textarea
            v-model="newReviewText"
            data-testid="review-add-text"
            maxlength="500"
            rows="3"
            placeholder="Paste the customer's review…"
            class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none"
          />
          <input
            v-model="newReviewName"
            data-testid="review-add-name"
            type="text"
            maxlength="60"
            placeholder="Customer name (e.g. Maria S.)"
            class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
          />
          <select
            v-model.number="newReviewRating"
            data-testid="review-add-rating"
            class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
          >
            <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">
              {{ "★".repeat(n) }} ({{ n }}/5)
            </option>
          </select>
          <div v-if="reviewAddError" class="text-[11px] text-red-500">
            {{ reviewAddError }}
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              data-testid="review-add-save"
              class="flex-1 px-3 py-1.5 rounded-lg bg-[#47bfa9] text-white text-xs font-medium hover:bg-[#3aa893] transition-colors disabled:opacity-60"
              :disabled="savingReview || !newReviewText.trim()"
              @click="saveNewReview"
            >
              {{ savingReview ? "Saving…" : "Save review" }}
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-gray-300"
              @click="addingReview = false; reviewAddError = null"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Reset -->
      <button
        v-if="showToggles"
        data-testid="reset-to-original"
        class="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2"
        @click="emit('reset')"
      >
        Reset to Original
      </button>
    </div>
  </div>
</template>
