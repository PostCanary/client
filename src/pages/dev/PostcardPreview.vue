<script setup lang="ts">
import { ref, computed } from "vue";
import PostcardFront from "@/components/postcard/PostcardFront.vue";
import PostcardBack from "@/components/postcard/PostcardBack.vue";
import type {
  CardDesign,
  TemplateLayoutType,
  TrustBadge,
} from "@/types/campaign";

// Brief #6 Phase 2 dev-only preview route.
// Renders PostcardFront + PostcardBack with editable mock props so Drake
// can visually verify template changes without running the wizard or
// booting a real backend. Not linked from navigation — open via URL:
//     http://localhost:5173/dev/postcard-preview
// (or whichever port Vite is on — 5175 right now)

// --- Editable state ---

const layoutTypes: TemplateLayoutType[] = [
  "full-bleed",
  "side-split",
  "photo-top",
  "bold-graphic",
  "before-after",
  "review-forward",
];
const selectedLayout = ref<TemplateLayoutType>("full-bleed");

// Phase 2 (02-01-03): Desert Diamond HVAC demo defaults.
// All values from CONTEXT.md §specifics + D-10/D-11/D-12.
const businessName = ref("Desert Diamond HVAC");
const city = ref("Phoenix");
const state = ref("AZ");
const streetAddress = ref("1234 E McDowell Rd"); // TODO: confirm real Desert Diamond street address
const zip = ref("85008"); // TODO: confirm real Desert Diamond ZIP
const phone = ref("(623) 246-2377");
// NOTE: website field is editable below (P0-C fix 2026-04-10). The previous
// hard-coded "martinezplumbing.com" default leaked onto Desert Diamond
// renders during the session 32 smoke test because there was no form
// control to override it — Playwright injection could only touch exposed
// fields.
const website = ref("desertdiamondhvac.com");
const yearsInBusiness = ref(12);
// P0-E fix 2026-04-10: expose a QR code URL field so the dev route renders
// a real QR on the back instead of passing "" through to CTABox (which
// then silently renders nothing). In production this comes from the
// brand kit / mail-campaigns endpoint; in dev we want to verify the
// CTABox's QR render path.
//
// Default is an inline data: SVG of a QR-shaped pattern, not a hosted
// image. Codex LOW finding 2026-04-10: external URLs (api.qrserver.com)
// make the dev preview nondeterministic under offline/CSP restrictions
// right before a demo. The SVG below is a 21×21 module pattern that
// *looks* like a QR code for visual QA purposes — it does NOT decode to
// a real URL. Customers will never see this; production QRs come from
// the server's qr_codes.py service.
const DEV_QR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" shape-rendering="crispEdges">
<rect width="21" height="21" fill="#fff"/>
<g fill="#000">
<rect x="0" y="0" width="7" height="1"/><rect x="0" y="6" width="7" height="1"/>
<rect x="0" y="0" width="1" height="7"/><rect x="6" y="0" width="1" height="7"/>
<rect x="2" y="2" width="3" height="3"/>
<rect x="14" y="0" width="7" height="1"/><rect x="14" y="6" width="7" height="1"/>
<rect x="14" y="0" width="1" height="7"/><rect x="20" y="0" width="1" height="7"/>
<rect x="16" y="2" width="3" height="3"/>
<rect x="0" y="14" width="7" height="1"/><rect x="0" y="20" width="7" height="1"/>
<rect x="0" y="14" width="1" height="7"/><rect x="6" y="14" width="1" height="7"/>
<rect x="2" y="16" width="3" height="3"/>
<rect x="8" y="0" width="1" height="1"/><rect x="10" y="0" width="1" height="2"/>
<rect x="12" y="0" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/>
<rect x="11" y="3" width="2" height="1"/><rect x="8" y="4" width="1" height="2"/>
<rect x="10" y="5" width="3" height="1"/><rect x="9" y="7" width="1" height="1"/>
<rect x="11" y="7" width="1" height="1"/><rect x="13" y="7" width="1" height="1"/>
<rect x="8" y="8" width="1" height="1"/><rect x="10" y="8" width="1" height="2"/>
<rect x="12" y="9" width="1" height="1"/><rect x="14" y="8" width="1" height="1"/>
<rect x="16" y="8" width="2" height="1"/><rect x="19" y="8" width="1" height="1"/>
<rect x="8" y="10" width="2" height="1"/><rect x="11" y="10" width="1" height="2"/>
<rect x="13" y="10" width="1" height="1"/><rect x="15" y="10" width="2" height="1"/>
<rect x="18" y="10" width="1" height="1"/><rect x="20" y="10" width="1" height="1"/>
<rect x="9" y="12" width="1" height="1"/><rect x="12" y="12" width="1" height="2"/>
<rect x="14" y="12" width="1" height="1"/><rect x="16" y="12" width="1" height="2"/>
<rect x="19" y="12" width="2" height="1"/><rect x="8" y="14" width="1" height="1"/>
<rect x="10" y="14" width="2" height="1"/><rect x="13" y="14" width="1" height="1"/>
<rect x="15" y="14" width="1" height="2"/><rect x="17" y="14" width="1" height="1"/>
<rect x="20" y="14" width="1" height="1"/><rect x="9" y="16" width="1" height="2"/>
<rect x="11" y="16" width="1" height="1"/><rect x="13" y="16" width="2" height="1"/>
<rect x="16" y="16" width="1" height="1"/><rect x="18" y="16" width="2" height="1"/>
<rect x="8" y="18" width="1" height="1"/><rect x="10" y="18" width="3" height="1"/>
<rect x="14" y="18" width="1" height="1"/><rect x="16" y="18" width="1" height="2"/>
<rect x="19" y="18" width="1" height="1"/><rect x="8" y="20" width="1" height="1"/>
<rect x="11" y="20" width="1" height="1"/><rect x="13" y="20" width="2" height="1"/>
<rect x="17" y="20" width="2" height="1"/><rect x="20" y="20" width="1" height="1"/>
</g></svg>`;
const qrCodeUrl = ref(
  `data:image/svg+xml;utf8,${encodeURIComponent(DEV_QR_SVG)}`
);

const headline = ref("Phoenix Homeowners: Your AC Tune-Up Is Due");
const offerText = ref("$277 VALUE FOR JUST $79");
const offerTeaser = ref("$79 TUNE-UP");
const urgencyText = ref("Offer expires May 15, 2026");
// P0-F content density 2026-04-10: populate a sample value stack so the
// OfferBox renders with ✓ items on every dev-route preview. Previously
// PostcardBack was hardcoded to pass `[]`, which meant every preview
// showed only the offer headline + deadline with zero body content —
// reading as "corporate SaaS" next to Mail Shark references that pack
// 3-5 checkmarked value items into the same vertical space.
const offerItemsText = ref(
  "23-Point Safety Check | $49 value\n" +
    "Condenser Coil Cleaning | $79 value\n" +
    "Refrigerant Level Check | $59 value\n" +
    "Free Estimate on Any Repair | priceless"
);
const reviewQuote = ref(
  "Fixed our AC in under an hour on a 108-degree day. John was professional and saved us $500."
);
const reviewerName = ref("Sarah M.");
const riskReversal = ref("Free estimate · Satisfaction guaranteed");
const credibilityLine = ref("Serving Phoenix since 2014");

const rating = ref(4.9);
const reviewCount = ref(2423);

// TODO D-11: replace with real scraped Desert Diamond worker photo before final demo render
const photoUrl = ref(
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200"
);

// Brand colors — Desert Diamond HVAC: blue (trust) + orange (urgency/warmth)
const brandPrimary = ref("#0488F5");
const brandDark = ref("#F97B22");

// Preview scale (for fitting the 9in card into the viewport — pt units
// are absolute so we scale the wrapper, not the content, to preview
// smaller than physical print size)
const previewScale = ref(1.0);

// --- Derived ---

const brandColors = computed(() => [brandPrimary.value, brandDark.value]);
const businessAddress = computed(
  () => `${streetAddress.value}, ${city.value}, ${state.value} ${zip.value}`
);

// Parse the textarea-formatted offer items. One per line, split on "|".
// "Service Name | $49 value" → { label: "Service Name", value: "$49 value" }
// Lines without "|" become label-only items (no right-aligned value).
// Empty lines + whitespace are filtered out.
const offerItems = computed(() =>
  offerItemsText.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [labelRaw, valueRaw] = line.split("|").map((s) => s.trim());
      return valueRaw
        ? { label: labelRaw, value: valueRaw }
        : { label: labelRaw };
    })
);

const trustBadges = computed<TrustBadge[]>(() => [
  { type: "bbb", label: "BBB A+", confidence: "high" },
  { type: "angi", label: "Angi Certified", confidence: "high" },
  { type: "homeadvisor", label: "HomeAdvisor Top Rated", confidence: "medium" },
]);

const mockCard = computed<CardDesign>(() => ({
  cardNumber: 1,
  cardPurpose: "offer",
  templateId: `${selectedLayout.value}-preview`,
  previewImageUrl: "",
  overrides: {},
  resolvedContent: {
    headline: headline.value,
    offerText: offerText.value,
    offerTeaser: offerTeaser.value,
    offerItems: offerItems.value,
    photoUrl: photoUrl.value,
    reviewQuote: reviewQuote.value,
    reviewerName: reviewerName.value,
    phoneNumber: phone.value,
    urgencyText: urgencyText.value,
    riskReversal: riskReversal.value,
    trustSignals: [],
  },
  backContent: {
    guarantee: "100% Satisfaction Guaranteed",
    certifications: ["Licensed", "Insured", "Bonded"],
    licenseNumber: "ROC #123456",
    companyAddress: businessAddress.value,
    websiteUrl: website.value,
    qrCodeUrl: qrCodeUrl.value,
  },
  headlineCandidates: [],
  offerReason: "",
  reviewReason: "",
  templateReason: "",
}));
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6 font-sans">
    <div class="max-w-6xl mx-auto">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">
          Postcard Preview — Brief #6 Phase 2
        </h1>
        <p class="text-sm text-gray-600 mt-1">
          Dev-only route. Live mock data. Edit any field below to see the
          templates update.
        </p>
        <p class="text-xs text-gray-500 mt-2">
          Print size is 9×6&quot; (864×576px at 96dpi). Use the scale slider
          below to shrink the preview without distorting the pt-based type
          scale.
        </p>
      </header>

      <!-- Controls -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">Layout</span>
          <select v-model="selectedLayout" class="border rounded px-2 py-1">
            <option v-for="l in layoutTypes" :key="l" :value="l">{{ l }}</option>
          </select>
        </label>
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">Business name</span>
          <input v-model="businessName" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">City</span>
          <input v-model="city" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">Phone</span>
          <input v-model="phone" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col col-span-2 md:col-span-2">
          <span class="text-gray-600 text-xs mb-0.5">Headline</span>
          <input v-model="headline" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col col-span-2 md:col-span-2">
          <span class="text-gray-600 text-xs mb-0.5">Credibility line (front badge)</span>
          <input v-model="credibilityLine" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col col-span-2 md:col-span-2">
          <span class="text-gray-600 text-xs mb-0.5">Offer text (back)</span>
          <input v-model="offerText" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col col-span-2 md:col-span-2">
          <span class="text-gray-600 text-xs mb-0.5">Offer teaser (front badge, ≤4 words)</span>
          <input v-model="offerTeaser" class="border rounded px-2 py-1" maxlength="24" />
        </label>
        <label class="flex flex-col col-span-2 md:col-span-2">
          <span class="text-gray-600 text-xs mb-0.5">Offer deadline</span>
          <input v-model="urgencyText" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col col-span-2 md:col-span-4">
          <span class="text-gray-600 text-xs mb-0.5">
            Offer value stack (one per line, format: "Label | $value")
          </span>
          <textarea
            v-model="offerItemsText"
            rows="5"
            class="border rounded px-2 py-1 font-mono text-xs"
          />
        </label>
        <label class="flex flex-col col-span-2 md:col-span-4">
          <span class="text-gray-600 text-xs mb-0.5">Review quote</span>
          <input v-model="reviewQuote" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">Reviewer name</span>
          <input v-model="reviewerName" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">Rating</span>
          <input
            v-model.number="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            class="border rounded px-2 py-1"
          />
        </label>
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">Review count</span>
          <input
            v-model.number="reviewCount"
            type="number"
            min="0"
            class="border rounded px-2 py-1"
          />
        </label>
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">Years in business</span>
          <input
            v-model.number="yearsInBusiness"
            type="number"
            min="0"
            class="border rounded px-2 py-1"
          />
        </label>
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">Primary color (accent)</span>
          <input v-model="brandPrimary" type="color" class="border rounded px-2 py-1 h-9" />
        </label>
        <label class="flex flex-col">
          <span class="text-gray-600 text-xs mb-0.5">Dark brand color</span>
          <input v-model="brandDark" type="color" class="border rounded px-2 py-1 h-9" />
        </label>
        <label class="flex flex-col col-span-2">
          <span class="text-gray-600 text-xs mb-0.5">Hero photo URL</span>
          <input v-model="photoUrl" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col col-span-2">
          <span class="text-gray-600 text-xs mb-0.5">Website URL (back CTA)</span>
          <input v-model="website" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col col-span-2 md:col-span-4">
          <span class="text-gray-600 text-xs mb-0.5">QR code image URL (back)</span>
          <input v-model="qrCodeUrl" class="border rounded px-2 py-1" />
        </label>
        <label class="flex flex-col col-span-2 md:col-span-4">
          <span class="text-gray-600 text-xs mb-0.5">Preview scale — {{ previewScale.toFixed(2) }}x (print output is always at physical size)</span>
          <input
            v-model.number="previewScale"
            type="range"
            min="0.4"
            max="1.2"
            step="0.05"
          />
        </label>
      </div>

      <!-- Front card -->
      <section class="mb-8">
        <h2 class="text-sm font-bold text-gray-700 mb-2">
          PostcardFront — {{ selectedLayout }}
        </h2>
        <div
          class="bg-white rounded-lg shadow-md overflow-hidden"
          :style="{
            width: `${864 * previewScale}px`,
            height: `${576 * previewScale}px`,
          }"
        >
          <div
            :style="{
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              width: '864px',
              height: '576px',
            }"
          >
            <PostcardFront
              :card="mockCard"
              :layout-type="selectedLayout"
              :brand-colors="brandColors"
              :business-name="businessName"
              :logo-url="null"
              :credibility-line="credibilityLine"
            />
          </div>
        </div>
      </section>

      <!-- Back card -->
      <section>
        <h2 class="text-sm font-bold text-gray-700 mb-2">
          PostcardBack — 6-block layout
        </h2>
        <div
          class="bg-white rounded-lg shadow-md overflow-hidden"
          :style="{
            width: `${864 * previewScale}px`,
            height: `${576 * previewScale}px`,
          }"
        >
          <div
            :style="{
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              width: '864px',
              height: '576px',
            }"
          >
            <PostcardBack
              :card="mockCard"
              :brand-colors="brandColors"
              :business-name="businessName"
              :business-address="businessAddress"
              :rating="rating"
              :review-count="reviewCount"
              :trust-badges="trustBadges"
              :years-in-business="yearsInBusiness"
              :city="city"
              :hide-address-placeholder="true"
            />
          </div>
        </div>
      </section>

      <footer class="mt-8 text-xs text-gray-500">
        <p>
          This route is dev-only and not linked from navigation. Not built into
          production bundles (see router.ts meta.dev guard).
        </p>
      </footer>
    </div>
  </div>
</template>
