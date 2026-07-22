import { expect, test, type Page, type Route } from "@playwright/test";

const DRAFT_ID = "11111111-1111-4111-8111-111111111111";
const CAMPAIGN_ID = "33333333-3333-4333-8333-333333333333";

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installApprovalFlowMocks(page: Page) {
  await page.route("**/auth/me", (route) =>
    json(route, {
      authenticated: true,
      user_id: "user-owner",
      email: "alex@example.test",
      full_name: "Alex Owner",
      role: "owner",
      avatar_url: "",
      features: ["postcards"], // S85 gate: spec org is approved
      org_id: "22222222-2222-4222-8222-222222222222",
      org_name: "Alpha HVAC",
      org_role: "owner",
      orgs: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "Alpha HVAC",
          slug: "alpha-hvac",
          role: "owner",
        },
      ],
      billing: {
        is_subscribed: true,
        needs_paywall: false,
        can_run_matching: true,
      },
    }),
  );

  await page.route("**/api/users/me", (route) =>
    json(route, {
      ok: true,
      profile_complete: true,
      full_name: "Alex Owner",
      email: "alex@example.test",
    }),
  );

  await page.route("**/auth/csrf-token", (route) =>
    json(route, { csrf_token: "test-csrf" }),
  );

  await page.route("**/api/config", (route) => json(route, { ok: true }));

  await page.route("**/preview-card/1", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: "preview" }),
  );

  await page.route(`**/api/campaign-drafts/${DRAFT_ID}`, (route) =>
    json(route, {
      ok: true,
      id: DRAFT_ID,
      org_id: "22222222-2222-4222-8222-222222222222",
      created_by: "user-owner",
      current_step: 4,
      completed_steps: [1, 2, 3, 4],
      needs_review_steps: [],
      data: route.request().postDataJSON()?.data ?? {},
      schema_version: 1,
      created_at: "2026-05-25T02:20:00.000Z",
      updated_at: "2026-05-25T02:20:01.000Z",
    }),
  );
}

