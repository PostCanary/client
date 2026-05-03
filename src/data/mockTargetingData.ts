// src/data/mockTargetingData.ts
// Area estimation utilities used by useHouseholdCount.ts fallback path.
import type { TargetingFilters } from "@/types/campaign";

const DENSITY_PER_SQ_MILE = 500;

/**
 * Estimate households in a given area.
 * Circle: π × r². Rectangle: width × height. ZIP: ~8 sq miles avg.
 */
export function estimateHouseholds(areaSqMiles: number): number {
  return Math.round(areaSqMiles * DENSITY_PER_SQ_MILE);
}

/**
 * Calculate circle area from radius in miles.
 */
export function circleAreaSqMiles(radiusMiles: number): number {
  return Math.PI * radiusMiles * radiusMiles;
}

/**
 * Approximate ZIP code area (average ~8 sq miles).
 */
export function zipAreaSqMiles(): number {
  return 8;
}

/**
 * Apply filter reductions to household count.
 */
export function applyFilterReductions(
  baseCount: number,
  filters: TargetingFilters,
): number {
  let count = baseCount;
  if (filters.homeowner === 'homeowner') count = Math.round(count * 0.65); // -35%
  if (filters.homeowner === 'investor') count = Math.round(count * 0.5); // -50%
  if (filters.propertyTypes.length > 0 && filters.propertyTypes.length < 5)
    count = Math.round(count * 0.7); // -30%
  if (filters.homeValueMin !== null || filters.homeValueMax !== null)
    count = Math.round(count * 0.6); // -40%
  if (filters.yearBuiltMin !== null || filters.yearBuiltMax !== null)
    count = Math.round(count * 0.7); // -30%
  return Math.max(count, 0);
}

