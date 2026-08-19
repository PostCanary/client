import {
  INDUSTRY_CATALOG,
  INDUSTRY_GROUPS,
  type IndustryGroupId,
} from "@/data/industryCatalog";
import {
  resolveIndustry,
  type Industry,
  type TargetingFilters,
} from "@/types/campaign";
import type { TargetingFilterSupport } from "@/types/targeting";

// POS-293: industry-group LeadGen/property suggested packs.
// Opt-in only (Filter tab chip). Never auto-apply on draft create.
// Only sets values — never nulls — so the chip reads as an "add".
// One pack per INDUSTRY_GROUPS id (no per-slug overrides).
// Consumer Ind lifestyle filters (pets, green living, vehicle Inds) are
// deferred until we ship a Consumer path for presets.

export type IndustryFilterPreset = {
  /** Stable id for tests and analytics (= group id). */
  id: IndustryGroupId;
  /** Short chip suffix: "Suggested filters for {label}". */
  label: string;
  filters: Partial<TargetingFilters>;
};

const SFR = ["Single Family"] as const;

/** Original POS-213 HVAC demo stack — group default for home services. */
export const HOME_SERVICES_PRESET: Partial<TargetingFilters> = {
  homeowner: "homeowner",
  homeValueMin: 150000,
  homeValueMax: 800000,
  yearBuiltMax: 2010,
  propertyTypes: [...SFR],
};

const GROUP_PRESETS: Record<IndustryGroupId, IndustryFilterPreset> = {
  home_services: {
    id: "home_services",
    label: "home services",
    filters: HOME_SERVICES_PRESET,
  },
  health: {
    id: "health",
    label: "health",
    filters: {
      homeowner: "homeowner",
      homeValueMin: 150000,
      homeValueMax: 900000,
      propertyTypes: [...SFR],
      // Adults / families — dental, chiro, primary care, etc.
      hhageMin: 3,
      hhageMax: 6,
      kidsMin: 1,
    },
  },
  food: {
    id: "food",
    label: "food",
    filters: {
      homeowner: "homeowner",
      homeValueMin: 100000,
      homeValueMax: 700000,
      propertyTypes: [...SFR],
      kidsMin: 1,
    },
  },
  property: {
    id: "property",
    label: "property",
    filters: {
      homeowner: "homeowner",
      homeValueMin: 200000,
      homeValueMax: 1000000,
      propertyTypes: [...SFR],
      // Recent movers — listing / just-moved mailers.
      loresMin: 0,
      loresMax: 3,
    },
  },
  auto: {
    id: "auto",
    label: "auto",
    filters: {
      homeowner: "homeowner",
      homeValueMin: 100000,
      homeValueMax: 650000,
      propertyTypes: [...SFR],
    },
  },
  professional: {
    id: "professional",
    label: "professional services",
    filters: {
      homeowner: "homeowner",
      homeValueMin: 250000,
      homeValueMax: 1200000,
      incomeMin: "E",
      propertyTypes: [...SFR],
    },
  },
  local_other: {
    id: "local_other",
    label: "local businesses",
    filters: {
      homeowner: "homeowner",
      homeValueMin: 125000,
      homeValueMax: 800000,
      propertyTypes: [...SFR],
      kidsMin: 1,
    },
  },
};

const FALLBACK_PRESET = GROUP_PRESETS.home_services;

function groupForIndustry(slug: Industry): IndustryGroupId | null {
  const entry = INDUSTRY_CATALOG.find((item) => item.slug === slug);
  return entry?.group ?? null;
}

/**
 * Resolve the suggested LeadGen/property pack for a stored industry value.
 * Maps catalog slug → industry group pack. Unknown / Other / missing →
 * home services fallback (POS-293).
 */
export function resolveIndustryFilterPreset(
  industryRaw: string | null | undefined,
): IndustryFilterPreset {
  const slug = resolveIndustry(industryRaw);
  if (!slug || slug === "other") return FALLBACK_PRESET;

  const group = groupForIndustry(slug);
  if (group) return GROUP_PRESETS[group];

  return FALLBACK_PRESET;
}

export function industryFilterPresetChipLabel(preset: IndustryFilterPreset): string {
  return `Suggested filters for ${preset.label}`;
}

/** True when the active provider can take the property keys this pack needs. */
export function industryFilterPresetAvailable(
  capabilities: TargetingFilterSupport | null,
): boolean {
  if (!capabilities) return false;
  return Boolean(capabilities.homeValueMin && capabilities.propertyTypes);
}

function clonePresetFilters(
  partial: Partial<TargetingFilters>,
): Partial<TargetingFilters> {
  const next: Partial<TargetingFilters> = { ...partial };
  if (partial.propertyTypes) {
    next.propertyTypes = [...partial.propertyTypes];
  }
  return next;
}

/**
 * Merge a preset into current filters. Never clears user-set fields the
 * preset does not define. When capabilities are provided, only apply keys
 * the registry marks true — absent keys are skipped (fail closed).
 */
export function applyIndustryFilterPreset(
  filters: TargetingFilters,
  industryRaw: string | null | undefined,
  capabilities: TargetingFilterSupport | null = null,
): TargetingFilters {
  const preset = resolveIndustryFilterPreset(industryRaw);
  const patch = clonePresetFilters(preset.filters);
  const next: TargetingFilters = { ...filters };

  for (const [key, value] of Object.entries(patch) as Array<
    [keyof TargetingFilters, TargetingFilters[keyof TargetingFilters]]
  >) {
    if (value === undefined) continue;
    if (capabilities) {
      const allowed = capabilities[key as keyof TargetingFilterSupport];
      // Absent or false → skip. Never fail-open on unknown keys.
      if (allowed !== true) continue;
    }
    if (key === "propertyTypes" && Array.isArray(value)) {
      next.propertyTypes = [...value];
      continue;
    }
    switch (key) {
      case "homeowner":
        next.homeowner = value as TargetingFilters["homeowner"];
        break;
      case "homeValueMin":
        next.homeValueMin = value as number | null;
        break;
      case "homeValueMax":
        next.homeValueMax = value as number | null;
        break;
      case "yearBuiltMin":
        next.yearBuiltMin = value as number | null;
        break;
      case "yearBuiltMax":
        next.yearBuiltMax = value as number | null;
        break;
      case "hhageMin":
        next.hhageMin = value as number | null;
        break;
      case "hhageMax":
        next.hhageMax = value as number | null;
        break;
      case "incomeMin":
        next.incomeMin = value as string | null;
        break;
      case "loresMin":
        next.loresMin = value as number | null;
        break;
      case "loresMax":
        next.loresMax = value as number | null;
        break;
      case "kidsMin":
        next.kidsMin = value as number | null;
        break;
      case "kidsMax":
        next.kidsMax = value as number | null;
        break;
      case "squareFootageMin":
        next.squareFootageMin = value as number | null;
        break;
      case "squareFootageMax":
        next.squareFootageMax = value as number | null;
        break;
      case "hasEmail":
        next.hasEmail = value as boolean | null;
        break;
      default:
        break;
    }
  }

  return next;
}

/** @deprecated Prefer applyIndustryFilterPreset — kept for POS-213 call sites/tests. */
export function applyHomeServicesPreset(filters: TargetingFilters): TargetingFilters {
  return applyIndustryFilterPreset(filters, "hvac", null);
}

/** Group labels for docs/tests. */
export function industryGroupPresetLabels(): Record<IndustryGroupId, string> {
  return Object.fromEntries(
    INDUSTRY_GROUPS.map((g) => [g.id, GROUP_PRESETS[g.id].label]),
  ) as Record<IndustryGroupId, string>;
}
