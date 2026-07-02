// AI-scrape-triggers spec (2026-07-02): waitForScrapeSettled() is the
// ordering primitive Fix B relies on (generateCardsForDraft awaits it
// before reading the brand kit). Covers all four resolutions plus the
// rescan() 409/no-brandKit-yet guard behavior.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const getBrandKitMock = vi.fn();
const triggerScrapeMock = vi.fn();

vi.mock("@/api/brandKit", () => ({
  getBrandKit: (...args: unknown[]) => getBrandKitMock(...args),
  updateBrandKit: vi.fn(),
  triggerScrape: (...args: unknown[]) => triggerScrapeMock(...args),
  addManualReview: vi.fn(),
  removeReview: vi.fn(),
  uploadBrandPhoto: vi.fn(),
  uploadBrandLogo: vi.fn(),
  importStockPhoto: vi.fn(),
  generateAiImage: vi.fn(),
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ hasPostcards: true }),
}));

import { useBrandKitStore } from "./useBrandKitStore";

describe("useBrandKitStore.waitForScrapeSettled", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getBrandKitMock.mockReset();
    triggerScrapeMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves "idle" when the kit has never been scraped (absent status)', async () => {
    const store = useBrandKitStore();
    expect(store.brandKit).toBeNull();
    await expect(store.waitForScrapeSettled()).resolves.toBe("idle");
  });

  it('resolves "idle" for a "pending" (never-scraped) kit', async () => {
    const store = useBrandKitStore();
    store.brandKit = { scrapeStatus: "pending" } as any;
    await expect(store.waitForScrapeSettled()).resolves.toBe("idle");
  });

  it("resolves the terminal status immediately when not scraping", async () => {
    const store = useBrandKitStore();
    store.brandKit = { scrapeStatus: "failed" } as any;
    await expect(store.waitForScrapeSettled()).resolves.toBe("failed");

    store.brandKit = { scrapeStatus: "complete" } as any;
    await expect(store.waitForScrapeSettled()).resolves.toBe("complete");

    // partial/skipped both count as settled-and-usable, same as complete.
    store.brandKit = { scrapeStatus: "partial" } as any;
    await expect(store.waitForScrapeSettled()).resolves.toBe("complete");
    store.brandKit = { scrapeStatus: "skipped" } as any;
    await expect(store.waitForScrapeSettled()).resolves.toBe("complete");
  });

  it("polls until an in-flight scan settles to complete", async () => {
    const store = useBrandKitStore();
    store.brandKit = { scrapeStatus: "scraping" } as any;
    getBrandKitMock.mockResolvedValue({ scrapeStatus: "complete" } as any);

    const pending = store.waitForScrapeSettled();
    // _pollScrapeStatus's first tick fires after POLL_INTERVAL_MS (2s);
    // waitForScrapeSettled's own check loop then needs one more 300ms
    // tick to notice the updated status.
    await vi.advanceTimersByTimeAsync(2500);

    await expect(pending).resolves.toBe("complete");
    expect(getBrandKitMock).toHaveBeenCalled();
  });

  it('resolves "timeout" when the scan never settles within timeoutMs', async () => {
    const store = useBrandKitStore();
    store.brandKit = { scrapeStatus: "scraping" } as any;
    getBrandKitMock.mockResolvedValue({ scrapeStatus: "scraping" } as any);

    const pending = store.waitForScrapeSettled(1000);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(pending).resolves.toBe("timeout");
  });

  it("does not start a second poll loop if one is already running", async () => {
    const store = useBrandKitStore();
    store.brandKit = { scrapeStatus: "scraping" } as any;
    store.scraping = true; // a poll loop from elsewhere is already active
    getBrandKitMock.mockResolvedValue({ scrapeStatus: "scraping" } as any);

    // Nothing external ever updates brandKit in this test — proving the
    // short timeout fires (rather than hanging on a real 130s default)
    // confirms waitForScrapeSettled did NOT start its own _pollScrapeStatus
    // (which would call getBrandKit and could flip the status).
    const pending = store.waitForScrapeSettled(1000);
    await vi.advanceTimersByTimeAsync(1500);
    await expect(pending).resolves.toBe("timeout");
    expect(getBrandKitMock).not.toHaveBeenCalled();
  });
});

describe("useBrandKitStore.rescan", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getBrandKitMock.mockReset();
    triggerScrapeMock.mockReset();
    // rescan()'s 409 path can kick off _pollScrapeStatus's real setTimeout
    // loop — fake timers keep that from running loose in the background
    // after a test finishes.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("no-ops on an empty url", async () => {
    const store = useBrandKitStore();
    await store.rescan("   ");
    expect(triggerScrapeMock).not.toHaveBeenCalled();
  });

  it("trims and forwards the url to triggerScrape", async () => {
    const store = useBrandKitStore();
    triggerScrapeMock.mockResolvedValue({ scrapeStatus: "complete" } as any);
    await store.rescan("  example.com  ");
    expect(triggerScrapeMock).toHaveBeenCalledWith("example.com");
  });

  it("swallows a 409 (already scraping elsewhere) without throwing", async () => {
    const store = useBrandKitStore();
    store.brandKit = { scrapeStatus: "scraping" } as any;
    triggerScrapeMock.mockRejectedValue({ response: { status: 409 } });
    await expect(store.rescan("example.com")).resolves.toBeUndefined();
    expect(store.error).toBe("A website scan is already running");
  });
});
