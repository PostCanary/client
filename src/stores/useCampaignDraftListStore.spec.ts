import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/api/campaignDrafts", () => ({
  listDrafts: vi.fn(),
}));

import { listDrafts } from "@/api/campaignDrafts";
import { useCampaignDraftListStore } from "./useCampaignDraftListStore";

function persistedDraft(id: string, currentStep: number, needsReview = false) {
  return {
    id,
    currentStep,
    needsReviewSteps: needsReview ? [3, 4] : [],
  } as any;
}

describe("useCampaignDraftListStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(listDrafts).mockReset();
  });

  it("counts the full persisted dataset, including Step 2 and review-required drafts", async () => {
    vi.mocked(listDrafts).mockResolvedValue([
      persistedDraft("returned-to-step-2", 2),
      persistedDraft("at-step-3", 3),
      persistedDraft("older-review-required", 4, true),
    ]);

    const firstConsumer = useCampaignDraftListStore();
    const secondConsumer = useCampaignDraftListStore();

    expect(firstConsumer.count).toBeNull();
    await expect(firstConsumer.refresh()).resolves.toBe(true);

    expect(secondConsumer).toBe(firstConsumer);
    expect(secondConsumer.drafts.map((draft) => draft.id)).toEqual([
      "returned-to-step-2",
      "at-step-3",
      "older-review-required",
    ]);
    expect(secondConsumer.count).toBe(3);
  });

  it("hides unknown initial state and retains the last good count after refresh failure", async () => {
    const store = useCampaignDraftListStore();
    vi.mocked(listDrafts).mockRejectedValueOnce(new Error("offline"));

    await expect(store.refresh()).resolves.toBe(false);
    expect(store.count).toBeNull();
    expect(store.drafts).toEqual([]);

    vi.mocked(listDrafts).mockResolvedValueOnce([
      persistedDraft("draft-1", 2),
      persistedDraft("draft-2", 4),
    ]);
    await expect(store.refresh()).resolves.toBe(true);
    expect(store.count).toBe(2);

    vi.mocked(listDrafts).mockRejectedValueOnce(new Error("offline again"));
    await expect(store.refresh()).resolves.toBe(false);
    expect(store.count).toBe(2);
    expect(store.drafts).toHaveLength(2);
  });

  it("coalesces concurrent refreshes into one API request", async () => {
    let resolve!: (drafts: any[]) => void;
    vi.mocked(listDrafts).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const store = useCampaignDraftListStore();

    const first = store.refresh();
    const second = store.refresh();
    resolve([persistedDraft("draft-1", 3)]);

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(listDrafts).toHaveBeenCalledTimes(1);
    expect(store.count).toBe(1);
  });
});
