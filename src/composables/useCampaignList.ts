// src/composables/useCampaignList.ts
import { ref, computed } from "vue";
import type { MailCampaign, CampaignDraft } from "@/types/campaign";
import { listMailCampaigns } from "@/api/mailCampaigns";
import { listDrafts } from "@/api/campaignDrafts";

// POS-151: Campaigns history — In Progress / Sent tabs per the Dashboard
// Flow wireframe (Flow 3), with Drafts kept as a third tab so the existing
// resume/delete-draft UX isn't lost (the wireframe only calls out two).
export type CampaignTab = "in_progress" | "sent" | "drafts";

const SENT_STATUSES = ["delivered", "results_ready", "completed"];

export function useCampaignList() {
  const campaigns = ref<MailCampaign[]>([]);
  const drafts = ref<CampaignDraft[]>([]);
  const loading = ref(false);
  const activeTab = ref<CampaignTab>("in_progress");
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
      list = list.filter((c) => SENT_STATUSES.includes(c.status));
    } else if (activeTab.value === "in_progress") {
      list = list.filter((c) => !SENT_STATUSES.includes(c.status));
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
    in_progress: campaigns.value.filter(
      (c) => !SENT_STATUSES.includes(c.status),
    ).length,
    sent: campaigns.value.filter((c) => SENT_STATUSES.includes(c.status))
      .length,
    drafts: drafts.value.length,
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
