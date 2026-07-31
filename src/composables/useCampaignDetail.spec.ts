import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MailCampaign, MailCampaignOrder } from "@/types/campaign";
import { getMailCampaign } from "@/api/mailCampaigns";
import { useCampaignDetail } from "@/composables/useCampaignDetail";

vi.mock("@/api/mailCampaigns", () => ({
  getMailCampaign: vi.fn(),
  pauseMailCampaign: vi.fn(),
  resumeMailCampaign: vi.fn(),
}));

function campaign(order: MailCampaignOrder): MailCampaign {
  return {
    id: "campaign-1",
    name: "Durable retry",
    order,
    orderContractPresent: true,
  } as MailCampaign;
}

function order(recoveryAction: "retry_purchase" | "none"): MailCampaignOrder {
  return {
    recovery_action: recoveryAction,
  } as MailCampaignOrder;
}

describe("useCampaignDetail refresh preservation", () => {
  beforeEach(() => {
    vi.mocked(getMailCampaign).mockReset();
  });

  it("preserves an installed POST order when the follow-up GET fails", async () => {
    const detail = useCampaignDetail("campaign-1");
    vi.mocked(getMailCampaign).mockResolvedValueOnce(
      campaign(order("retry_purchase")),
    );
    await detail.fetch();

    detail.campaign.value = campaign(order("none"));
    vi.mocked(getMailCampaign).mockRejectedValueOnce(new Error("refresh failed"));
    await detail.fetch();

    expect(detail.error.value).toBe("Failed to load campaign");
    expect(detail.campaign.value?.order?.recovery_action).toBe("none");
  });
});
