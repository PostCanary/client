import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { LEGACY_RUN_CACHE_KEY, useRunStore } from "@/stores/useRunStore";

function legacyPayload() {
  return {
    savedAt: "2026-07-30T00:00:00.000Z",
    status: null,
    runResult: null,
    matches: [
      {
        mail_full_address: "REDACTED ACCOUNT A MAIL ADDRESS",
        crm_full_address: "REDACTED ACCOUNT A CRM ADDRESS",
        job_value: 1234,
      },
    ],
  };
}

describe("useRunStore tenant isolation", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("purges a legacy address cache instead of hydrating it", () => {
    localStorage.setItem(LEGACY_RUN_CACHE_KEY, JSON.stringify(legacyPayload()));

    const store = useRunStore();
    store.hydrate();

    expect(store.matches).toEqual([]);
    expect(store.runResult).toBeNull();
    expect(localStorage.getItem(LEGACY_RUN_CACHE_KEY)).toBeNull();
  });

  it("purges malformed legacy cache data", () => {
    localStorage.setItem(LEGACY_RUN_CACHE_KEY, "{not-json");

    useRunStore().hydrate();

    expect(localStorage.getItem(LEGACY_RUN_CACHE_KEY)).toBeNull();
  });

  it("keeps current run data in memory without writing localStorage", () => {
    const store = useRunStore();
    const matches = legacyPayload().matches as any;

    store.setResultAndMatches(null, matches);

    expect(store.matches).toEqual(matches);
    expect(localStorage.getItem(LEGACY_RUN_CACHE_KEY)).toBeNull();
  });

  it("rejects an in-flight response from a cleared tenant revision", () => {
    const store = useRunStore();
    const accountARevision = store.tenantRevision;

    store.clear();
    const accepted = store.setResultAndMatches(
      null,
      legacyPayload().matches as any,
      accountARevision,
    );

    expect(accepted).toBe(false);
    expect(store.matches).toEqual([]);
  });
});
