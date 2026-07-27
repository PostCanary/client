import { approveMailCampaign } from "@/api/mailCampaigns";
import { useCampaignDraftListStore } from "@/stores/useCampaignDraftListStore";
import type { MailCampaign } from "@/types/campaign";

/**
 * Approval atomically consumes the source draft on the server. Refresh the
 * shared draft list as soon as that succeeds; proof and purchase work happens
 * later and must not leave the badges stale if either follow-up fails.
 */
export async function approveCampaignDraft(
  draftId: string,
): Promise<MailCampaign> {
  const campaign = await approveMailCampaign(draftId);
  void useCampaignDraftListStore().refresh();
  return campaign;
}
