// src/stores/useRunStore.ts
import { defineStore } from "pinia";
import type { RunStatus, RunResult, MatchRow } from "@/api/runs";

export const LEGACY_RUN_CACHE_KEY = "mt:run-cache:v1";
export const LEGACY_RETURN_ADDRESS_CACHE_PREFIX = "postcanary:lastReturnAddress:";

export function purgeLegacySensitiveCaches(): void {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return;

    storage.removeItem(LEGACY_RUN_CACHE_KEY);

    const returnAddressKeys = Array.from(
      { length: storage.length },
      (_, index) => storage.key(index),
    ).filter(
      (key): key is string =>
        typeof key === "string" &&
        key.startsWith(LEGACY_RETURN_ADDRESS_CACHE_PREFIX),
    );

    for (const key of returnAddressKeys) {
      storage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
}

export const useRunStore = defineStore("run", {
  state: () => ({
    hydrated: false as boolean,
    savedAt: null as string | null,
    tenantRevision: 0,

    status: null as RunStatus | null,
    runResult: null as RunResult | null,
    matches: [] as MatchRow[],
  }),

  actions: {
    hydrate() {
      if (this.hydrated) return;

      // POS-202: never hydrate tenant data from browser-persistent storage.
      purgeLegacySensitiveCaches();
      this.hydrated = true;
    },

    persist() {
      // Keep the existing in-session store contract without persisting customer
      // addresses, revenue, run IDs, or user IDs across identity boundaries.
      this.savedAt = new Date().toISOString();
      purgeLegacySensitiveCaches();
    },

    clear() {
      this.savedAt = null;
      this.status = null;
      this.runResult = null;
      this.matches = [];
      this.tenantRevision += 1;
      purgeLegacySensitiveCaches();
      this.hydrated = true;
    },

    setStatus(s: RunStatus | null, expectedTenantRevision?: number): boolean {
      if (
        expectedTenantRevision !== undefined &&
        expectedTenantRevision !== this.tenantRevision
      ) {
        return false;
      }
      this.status = s;
      this.persist();
      return true;
    },

    setResultAndMatches(
      r: RunResult | null | undefined,
      m: MatchRow[] | null | undefined,
      expectedTenantRevision?: number,
    ): boolean {
      if (
        expectedTenantRevision !== undefined &&
        expectedTenantRevision !== this.tenantRevision
      ) {
        return false;
      }
      if (r !== undefined) this.runResult = r;
      if (m !== undefined) this.matches = Array.isArray(m) ? m : [];
      this.persist();
      return true;
    },
  },
});
