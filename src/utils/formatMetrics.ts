// src/utils/formatMetrics.ts
/** Shared number formatters for Match Strip / Revenue Chip. */

export function fmtInt(n: number | null | undefined): string {
  if (!Number.isFinite(n as number)) return "0";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function fmtMoney(n: number | null | undefined): string {
  if (!Number.isFinite(n as number)) return "$0";
  return Number(n).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function fmtMoneyPrecise(n: number | null | undefined): string {
  if (!Number.isFinite(n as number)) return "$0.00";
  return Number(n).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

/** Accepts 0–1 or 0–100 rates from the API. */
export function fmtPct(n: number | null | undefined): string {
  if (!Number.isFinite(n as number) || n === 0) return "0%";
  const raw = Number(n);
  const v = raw <= 1 ? raw * 100 : raw;
  return `${v.toFixed(1)}%`;
}
