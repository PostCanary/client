// src/composables/useCampaignDetail.ts
import { ref, onUnmounted } from "vue";
import type { MailCampaign } from "@/types/campaign";
import {
  getMailCampaign,
  pauseMailCampaign,
  resumeMailCampaign,
} from "@/api/mailCampaigns";

export function useCampaignDetail(campaignId: string) {
  const campaign = ref<MailCampaign | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Mock status progression timers
  const timers: ReturnType<typeof setTimeout>[] = [];

  async function fetch() {
    loading.value = true;
    error.value = null;
    try {
      campaign.value = await getMailCampaign(campaignId);
      // Start mock progression if just approved
      if (campaign.value.status === "approved") {
        startMockProgression();
      }
    } catch {
      error.value = "Failed to load campaign";
    } finally {
      loading.value = false;
    }
  }

  function startMockProgression() {
    // Simulate: approved → printing (30s) → in_transit (60s) → delivered (90s)
    const progressions: { status: MailCampaign["status"]; delayMs: number }[] =
      [
        { status: "printing", delayMs: 30000 },
        { status: "in_transit", delayMs: 60000 },
        { status: "delivered", delayMs: 90000 },
      ];

    for (const p of progressions) {
      const t = setTimeout(() => {
        if (campaign.value) {
          campaign.value = { ...campaign.value, status: p.status };
          // Also update card statuses
          if (campaign.value.cards?.length) {
            campaign.value.cards = campaign.value.cards.map((card) => ({
              ...card,
              status:
                p.status === "delivered"
                  ? "delivered"
                  : p.status === "in_transit"
                    ? "in_transit"
                    : p.status === "printing"
                      ? "printing"
                      : card.status,
            }));
          }
        }
      }, p.delayMs);
      timers.push(t);
    }
  }

  async function pause() {
    if (!campaign.value) return;
    campaign.value = await pauseMailCampaign(campaign.value.id);
    // Clear mock timers
    timers.forEach(clearTimeout);
  }

  async function resume() {
    if (!campaign.value) return;
    campaign.value = await resumeMailCampaign(campaign.value.id);
  }

  onUnmounted(() => {
    timers.forEach(clearTimeout);
  });

  return { campaign, loading, error, fetch, pause, resume };
}
