// src/stores/useRunStore.ts
import { defineStore } from "pinia";
import type { RunStatus, RunResult, MatchRow } from "@/api/runs";

const LS_KEY = "mt:run-cache:v1";
const MAX_MATCHES_PERSIST = 250; // keep small; matches can be huge

type Persisted = {
  savedAt: string; // ISO
  status: RunStatus | null;
  runResult: RunResult | null;
  matches: MatchRow[]; // capped
};

function safeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export const useRunStore = defineStore("run", {
  state: () => ({
    hydrated: false as boolean,
    savedAt: null as string | null,

    status: null as RunStatus | null,
    runResult: null as RunResult | null,
    matches: [] as MatchRow[],
  }),

  actions: {
    hydrate() {
      if (this.hydrated) return;

      const data = safeParse<Persisted>(localStorage.getItem(LS_KEY));
      if (data) {
        this.savedAt = data.savedAt || null;
        this.status = data.status ?? null;
        this.runResult = data.runResult ?? null;
        this.matches = Array.isArray(data.matches) ? data.matches : [];
      }

      this.hydrated = true;
    },

    persist() {
      const payload: Persisted = {
        savedAt: new Date().toISOString(),
        status: this.status,
        runResult: this.runResult,
        matches: (this.matches || []).slice(0, MAX_MATCHES_PERSIST),
      };

      this.savedAt = payload.savedAt;
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    },

    clear() {
      this.savedAt = null;
      this.status = null;
      this.runResult = null;
      this.matches = [];
      localStorage.removeItem(LS_KEY);
    },

    setStatus(s: RunStatus | null) {
      this.status = s;
      this.persist();
    },

    setResultAndMatches(r: RunResult | null, m: MatchRow[] | null | undefined) {
      if (r) this.runResult = r;
      if (m) this.matches = m;
      this.persist();
    },
  },
});
