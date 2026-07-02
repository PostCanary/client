// src/composables/useCampaignDetail.ts
import { ref } from "vue";
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

  async function fetch() {
    loading.value = true;
    error.value = null;
    try {
      campaign.value = await getMailCampaign(campaignId);
    } catch {
      error.value = "Failed to load campaign";
    } finally {
      loading.value = false;
    }
  }

  async function pause() {
    if (!campaign.value) return;
    campaign.value = await pauseMailCampaign(campaign.value.id);
  }

  async function resume() {
    if (!campaign.value) return;
    campaign.value = await resumeMailCampaign(campaign.value.id);
  }

  return { campaign, loading, error, fetch, pause, resume };
}
