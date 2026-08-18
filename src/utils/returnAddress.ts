import type { OrgReturnAddress } from "@/api/orgs";

export const ZIP_RE = /^\d{5}(-\d{4})?$/;
export const STATE_RE = /^[A-Za-z]{2}$/;

export type ReturnAddressFields = {
  address: string;
  city: string;
  state: string;
  zip: string;
  name?: string;
  address2?: string;
};

export function validateReturnAddressForm(
  fields: ReturnAddressFields,
): string | null {
  if (!fields.address.trim()) return "Street address is required.";
  if (!fields.city.trim()) return "City is required.";
  if (!STATE_RE.test(fields.state.trim())) return "State must be a 2-letter code.";
  if (!ZIP_RE.test(fields.zip.trim())) {
    return "ZIP must be 5 digits or ZIP+4 (12345 or 12345-6789).";
  }
  return null;
}

export function isCompleteReturnAddress(
  addr: Partial<{
    [K in keyof OrgReturnAddress]: OrgReturnAddress[K] | null;
  }> | null | undefined,
): boolean {
  if (!addr) return false;
  return (
    validateReturnAddressForm({
      address: addr.address ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zip: addr.zip ?? "",
    }) === null
  );
}

export function toReturnAddressPayload(
  fields: ReturnAddressFields,
): OrgReturnAddress {
  return {
    name: fields.name?.trim() || null,
    address: fields.address.trim(),
    address2: fields.address2?.trim() || null,
    city: fields.city.trim(),
    state: fields.state.trim().toUpperCase(),
    zip: fields.zip.trim(),
  };
}
