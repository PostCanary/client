import { expect, test, type Page, type Route } from "@playwright/test";

// POS-161: Review step effective return address — org default, campaign
// override edit, and missing-address warning. Reuses the
// /dev/step-review-approval-flow harness.

const DRAFT_ID = "11111111-1111-4111-8111-111111111111";

const ORG_DEFAULT_ADDRESS = {
  name: "Alpha HVAC",
  address: "100 Main Street",
  address2: "Suite 200",
  city: "Golden Valley",
  state: "MN",
  zip: "55422",
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installMocks(
  page: Page,
  opts: {
    orgReturnAddress: typeof ORG_DEFAULT_ADDRESS | null;
    billingType?: "subscription_included" | "pay_per_send";
    unitRateCents?: number;
    planCode?: "INSIGHT" | "PERFORMANCE" | "PRECISION" | "ELITE" | null;
    invalidBillingSummary?: boolean;
  } = {
    orgReturnAddress: ORG_DEFAULT_ADDRESS,
  },
) {
  let orgReturnAddress = opts.orgReturnAddress;

  await page.route("**/auth/me", (route) =>
    json(route, {
      authenticated: true,
      user_id: "user-owner",
      email: "alex@example.test",
      full_name: "Alex Owner",
      role: "owner",
      avatar_url: "",
      features: ["postcards"],
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

  await page.route("**/preview-card/*", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: "preview" }),
  );

  await page.route("**/api/billing/pricing", (route) =>
    json(route, {
      pay_per_send_cents: 99,
      subscription_rates_cents: {
        INSIGHT: 79,
        PERFORMANCE: 79,
        PRECISION: 79,
        ELITE: 79,
      },
      custom_design_fee_cents: 19900,
    }),
  );
  await page.route("**/api/billing/payment-method", (route) =>
    json(route, opts.invalidBillingSummary ? {
      billing_type: "pay_per_send",
      required: true,
      has_payment_method: true,
      plan_code: null,
    } : {
      billing_type: opts.billingType ?? "subscription_included",
      currency: "usd",
      unit_rate_cents: opts.unitRateCents ?? 79,
      plan_code: opts.planCode === undefined ? "INSIGHT" : opts.planCode,
      required: opts.billingType === "pay_per_send",
      has_payment_method: opts.billingType === "pay_per_send",
      brand: null,
      last4: null,
      exp_month: null,
      exp_year: null,
      label: null,
    }),
  );

  await page.route("**/api/organizations/return-address", (route) => {
    if (route.request().method() === "GET") {
      return json(route, { return_address: orgReturnAddress });
    }
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON() as {
        return_address?: typeof ORG_DEFAULT_ADDRESS;
      };
      orgReturnAddress = body.return_address ?? null;
      return json(route, { return_address: orgReturnAddress });
    }
    return route.fallback();
  });

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

test.describe("StepReview return address (POS-161)", () => {
  test("shows org default return address when no draft override exists", async ({
    page,
  }) => {
    await installMocks(page, { orgReturnAddress: ORG_DEFAULT_ADDRESS });

    await page.goto("/dev/step-review-approval-flow");

    const display = page.getByTestId("return-address-display");
    await expect(display).toBeVisible();
    await expect(display).toContainText("Alpha HVAC");
    await expect(display).toContainText("100 Main Street");
    await expect(display).toContainText("Suite 200");
    await expect(display).toContainText("Golden Valley, MN 55422");
    await expect(page.getByTestId("return-address-org-default-badge")).toBeVisible();
    await expect(page.getByTestId("return-address-missing-warning")).toHaveCount(0);
  });

  test("editing in Review writes the override into the draft and shows it", async ({
    page,
  }) => {
    await installMocks(page, { orgReturnAddress: ORG_DEFAULT_ADDRESS });

    await page.goto("/dev/step-review-approval-flow");

    await expect(page.getByTestId("return-address-display")).toContainText(
      "100 Main Street",
    );

    await page.getByTestId("return-address-edit").click();
    await expect(page.getByTestId("return-address-edit-form")).toBeVisible();

    await page.getByTestId("review-return-name").fill("Campaign Override Co");
    await page.getByTestId("review-return-address").fill("42 Override Ave");
    await page.getByTestId("review-return-address2").fill("");
    await page.getByTestId("review-return-city").fill("St Paul");
    await page.getByTestId("review-return-state").fill("MN");
    await page.getByTestId("review-return-zip").fill("55101");
    await page.getByTestId("return-address-save").click();

    const display = page.getByTestId("return-address-display");
    await expect(display).toBeVisible();
    await expect(display).toContainText("Campaign Override Co");
    await expect(display).toContainText("42 Override Ave");
    await expect(display).toContainText("St Paul, MN 55101");
    await expect(display).not.toContainText("100 Main Street");
    await expect(page.getByTestId("return-address-override-badge")).toBeVisible();
  });

  test("inline warning appears when both org default and draft value are missing", async ({
    page,
  }) => {
    await installMocks(page, { orgReturnAddress: null });

    await page.goto("/dev/step-review-approval-flow");

    const warning = page.getByTestId("return-address-missing-warning");
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(
      "Add your business mailing address — approval is blocked until it is complete",
    );
    await expect(page.getByTestId("return-address-settings-link")).toHaveAttribute(
      "href",
      "/app/settings",
    );
    await expect(page.getByTestId("return-address-display")).toHaveCount(0);

    const approve = page.getByRole("button", { name: /Approve & Send Mailing/i });
    await page.getByLabel(/I confirm all information/i).check();
    await expect(approve).toBeVisible();
    await expect(approve).toBeDisabled();
  });

  test("draft override takes precedence over org default", async ({ page }) => {
    await installMocks(page, { orgReturnAddress: ORG_DEFAULT_ADDRESS });

    await page.goto("/dev/step-review-approval-flow?draftReturnAddress=1");

    const display = page.getByTestId("return-address-display");
    await expect(display).toContainText("Draft Override HVAC");
    await expect(display).toContainText("999 Override Lane");
    await expect(display).toContainText("Minneapolis, MN 55401");
    await expect(display).not.toContainText("100 Main Street");
    await expect(page.getByTestId("return-address-override-badge")).toBeVisible();
  });

  test("rejects a stale multi-mailing draft clearly before approval", async ({
    page,
  }) => {
    await installMocks(page, { orgReturnAddress: ORG_DEFAULT_ADDRESS });

    await page.goto("/dev/step-review-approval-flow?multiMailing=1");
    await page.getByLabel(/I confirm all information/i).check();

    await expect(page.getByTestId("single-mailing-warning")).toContainText(
      "cannot be approved",
    );
    await expect(
      page.getByRole("button", { name: /Approve & Send Mailing/i }),
    ).toBeDisabled();
  });

  test("renders the exact pay-per-send billing-summary rate", async ({
    page,
  }) => {
    await installMocks(page, {
      orgReturnAddress: ORG_DEFAULT_ADDRESS,
      billingType: "pay_per_send",
      unitRateCents: 99,
      planCode: null,
    });

    await page.goto("/dev/step-review-approval-flow");

    const total = page.locator("text=Total").locator("..");
    await expect(total).toContainText("$9.90");
    await expect(page.getByTestId("billing-cost-semantics")).toContainText(
      "Server-confirmed pay-per-send rate",
    );
  });

  test("shows subscriber rate as covered usage rather than a card charge", async ({ page }) => {
    await installMocks(page, {
      orgReturnAddress: ORG_DEFAULT_ADDRESS,
      billingType: "subscription_included",
      unitRateCents: 79,
      planCode: "PERFORMANCE",
    });

    await page.goto("/dev/step-review-approval-flow");

    await expect(page.getByText(/10 × \$0\.79/)).toBeVisible();
    await expect(page.getByTestId("server-cost-total")).toHaveText("$0.00");
    await expect(page.getByTestId("billing-cost-semantics")).toContainText(
      "Covered by your PERFORMANCE plan",
    );
    await expect(page.getByTestId("billing-cost-semantics")).toContainText(
      "no per-send card charge",
    );
  });

  test("shows no paid quote and blocks approval when billing facts are incomplete", async ({ page }) => {
    await installMocks(page, {
      orgReturnAddress: ORG_DEFAULT_ADDRESS,
      invalidBillingSummary: true,
    });

    await page.goto("/dev/step-review-approval-flow");
    await page.getByLabel(/I confirm all information/i).check();

    await expect(page.getByTestId("cost-unavailable")).toHaveText(
      "Confirming server pricing…",
    );
    await expect(page.getByTestId("server-cost-total")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Approve & Send Mailing/i })).toBeDisabled();
  });
});
