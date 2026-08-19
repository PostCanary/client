import type { TargetingFilters } from "@/types/campaign";
import type { TargetingFilterKey, TargetingFilterSupport } from "@/types/targeting";

// POS-213: shared active-filter counting so the Filter tab's "N applied"
// badge and the always-visible summary bar can never disagree. A filter
// only counts when the active provider supports it — unsupported values
// are cleared before counting, so surfacing them would overstate.
export function countActiveConsumerFilters(
  filters: TargetingFilters,
  capabilities: TargetingFilterSupport | null,
): number {
  const supports = (key: TargetingFilterKey): boolean => capabilities?.[key] ?? false;
  let count = 0;
  if (supports("homeowner") && filters.homeowner !== null) count++;
  if (
    (supports("homeValueMin") && filters.homeValueMin !== null) ||
    (supports("homeValueMax") && filters.homeValueMax !== null)
  )
    count++;
  if (
    (supports("yearBuiltMin") && filters.yearBuiltMin !== null) ||
    (supports("yearBuiltMax") && filters.yearBuiltMax !== null)
  )
    count++;
  if (supports("propertyTypes") && filters.propertyTypes.length > 0) count++;
  if (
    (supports("hhageMin") && filters.hhageMin !== null) ||
    (supports("hhageMax") && filters.hhageMax !== null)
  )
    count++;
  if (supports("incomeMin") && filters.incomeMin !== null) count++;
  if (
    (supports("loresMin") && filters.loresMin !== null) ||
    (supports("loresMax") && filters.loresMax !== null)
  )
    count++;
  if (
    (supports("kidsMin") && filters.kidsMin !== null) ||
    (supports("kidsMax") && filters.kidsMax !== null)
  )
    count++;
  if (
    (supports("squareFootageMin") && (filters.squareFootageMin ?? null) !== null) ||
    (supports("squareFootageMax") && (filters.squareFootageMax ?? null) !== null)
  )
    count++;
  if (supports("hasEmail") && (filters.hasEmail ?? null) !== null) count++;
  return count;
}

export function countActiveBusinessFilters(filters: TargetingFilters): number {
  return [
    filters.businessSicCodes?.length,
    filters.businessNaicsCodes?.length,
    filters.businessJobTitles?.length,
    filters.businessManagementLevels?.length,
    filters.businessEmployeeMin ?? filters.businessEmployeeMax,
    filters.businessSalesMin ?? filters.businessSalesMax,
    filters.businessHasEmail === true ? 1 : 0,
    filters.businessWorkAtHome === null || filters.businessWorkAtHome === undefined ? 0 : 1,
  ].filter(Boolean).length;
}
