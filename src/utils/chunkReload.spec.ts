import { describe, it, expect } from "vitest";
import { isChunkLoadError, shouldReloadForChunkError } from "./chunkReload";

describe("isChunkLoadError", () => {
  it("matches the browser error messages for stale/missing dynamic imports", () => {
    expect(isChunkLoadError(new Error("Failed to fetch dynamically imported module: https://x/assets/Designs-abc123.js"))).toBe(true);
    expect(isChunkLoadError(new Error("Importing a module script failed"))).toBe(true);
    expect(isChunkLoadError(new TypeError("error loading dynamically imported module"))).toBe(true);
    expect(isChunkLoadError(new Error("ChunkLoadError: Loading chunk 4 failed"))).toBe(true);
  });

  it("matches by error name as well as message", () => {
    const err = new Error("something else");
    err.name = "ChunkLoadError";
    expect(isChunkLoadError(err)).toBe(true);
  });

  it("does not match unrelated errors", () => {
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadError(new TypeError("Cannot read properties of undefined"))).toBe(false);
  });

  it("handles non-Error inputs safely", () => {
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError("plain string, not an Error")).toBe(false);
    expect(isChunkLoadError("Failed to fetch dynamically imported module")).toBe(true);
  });
});

describe("shouldReloadForChunkError", () => {
  function fakeStorage(initial: Record<string, string> = {}) {
    const store = { ...initial };
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      _store: store,
    };
  }

  it("allows the first reload and records the timestamp", () => {
    const storage = fakeStorage();
    const now = 1_000_000;
    expect(shouldReloadForChunkError(storage, now)).toBe(true);
    expect(storage.getItem("pc_chunk_reload_at")).toBe(String(now));
  });

  it("refuses a second reload within the loop window", () => {
    const now = 1_000_000;
    const storage = fakeStorage({ pc_chunk_reload_at: String(now) });
    expect(shouldReloadForChunkError(storage, now + 5_000, 30_000)).toBe(false);
  });

  it("allows a reload again once the loop window has passed", () => {
    const now = 1_000_000;
    const storage = fakeStorage({ pc_chunk_reload_at: String(now) });
    expect(shouldReloadForChunkError(storage, now + 31_000, 30_000)).toBe(true);
  });
});