test.describe("StepReview approval artifact flow", () => {
  test("keeps approve disabled when no draft is loaded", async ({ page }) => {
    await installApprovalFlowMocks(page);

    await page.goto("/dev/step-review-approval-flow?emptyDraft=1");
    await page.getByLabel(/I confirm all information/i).check();

    await expect(
      page.getByRole("button", { name: /Approve & Send Mailing/i }),
    ).toBeDisabled();
  });

  test("saves approval proof before buying mailing records", async ({ page }) => {
    const sideEffects: string[] = [];
    let artifactPayload: Record<string, unknown> | null = null;
    let purchasePayload: Record<string, unknown> | null = null;

    await installApprovalFlowMocks(page);

    await page.route("**/api/mail-campaigns", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      sideEffects.push("create");
      return json(route, {
        ok: true,
        id: CAMPAIGN_ID,
        org_id: "22222222-2222-4222-8222-222222222222",
        created_by: "user-owner",
        name: "Neighbor Marketing - 55422",
        status: "approved",
        goal_type: "neighbor_marketing",
        service_type: "HVAC Tune-Up",
        sequence_length: 1,
        household_count: 10,
        total_cost: 7.9,
        total_spent: 0,
        targeting_data: {},
        design_data: {},
        schedule_data: {},
        cards_data: [],
        approved_at: "2026-05-25T02:20:00.000Z",
        draft_id: DRAFT_ID,
        created_at: "2026-05-25T02:20:00.000Z",
        updated_at: "2026-05-25T02:20:00.000Z",
      });
    });

    await page.route(
      `**/api/mail-campaigns/${CAMPAIGN_ID}/approval-artifact`,
      async (route) => {
        sideEffects.push("artifact");
        artifactPayload = route.request().postDataJSON();
        return json(route, {
          ok: true,
          id: "44444444-4444-4444-8444-444444444444",
          org_id: "22222222-2222-4222-8222-222222222222",
          mail_campaign_id: CAMPAIGN_ID,
          created_by: "user-owner",
          source_draft_id: DRAFT_ID,
          artifact_type: "approval_proof",
          storage_backend: "railway_volume",
          storage_key:
            "orgs/22222222-2222-4222-8222-222222222222/mail-campaigns/" +
            `${CAMPAIGN_ID}/44444444-4444-4444-8444-444444444444`,
          manifest: {},
          manifest_sha256: "a".repeat(64),
          terms_version: "accuracy-rights-v1",
          acknowledged_at: artifactPayload?.acknowledged_at,
          created_at: "2026-05-25T02:20:01.000Z",
        });
      },
    );

    await page.route(
      `**/api/mail-campaigns/${CAMPAIGN_ID}/purchase-records`,
      async (route) => {
        sideEffects.push("purchase");
        purchasePayload = route.request().postDataJSON();
        return json(route, {
          order_id: "melissa-order-1",
          record_count: 10,
          sample: [],
          source: "melissa",
        });
      },
    );

    await page.goto("/dev/step-review-approval-flow");
    await page.getByLabel(/I confirm all information/i).check();
    await page.getByRole("button", { name: /Approve & Send Mailing/i }).click();

    await expect(page.getByText("Your campaign is live!")).toBeVisible();
    expect(sideEffects).toEqual(["create", "artifact", "purchase"]);
    expect(artifactPayload?.acknowledged_at).toEqual(expect.any(String));
    expect(artifactPayload?.terms_version).toBe("accuracy-rights-v1");
    expect(purchasePayload).toEqual({ qty: 10 });
  });

  test("retries artifact failure without approving the deleted draft again", async ({
    page,
  }) => {
    const sideEffects: string[] = [];
    let createCalls = 0;
    let artifactCalls = 0;
    let draftSaveCalls = 0;

    await installApprovalFlowMocks(page);

    await page.route(`**/api/campaign-drafts/${DRAFT_ID}`, (route) => {
      if (route.request().method() === "PUT") {
        draftSaveCalls += 1;
      }
      return json(route, {
        ok: true,
        id: DRAFT_ID,
        org_id: "22222222-2222-4222-8222-222222222222",
        created_by: "user-owner",
        current_step: 4,
        completed_steps: [1, 2, 3, 4],
        needs_review_steps: [],
        data: route.request().postDataJSON()?.data ?? {},
        schema_version: 1,
        created_at: "2026-05-25T02:20:00.000Z",
        updated_at: "2026-05-25T02:20:01.000Z",
      });
    });

    await page.route("**/api/mail-campaigns", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      createCalls += 1;
      sideEffects.push("create");
      return json(route, {
        ok: true,
        id: CAMPAIGN_ID,
        org_id: "22222222-2222-4222-8222-222222222222",
        created_by: "user-owner",
        name: "Neighbor Marketing - 55422",
        status: "approved",
        goal_type: "neighbor_marketing",
        service_type: "HVAC Tune-Up",
        sequence_length: 1,
        household_count: 10,
        total_cost: 7.9,
        total_spent: 0,
        targeting_data: {},
        design_data: {},
        schedule_data: {},
        cards_data: [],
        approved_at: "2026-05-25T02:20:00.000Z",
        draft_id: DRAFT_ID,
        created_at: "2026-05-25T02:20:00.000Z",
        updated_at: "2026-05-25T02:20:00.000Z",
      });
    });

    await page.route(
      `**/api/mail-campaigns/${CAMPAIGN_ID}/approval-artifact`,
      async (route) => {
        artifactCalls += 1;
        sideEffects.push("artifact");
        if (artifactCalls === 1) {
          return json(route, { ok: false, error: "render unavailable" }, 503);
        }
        return json(route, {
          ok: true,
          id: "44444444-4444-4444-8444-444444444444",
          org_id: "22222222-2222-4222-8222-222222222222",
          mail_campaign_id: CAMPAIGN_ID,
          created_by: "user-owner",
          source_draft_id: DRAFT_ID,
          artifact_type: "approval_proof",
          storage_backend: "railway_volume",
          storage_key:
            "orgs/22222222-2222-4222-8222-222222222222/mail-campaigns/" +
            `${CAMPAIGN_ID}/44444444-4444-4444-8444-444444444444`,
          manifest: {},
          manifest_sha256: "a".repeat(64),
          terms_version: "accuracy-rights-v1",
          acknowledged_at: "2026-05-25T02:20:00.000Z",
          created_at: "2026-05-25T02:20:01.000Z",
        });
      },
    );

    await page.route(
      `**/api/mail-campaigns/${CAMPAIGN_ID}/purchase-records`,
      async (route) => {
        sideEffects.push("purchase");
        return json(route, {
          order_id: "melissa-order-1",
          record_count: 10,
          sample: [],
          source: "melissa",
        });
      },
    );

    await page.goto("/dev/step-review-approval-flow");
    await page.getByLabel(/I confirm all information/i).check();
    const approveButton = page.getByRole("button", {
      name: /Approve & Send Mailing/i,
    });

    await approveButton.click();
    await expect.poll(() => sideEffects.join(",")).toBe("create,artifact");
    await expect(approveButton).toBeEnabled();

    await approveButton.click();
    await expect(page.getByText("Your campaign is live!")).toBeVisible();
    await page.waitForTimeout(700);

    expect(createCalls).toBe(1);
    expect(artifactCalls).toBe(2);
    expect(draftSaveCalls).toBe(1);
    expect(sideEffects).toEqual(["create", "artifact", "artifact", "purchase"]);
  });

  test("shows an actionable message when the server requires a one-mailing review", async ({
    page,
  }) => {
    await installApprovalFlowMocks(page);
    await page.route("**/api/mail-campaigns", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      return json(
        route,
        { error: { details: { code: "single_mailing_required" } } },
        400,
      );
    });

    await page.goto("/dev/step-review-approval-flow");
    await page.getByLabel(/I confirm all information/i).check();
    await page.getByRole("button", { name: /Approve & Send Mailing/i }).click();

    await expect(
      page.getByText(/This draft needs a one-mailing review before it can be approved/i),
    ).toBeVisible();
  });
});
