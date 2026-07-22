// src/composables/useCampaignList.ts
import { ref, computed } from "vue";
import type { MailCampaign, CampaignDraft } from "@/types/campaign";
import { listMailCampaigns } from "@/api/mailCampaigns";
import { listDrafts } from "@/api/campaignDrafts";

// Customer-facing campaign tabs are separate from the internal mail-campaign
// lifecycle: drafts come from campaign_drafts, while every persisted
// post-approval mail campaign belongs in Sent.
export type CampaignTab = "draft" | "sent";

export function useCampaignList() {
  const campaigns = ref<MailCampaign[]>([]);
  const drafts = ref<CampaignDraft[]>([]);
  const loading = ref(false);
  const activeTab = ref<CampaignTab>("draft");
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
    if (activeTab.value === "sent") {
      // Keep the server lifecycle opaque to customers. This intentionally
      // includes approved, paused, printing, in_transit, delivered, results,
      // completed, and any future post-approval status.
      list = list.filter((c) => c.status !== "draft");
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
    draft: drafts.value.length,
    sent: campaigns.value.filter((c) => c.status !== "draft").length,
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
