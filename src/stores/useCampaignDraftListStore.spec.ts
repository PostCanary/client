import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/api/campaignDrafts", () => ({
  listDrafts: vi.fn(),
}));

import { listDrafts } from "@/api/campaignDrafts";
import { useCampaignDraftListStore } from "./useCampaignDraftListStore";

function persistedDraft(
  id: string,
  orgId: string,
  currentStep: number,
  needsReview = false,
) {
  return {
    id,
    orgId,
    currentStep,
    needsReviewSteps: needsReview ? [3, 4] : [],
  } as any;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

describe("useCampaignDraftListStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(listDrafts).mockReset();
  });

  it("counts the full persisted dataset for its recorded organization", async () => {
    vi.mocked(listDrafts).mockResolvedValue([
      persistedDraft("returned-to-step-2", "org-a", 2),
      persistedDraft("at-step-3", "org-a", 3),
      persistedDraft("older-review-required", "org-a", 4, true),
    ]);
    const store = useCampaignDraftListStore();
    store.setActiveOrg("org-a");

    expect(store.count).toBeNull();
    await expect(store.refresh("org-a")).resolves.toBe(true);

    expect(store.loadedOrgId).toBe("org-a");
    expect(store.drafts.map((draft) => draft.id)).toEqual([
      "returned-to-step-2",
      "at-step-3",
      "older-review-required",
    ]);
    expect(store.count).toBe(3);
  });

  it("clears the prior tenant immediately when the active org changes", async () => {
    vi.mocked(listDrafts).mockResolvedValue([
      persistedDraft("org-a-draft", "org-a", 3),
    ]);
    const store = useCampaignDraftListStore();
    store.setActiveOrg("org-a");
    await store.refresh("org-a");
    store.error = "old error";

    store.setActiveOrg("org-b");

    expect(store.activeOrgId).toBe("org-b");
    expect(store.loadedOrgId).toBeNull();
    expect(store.drafts).toEqual([]);
    expect(store.hasLoaded).toBe(false);
    expect(store.count).toBeNull();
    expect(store.error).toBeNull();
  });

  it("starts the new org independently and ignores a late prior-org response", async () => {
    const orgA = deferred<any[]>();
    const orgB = deferred<any[]>();
    vi.mocked(listDrafts)
      .mockReturnValueOnce(orgA.promise)
      .mockReturnValueOnce(orgB.promise);
    const store = useCampaignDraftListStore();

    store.setActiveOrg("org-a");
    const refreshA = store.refresh("org-a");
    store.setActiveOrg("org-b");
    const refreshB = store.refresh("org-b");

    expect(listDrafts).toHaveBeenCalledTimes(2);
    orgB.resolve([persistedDraft("org-b-draft", "org-b", 3)]);
    await expect(refreshB).resolves.toBe(true);
    expect(store.count).toBe(1);
    expect(store.drafts[0]?.id).toBe("org-b-draft");

    orgA.resolve([
      persistedDraft("org-a-draft-1", "org-a", 3),
      persistedDraft("org-a-draft-2", "org-a", 4),
    ]);
    await expect(refreshA).resolves.toBe(false);
    expect(store.activeOrgId).toBe("org-b");
    expect(store.loadedOrgId).toBe("org-b");
    expect(store.count).toBe(1);
    expect(store.drafts[0]?.id).toBe("org-b-draft");
  });

  it("deduplicates only requests for the same org revision", async () => {
    const orgA = deferred<any[]>();
    const orgB = deferred<any[]>();
    vi.mocked(listDrafts)
      .mockReturnValueOnce(orgA.promise)
      .mockReturnValueOnce(orgB.promise);
    const store = useCampaignDraftListStore();

    store.setActiveOrg("org-a");
    const firstA = store.refresh("org-a");
    const secondA = store.refresh("org-a");
    expect(listDrafts).toHaveBeenCalledTimes(1);

    store.setActiveOrg("org-b");
    const firstB = store.refresh("org-b");
    const secondB = store.refresh("org-b");
    expect(listDrafts).toHaveBeenCalledTimes(2);

    orgA.resolve([]);
    orgB.resolve([persistedDraft("org-b-draft", "org-b", 3)]);
    await expect(Promise.all([firstA, secondA])).resolves.toEqual([
      false,
      false,
    ]);
    await expect(Promise.all([firstB, secondB])).resolves.toEqual([true, true]);
  });

  it("retains the last good same-org dataset when refresh fails", async () => {
    const store = useCampaignDraftListStore();
    store.setActiveOrg("org-a");
    vi.mocked(listDrafts).mockResolvedValueOnce([
      persistedDraft("draft-1", "org-a", 2),
      persistedDraft("draft-2", "org-a", 4),
    ]);
    await expect(store.refresh("org-a")).resolves.toBe(true);

    vi.mocked(listDrafts).mockRejectedValueOnce(new Error("offline"));
    await expect(store.refresh("org-a")).resolves.toBe(false);

    expect(store.activeOrgId).toBe("org-a");
    expect(store.loadedOrgId).toBe("org-a");
    expect(store.count).toBe(2);
    expect(store.drafts).toHaveLength(2);
    expect(store.error).toBe("Unable to refresh campaign drafts.");
  });

  it("ignores a stale mutation caller from a different org", async () => {
    const store = useCampaignDraftListStore();
    store.setActiveOrg("org-b");

    await expect(store.refresh("org-a")).resolves.toBe(false);

    expect(listDrafts).not.toHaveBeenCalled();
    expect(store.activeOrgId).toBe("org-b");
  });
});
