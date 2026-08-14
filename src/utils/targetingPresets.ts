import type { TargetingFilters } from "@/types/campaign";

// POS-213: the old S69 HVAC demo defaults, now an explicit opt-in preset.
// Fresh drafts start with NO filters (geo-only counts route to Data
// Retriever Consumer); this stack only applies when the user clicks the
// "Suggested filters for home services" chip in the Filter tab.
export const HOME_SERVICES_PRESET: Partial<TargetingFilters> = {
  homeowner: "homeowner",
  homeValueMin: 150000,
  homeValueMax: 800000,
  yearBuiltMin: null,
  yearBuiltMax: 2010,
  propertyTypes: ["Single Family"],
};

export function applyHomeServicesPreset(filters: TargetingFilters): TargetingFilters {
  return {
    ...filters,
    ...HOME_SERVICES_PRESET,
    propertyTypes: [...(HOME_SERVICES_PRESET.propertyTypes ?? [])],
  };
}
