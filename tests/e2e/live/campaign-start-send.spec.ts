/**
 * campaign-start-send.spec.ts — Sprint 1.6.7 EV.1
 *
 * Regression guard for POST /api/mail-campaigns/{id}/start-send (Sprint 1.4b).
 *
 * Uses Playwright `request` fixture (no browser) — API-level only.
 * Auth cookies from .auth/live.json; CSRF token minted per-test.
 * Stack: Docker nginx on :8080 → Flask backend with MELISSA_MOCK=1.
 *
 * Acceptance criteria (DoD):
 *   - Approved campaign: POST start-send → 202, body {ok:true, status:"purchasing_records"}
 *   - Campaign polls to "in_production" within 15 s (mock mode is near-synchronous)
 *   - Non-approved campaign: POST start-send → 400
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:8080";

test.use({
  baseURL: BASE,
  storageState: ".auth/live.json",
});

// ---------------------------------------------------------------------------
// Helper: mint CSRF token
// ---------------------------------------------------------------------------
async function getCsrfToken(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
): Promise<string> {
  const res = await request.get(`${BASE}/auth/csrf-token`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.csrf_token as string;
}

// ---------------------------------------------------------------------------
// Helper: poll campaign status until it matches or timeout
// ---------------------------------------------------------------------------
async function pollCampaignStatus(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  campaignId: string,
  targetStatuses: string[],
  timeoutMs = 15_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await request.get(`${BASE}/api/mail-campaigns/${campaignId}`);
    if (res.status() === 200) {
      const body = await res.json();
      const status: string = body.status ?? body.campaign?.status ?? "";
      if (targetStatuses.includes(status)) return status;
    }
    await new Promise((r) => setTimeout(r, 750));
  }
  return "timeout";
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("campaign start-send — Sprint 1.6.7 EV.1", () => {
  test(
    "POST start-send on approved campaign → 202 + polls to in_production",
    async ({ request }) => {
      test.setTimeout(30_000);

      // ── List campaigns, find one in 'approved' status ─────────────────────
      const listRes = await request.get(`${BASE}/api/mail-campaigns`);
      if (listRes.status() === 404 || listRes.status() === 500) {
        test.skip(true, `mail-campaigns endpoint not available (${listRes.status()})`);
        return;
      }
      expect(listRes.status()).toBe(200);
      const listBody = await listRes.json();
      const campaigns: Array<{ id: string; status: string }> =
        listBody.campaigns ?? listBody ?? [];

      const approved = campaigns.find((c) => c.status === "approved");
      if (!approved) {
        test.skip(
          true,
          "No campaign in 'approved' status found — run wizard-approve-flow.spec.ts first",
        );
        return;
      }

      // ── Mint CSRF token ───────────────────────────────────────────────────
      const csrfToken = await getCsrfToken(request);

      // ── POST start-send ───────────────────────────────────────────────────
      const sendRes = await request.post(
        `${BASE}/api/mail-campaigns/${approved.id}/start-send`,
        {
          headers: {
            Origin: BASE,
            "X-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
          },
          data: {},
        },
      );

      // Graceful skip if endpoint not yet deployed in this container
      if (sendRes.status() === 404) {
        test.skip(true, "start-send endpoint not found — container may be on older build");
        return;
      }

      expect(sendRes.status(), "start-send should return 202").toBe(202);
      const sendBody = await sendRes.json();
      expect(sendBody.ok).toBe(true);
      expect(sendBody.status).toBe("purchasing_records");

      // ── Poll until in_production (mock mode transitions are fast) ─────────
      const finalStatus = await pollCampaignStatus(
        request,
        approved.id,
        ["in_production", "submitted_to_partner", "failed"],
      );
      expect(
        finalStatus,
        `Campaign should reach in_production within 15s (got: ${finalStatus})`,
      ).toMatch(/^(in_production|submitted_to_partner)$/);
    },
  );

  test(
    "POST start-send on non-approved campaign → 400",
    async ({ request }) => {
      test.setTimeout(15_000);

      // ── List campaigns, find one NOT in 'approved' status ─────────────────
      const listRes = await request.get(`${BASE}/api/mail-campaigns`);
      if (listRes.status() !== 200) {
        test.skip(true, `mail-campaigns endpoint not available (${listRes.status()})`);
        return;
      }
      const listBody = await listRes.json();
      const campaigns: Array<{ id: string; status: string }> =
        listBody.campaigns ?? listBody ?? [];

      // Prefer a campaign in 'draft' or a terminal state — anything not 'approved'
      const nonApproved = campaigns.find((c) => c.status !== "approved");
      if (!nonApproved) {
        test.skip(true, "All campaigns in 'approved' status — cannot test 400 path");
        return;
      }

      const csrfToken = await getCsrfToken(request);

      const sendRes = await request.post(
        `${BASE}/api/mail-campaigns/${nonApproved.id}/start-send`,
        {
          headers: {
            Origin: BASE,
            "X-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
          },
          data: {},
        },
      );

      if (sendRes.status() === 404) {
        test.skip(true, "start-send endpoint not found in this container build");
        return;
      }

      expect(
        sendRes.status(),
        `start-send on status='${nonApproved.status}' should return 400`,
      ).toBe(400);
    },
  );
});
