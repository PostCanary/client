import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import {
  LEGACY_RETURN_ADDRESS_CACHE_PREFIX,
  LEGACY_RUN_CACHE_KEY,
  purgeLegacySensitiveCaches,
  useRunStore,
} from "@/stores/useRunStore";

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

  it("purges legacy return addresses for every tenant without removing unrelated preferences", () => {
    localStorage.setItem(
      `${LEGACY_RETURN_ADDRESS_CACHE_PREFIX}org-a`,
      JSON.stringify({ name: "Account A", line_1: "123 Private St" }),
    );
    localStorage.setItem(
      `${LEGACY_RETURN_ADDRESS_CACHE_PREFIX}org-b`,
      JSON.stringify({ name: "Account B", line_1: "456 Private Ave" }),
    );
    localStorage.setItem("pc:sidebar-collapsed", "1");

    purgeLegacySensitiveCaches();

    expect(localStorage.getItem(`${LEGACY_RETURN_ADDRESS_CACHE_PREFIX}org-a`)).toBeNull();
    expect(localStorage.getItem(`${LEGACY_RETURN_ADDRESS_CACHE_PREFIX}org-b`)).toBeNull();
    expect(localStorage.getItem("pc:sidebar-collapsed")).toBe("1");
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
