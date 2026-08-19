// Industry slug → Creative template pack. Designs library and the send-flow
// Design step both read this map. Missing pack assets fall back to the
// current HVAC launch cards so the Design step is never empty.
//
// Human designer owns print-ready art. Do not invent pack artwork here —
// only show a pack when its assets already exist in the template catalog.

import { resolveIndustry } from "@/types/campaign";

export const TEMPLATE_PACK_IDS = [
  "neighborhood_coupons",
  "fridge_menu",
  "new_patient_tripwire",
  "local_expert",
  "fallback",
] as const;

export type TemplatePackId = (typeof TEMPLATE_PACK_IDS)[number];

export const FALLBACK_TEMPLATE_PACK_ID: TemplatePackId = "fallback";

export const INDUSTRY_TEMPLATE_PACKS: Record<
  Exclude<TemplatePackId, "fallback">,
  readonly string[]
> = {
  neighborhood_coupons: [
    "hvac",
    "plumbing",
    "roofing",
    "electrical",
    "cleaning",
    "pest_control",
    "landscaping",
    "painting",
    "remodeling",
    "windows_doors",
    "solar",
    "garage_doors",
    "handyman",
    "auto_repair",
    "auto_dealer",
    "auto_body",
  ],
  fridge_menu: ["restaurant", "pizza_qsr", "cafe_bakery"],
  new_patient_tripwire: [
    "dental",
    "chiropractic",
    "primary_care",
    "urgent_care",
    "optometry",
    "veterinary",
    "mental_health",
    "salon_spa",
    "fitness",
  ],
  local_expert: [
    "real_estate",
    "property_management",
    "mortgage",
    "legal",
    "insurance",
    "financial_advisor",
    "accounting",
  ],
};

export const FALLBACK_INDUSTRY_SLUGS = [
  "retail",
  "furniture",
  "childcare",
  "education",
  "nonprofit",
  "other",
] as const;

const SLUG_TO_PACK: Record<string, TemplatePackId> = (() => {
  const map: Record<string, TemplatePackId> = {};
  for (const [packId, slugs] of Object.entries(INDUSTRY_TEMPLATE_PACKS)) {
    for (const slug of slugs) {
      map[slug] = packId as TemplatePackId;
    }
  }
  for (const slug of FALLBACK_INDUSTRY_SLUGS) {
    map[slug] = FALLBACK_TEMPLATE_PACK_ID;
  }
  return map;
})();

export type TemplatePackCatalogEntry = {
  packId?: string | null;
  id?: string;
  tags?: readonly string[];
  status?: string;
};

/** Map a stored / typed industry value to its Creative pack. Unknown, empty, and Other/custom text → fallback. */
export function packIdForIndustrySlug(
  raw: string | null | undefined,
): TemplatePackId {
  const slug = resolveIndustry(raw);
  if (!slug) return FALLBACK_TEMPLATE_PACK_ID;
  return SLUG_TO_PACK[slug] ?? FALLBACK_TEMPLATE_PACK_ID;
}

export function entryBelongsToPack(
  entry: TemplatePackCatalogEntry,
  packId: TemplatePackId,
): boolean {
  if (entry.packId === packId) return true;
  if (entry.id?.startsWith(`${packId}-`)) return true;
  if (entry.tags?.includes(packId)) return true;
  return false;
}

export function catalogEntriesForPack(
  packId: TemplatePackId,
  catalog: readonly TemplatePackCatalogEntry[],
): TemplatePackCatalogEntry[] {
  return catalog.filter((entry) => {
    if (entry.status && entry.status !== "visible") return false;
    return entryBelongsToPack(entry, packId);
  });
}

export function packHasAssets(
  packId: TemplatePackId,
  catalog: readonly TemplatePackCatalogEntry[],
): boolean {
  return catalogEntriesForPack(packId, catalog).length > 0;
}

/**
 * Pack to show for a stored industry slug.
 * If that pack has no visible catalog assets yet, use the HVAC fallback set.
 */
export function resolveTemplatePack(
  raw: string | null | undefined,
  catalog: readonly TemplatePackCatalogEntry[],
): TemplatePackId {
  const packId = packIdForIndustrySlug(raw);
  if (packId === FALLBACK_TEMPLATE_PACK_ID) return packId;
  return packHasAssets(packId, catalog) ? packId : FALLBACK_TEMPLATE_PACK_ID;
}

export function storedIndustrySlug(
  brandIndustry?: string | null,
  profileIndustry?: string | null,
): string | null {
  const brand = brandIndustry?.trim();
  if (brand) return brand;
  const profile = profileIndustry?.trim();
  return profile || null;
}
