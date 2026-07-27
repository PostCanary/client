import {
  expect,
  test,
  type Page,
  type Route,
  type TestInfo,
} from "@playwright/test";

const DRAFT_ID = "11111111-1111-4111-8111-111111111111";
const ORG_ID = "22222222-2222-4222-8222-222222222222";
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

  await page.route("**/api/mail-campaigns/schedule-availability", (route) =>
    json(route, {
      ok: true,
      earliest_mailing_date: "2026-07-29",
      timezone: "America/Los_Angeles",
      approval_cutoff_local: "17:00:00",
      cutoff_inclusive: true,
      processing_business_days: 1,
      holiday_calendar: "us_federal_observed_nationwide",
    }),
  );

  await page.route("**/preview-card/1", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: "preview" }),
  );

  // approveCampaignDraft performs a best-effort shared badge refresh as soon
  // as approval consumes the draft. Keep every approval-flow test isolated
  // from the dev server proxy even when it does not assert the badge itself.
  await page.route("**/api/campaign-drafts", (route) =>
    json(route, { ok: true, drafts: [] }),
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

function persistedDraftResponse(data: Record<string, unknown> = {}) {
  return {
    ok: true,
    id: DRAFT_ID,
    org_id: ORG_ID,
    created_by: "user-owner",
    current_step: 4,
    completed_steps: [1, 2, 3],
    needs_review_steps: [],
    data: {
      campaignType: "targeted",
      goal: {
        goalType: "neighbor_marketing",
        goalLabel: "Neighbor Marketing",
        serviceType: "HVAC Tune-Up",
        sequenceLength: 1,
        sequenceSpacingDays: 14,
        otherGoalText: null,
      },
      ...data,
    },
    schema_version: 1,
    created_at: "2026-07-27T14:00:00.000Z",
    updated_at: "2026-07-27T14:01:00.000Z",
  };
}

function approvedCampaignResponse() {
  return {
    ok: true,
    id: CAMPAIGN_ID,
    org_id: ORG_ID,
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
    approved_at: "2026-07-27T14:05:00.000Z",
    draft_id: DRAFT_ID,
    created_at: "2026-07-27T14:00:00.000Z",
    updated_at: "2026-07-27T14:05:00.000Z",
  };
}

async function attachScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
) {
  const path = testInfo.outputPath(name);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

test.describe("StepReview approval artifact flow", () => {
  test("keeps POS-170 draft badges synchronized through POS-175 approval in one SPA runtime", async ({
    page,
  }, testInfo) => {
    await installApprovalFlowMocks(page);

    let draftConsumed = false;
    let approvalPosted!: () => void;
    const approvalBoundary = new Promise<void>((resolve) => {
      approvalPosted = resolve;
    });
    let releaseArtifact!: () => void;
    const artifactReleased = new Promise<void>((resolve) => {
      releaseArtifact = resolve;
    });
    const draftListSizes: number[] = [];
    const unexpectedDraftRequests: string[] = [];
    const failedDraftRequests: string[] = [];

    page.on("requestfailed", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/campaign-drafts")) {
        failedDraftRequests.push(
          `${request.method()} ${new URL(request.url()).pathname}`,
        );
      }
    });

    await page.route("**/api/campaigns/**", (route) =>
      json(route, { campaigns: [] }),
    );
    await page.route("**/api/billing/pricing", (route) =>
      json(route, { pay_per_send: 0.79, custom_design_fee: 199 }),
    );
    await page.route("**/api/organizations/return-address", (route) =>
      json(route, {
        ok: true,
        return_address: {
          name: "Alpha HVAC",
          address: "123 Comfort Way",
          address2: null,
          city: "Golden Valley",
          state: "MN",
          zip: "55422",
        },
      }),
    );

    // Catch every campaign-drafts request so a missing proxy mock cannot be
    // mistaken for a shared-store success.
    await page.route("**/api/campaign-drafts**", (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (pathname === "/api/campaign-drafts" && request.method() === "GET") {
        const drafts = draftConsumed ? [] : [persistedDraftResponse()];
        draftListSizes.push(drafts.length);
        return json(route, { ok: true, drafts });
      }
      if (
        pathname === `/api/campaign-drafts/${DRAFT_ID}` &&
        request.method() === "PUT"
      ) {
        const data = request.postDataJSON()?.data ?? {};
        return json(route, persistedDraftResponse(data));
      }
      if (
        pathname === `/api/campaign-drafts/${DRAFT_ID}/preview-card/1` &&
        request.method() === "POST"
      ) {
        return route.fulfill({
          status: 200,
          contentType: "image/png",
          body: "preview",
        });
      }
      unexpectedDraftRequests.push(`${request.method()} ${pathname}`);
      return json(route, { error: { message: "unexpected draft request" } }, 501);
    });

    await page.route("**/api/mail-campaigns", (route) => {
      const method = route.request().method();
      if (method === "GET") {
        return json(route, {
          ok: true,
          campaigns: draftConsumed ? [approvedCampaignResponse()] : [],
        });
      }
      if (method === "POST") {
        draftConsumed = true;
        approvalPosted();
        return json(route, approvedCampaignResponse());
      }
      return route.fallback();
    });

    await page.route(
      `**/api/mail-campaigns/${CAMPAIGN_ID}/approval-artifact`,
      async (route) => {
        await artifactReleased;
        return json(route, {
          ok: true,
          id: "44444444-4444-4444-8444-444444444444",
          org_id: ORG_ID,
          mail_campaign_id: CAMPAIGN_ID,
          created_by: "user-owner",
          source_draft_id: DRAFT_ID,
          artifact_type: "approval_proof",
          storage_backend: "railway_volume",
          storage_key: `orgs/${ORG_ID}/mail-campaigns/${CAMPAIGN_ID}/proof`,
          manifest: {},
          manifest_sha256: "a".repeat(64),
          terms_version: "accuracy-rights-v1",
          acknowledged_at: "2026-07-27T14:05:00.000Z",
          created_at: "2026-07-27T14:05:01.000Z",
        });
      },
    );
    await page.route(
      `**/api/mail-campaigns/${CAMPAIGN_ID}/purchase-records`,
      (route) =>
        json(route, {
          order_id: "melissa-order-1",
          record_count: 10,
          sample: [],
          source: "melissa",
        }),
    );

    await page.goto("/app/dev/step-review-approval-flow");
    const initialDocument = await page.evaluate(
      () => performance.getEntriesByType("navigation").length,
    );
    await expect(page.getByTestId("sidebar-draft-count")).toHaveText("1");

    await page.getByRole("button", { name: "Campaigns, 1 campaign draft" }).click();
    await expect(page).toHaveURL(/\/app\/campaigns$/);
    await expect(page.getByTestId("sidebar-draft-count")).toHaveText("1");
    await expect(page.getByTestId("campaigns-draft-count")).toHaveText("1");
    await attachScreenshot(
      page,
      testInfo,
      "pos170-pos175-before-approval.png",
    );

    await page.goBack();
    await expect(page).toHaveURL(/\/app\/dev\/step-review-approval-flow$/);
    await expect(page.getByTestId("mailing-date-input")).toHaveValue(
      "2026-07-29",
    );
    const approveButton = page.getByRole("button", {
      name: /Approve & Send Mailing/i,
    });
    await page.getByLabel(/I confirm all information/i).check();
    await expect(approveButton).toBeEnabled();
    await page.getByTestId("mailing-date-input").fill("2026-07-30");
    await expect(approveButton).toBeEnabled();

    await approveButton.click();
    await approvalBoundary;
    await expect.poll(() => draftListSizes.at(-1)).toBe(0);
    // The artifact request is deliberately held: this proves the shared
    // sidebar badge clears immediately after approval consumes the draft.
    await expect(page.getByTestId("sidebar-draft-count")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Campaigns", exact: true }),
    ).toBeVisible();

    releaseArtifact();
    await expect(page.getByText("Your campaign is live!")).toBeVisible();
    await page.getByRole("button", { name: "View Campaign" }).click();
    await expect(page).toHaveURL(/\/app\/campaigns$/);
    await expect(page.getByText("No drafts. Start a new campaign")).toBeVisible();
    await expect(page.getByTestId("campaigns-draft-count")).toHaveCount(0);
    await expect(page.getByTestId("sidebar-draft-count")).toHaveCount(0);
    await attachScreenshot(
      page,
      testInfo,
      "pos170-pos175-after-approval.png",
    );

    expect(
      await page.evaluate(
        () => performance.getEntriesByType("navigation").length,
      ),
    ).toBe(initialDocument);
    expect(draftListSizes).toContain(1);
    expect(draftListSizes.at(-1)).toBe(0);
    expect(unexpectedDraftRequests).toEqual([]);
    expect(failedDraftRequests).toEqual([]);
  });

  test("keeps approval disabled while schedule availability is loading", async ({
    page,
  }) => {
    await installApprovalFlowMocks(page);
    let releaseAvailability!: () => void;
    const availabilityReleased = new Promise<void>((resolve) => {
      releaseAvailability = resolve;
    });
    await page.route(
      "**/api/mail-campaigns/schedule-availability",
      async (route) => {
        await availabilityReleased;
        return json(route, {
          ok: true,
          earliest_mailing_date: "2026-07-29",
          timezone: "America/Los_Angeles",
          approval_cutoff_local: "17:00:00",
          cutoff_inclusive: true,
          processing_business_days: 1,
          holiday_calendar: "us_federal_observed_nationwide",
        });
      },
    );

    await page.goto("/dev/step-review-approval-flow");
    const approveButton = page.getByRole("button", {
      name: /Approve & Send Mailing/i,
    });
    await page.getByLabel(/I confirm all information/i).check();

    await expect(page.getByTestId("schedule-availability-loading")).toBeVisible();
    await expect(approveButton).toBeDisabled();

    releaseAvailability();
    await expect(page.getByTestId("mailing-date-input")).toHaveValue(
      "2026-07-29",
    );
    await expect(approveButton).toBeEnabled();
  });

  test("keeps approval disabled when schedule availability fails", async ({
    page,
  }) => {
    await installApprovalFlowMocks(page);
    await page.route(
      "**/api/mail-campaigns/schedule-availability",
      (route) => json(route, { error: { message: "unavailable" } }, 503),
    );

    await page.goto("/dev/step-review-approval-flow");
    await page.getByLabel(/I confirm all information/i).check();

    await expect(page.getByTestId("schedule-availability-error")).toContainText(
      "Retry before approving",
    );
    await expect(
      page.getByRole("button", { name: /Approve & Send Mailing/i }),
    ).toBeDisabled();
  });

  test("allows the exact minimum and later weekdays but blocks a weekend", async ({
    page,
  }) => {
    await installApprovalFlowMocks(page);
    await page.goto("/dev/step-review-approval-flow");
    await page.getByLabel(/I confirm all information/i).check();

    const dateInput = page.getByTestId("mailing-date-input");
    const approveButton = page.getByRole("button", {
      name: /Approve & Send Mailing/i,
    });
    await expect(dateInput).toHaveValue("2026-07-29");
    await expect(approveButton).toBeEnabled();

    await dateInput.fill("2026-07-30");
    await expect(approveButton).toBeEnabled();

    await dateInput.fill("2026-08-01");
    await expect(page.getByTestId("mailing-date-validation")).toContainText(
      "must fall on a weekday",
    );
    await expect(approveButton).toBeDisabled();
  });

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

  test("refreshes the minimum and selection after a stale schedule rejection", async ({
    page,
  }) => {
    await installApprovalFlowMocks(page);
    await page.route("**/api/mail-campaigns", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      return json(
        route,
        {
          error: {
            details: {
              code: "mail_schedule_invalid",
              reason: "scheduled_date_before_earliest",
              earliest_mailing_date: "2026-07-30",
              timezone: "America/Los_Angeles",
              approval_cutoff_local: "17:00:00",
              cutoff_inclusive: true,
              processing_business_days: 1,
              holiday_calendar: "us_federal_observed_nationwide",
              selected_mailing_date: "2026-07-29",
            },
          },
        },
        400,
      );
    });

    await page.goto("/dev/step-review-approval-flow");
    const mailingDate = page.getByTestId("mailing-date-input");
    await expect(mailingDate).toHaveValue("2026-07-29");
    await page.getByLabel(/I confirm all information/i).check();
    await page.getByRole("button", { name: /Approve & Send Mailing/i }).click();

    await expect(mailingDate).toHaveAttribute("min", "2026-07-30");
    await expect(mailingDate).toHaveValue("2026-07-30");
    await expect(page.getByTestId("mailing-date-action-message")).toContainText(
      "the rest of your draft is unchanged",
    );
  });
});
