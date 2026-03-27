// src/composables/useCampaignList.ts
import { ref, computed } from "vue";
import type { MailCampaign, CampaignDraft } from "@/types/campaign";
import { listMailCampaigns } from "@/api/mailCampaigns";
import { listDrafts } from "@/api/campaignDrafts";

export type CampaignTab = "active" | "drafts" | "completed" | "paused";

const ACTIVE_STATUSES = ["approved", "printing", "in_transit", "delivered"];

export function useCampaignList() {
  const campaigns = ref<MailCampaign[]>([]);
  const drafts = ref<CampaignDraft[]>([]);
  const loading = ref(false);
  const activeTab = ref<CampaignTab>("active");
  const searchQuery = ref("");
  const sortBy = ref<"newest" | "oldest">("newest");

  async function fetch() {
    loading.value = true;
    try {
      const [c, d] = await Promise.all([listMailCampaigns(), listDrafts()]);
      campaigns.value = c;
      drafts.value = d;
    } catch {
      // Fail silently — empty lists shown
    } finally {
      loading.value = false;
    }
  }

  const filtered = computed(() => {
    let list = campaigns.value;

    // Filter by tab
    if (activeTab.value === "active") {
      list = list.filter((c) => ACTIVE_STATUSES.includes(c.status));
    } else if (activeTab.value === "completed") {
      list = list.filter(
        (c) => c.status === "completed" || c.status === "results_ready",
      );
    } else if (activeTab.value === "paused") {
      list = list.filter((c) => c.status === "paused");
    }

    // Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Sort
    list = [...list].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortBy.value === "newest" ? db - da : da - db;
    });

    return list;
  });

  const tabCounts = computed(() => ({
    active: campaigns.value.filter((c) =>
      ACTIVE_STATUSES.includes(c.status),
    ).length,
    drafts: drafts.value.length,
    completed: campaigns.value.filter(
      (c) => c.status === "completed" || c.status === "results_ready",
    ).length,
    paused: campaigns.value.filter((c) => c.status === "paused").length,
  }));

  return {
    campaigns,
    drafts,
    loading,
    activeTab,
    searchQuery,
    sortBy,
    filtered,
    tabCounts,
    fetch,
  };
}
