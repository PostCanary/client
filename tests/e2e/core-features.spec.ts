import { expect, test, type Page } from "@playwright/test";

import { createMockAppState, installMockApi, type MockAppState } from "./support/mockApi";

async function setup(page: Page, mutate?: (state: MockAppState) => void) {
  const state = createMockAppState();
  mutate?.(state);
  await installMockApi(page, state);
  return state;
}

function csvFile(name: string, body: string) {
  return {
    name,
    mimeType: "text/csv",
    buffer: Buffer.from(body),
  };
}

test("dashboard upload-and-match flow hydrates KPI results", async ({ page }) => {
  const state = await setup(page, (draft) => {
    draft.runStatusByOrg["org-alpha"] = null;
    draft.runResultByOrg["org-alpha"] = null;
    draft.runMatchesByOrg["org-alpha"] = null;
  });

  await page.goto("/dashboard");

  await expect(page.getByText("Upload Files")).toBeVisible();

  await page.locator("#mailCsv").setInputFiles(
    csvFile("mail.csv", "Address,City,State,ZIP,Sent Date\n123 Peachtree St,Atlanta,GA,30309,2024-02-01\n"),
  );
  await page.locator("#crmCsv").setInputFiles(
    csvFile("crm.csv", "Address,City,State,ZIP,Job Date,Job Value\n123 Peachtree St,Atlanta,GA,30309,2024-02-18,2400\n"),
  );

  await expect(page.getByText("mail.csv")).toBeVisible();
  await expect(page.getByText("crm.csv")).toBeVisible();

  await page.getByRole("button", { name: "Upload & Match" }).click();

  await expect.poll(() => state.requestLog.normalizeCalls.length).toBe(2);
  await expect(page.locator(".hero-card", { has: page.getByText("Total Matches") })).toContainText("42");
  await expect(page.locator(".adv-stat", { has: page.getByText("Total Mail") })).toContainText("2,500");
});

test("analytics regenerates insights on demand", async ({ page }) => {
  await setup(page);

  await page.goto("/analytics");

  await expect(page.getByRole("heading", { name: "AI Insights" })).toBeVisible();
  await expect(
    page.getByText(
      "Alpha Roofing is winning its best response rates in high-home-value ZIP codes around Atlanta.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Regenerate Insights" }).click();

  await expect(
    page.getByText(
      "Fresh regenerated summary: Alpha Roofing should double down on premium homeowner clusters.",
    ),
  ).toBeVisible();
});

test("demographics supports audience toggles", async ({ page }) => {
  await setup(page);

  await page.goto("/demographics");

  await expect(page.getByRole("heading", { name: "Demographic Insights" })).toBeVisible();
  await expect(
    page.getByText("Matched-household demographics are based on 42 verified conversions from the latest run."),
  ).toBeVisible();

  await page.getByRole("button", { name: "All Customers" }).click();

  await expect(
    page.getByText("All-customer demographics show a broad homeowner base centered on mid-to-high value homes."),
  ).toBeVisible();
});

test("heatmap applies date filters through the org-scoped endpoint", async ({ page }) => {
  const state = await setup(page);

  await page.goto("/map");

  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(0).fill("2024-02-01");
  await dateInputs.nth(1).fill("2024-03-31");
  await page.getByRole("button", { name: "Apply" }).click();

  await expect.poll(() => state.requestLog.heatmapQueries.at(-1)).toMatchObject({
    start: "2024-02-01",
    end: "2024-03-31",
    kind: "matched",
  });
});

test("history deletes uploads and can refresh back to the dashboard", async ({ page }) => {
  await setup(page);

  await page.goto("/history");

  await expect(page.getByTestId("history-batch-mail-batch-alpha")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("history-batch-mail-batch-alpha").getByRole("button", { name: "Delete" }).click();

  await expect(page.getByTestId("history-batch-mail-batch-alpha")).toHaveCount(0);

  await page.getByRole("button", { name: "Refresh Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".hero-card", { has: page.getByText("Total Matches") })).toContainText("42");
});

test("settings saves both profile and organization changes", async ({ page }) => {
  const state = await setup(page);

  await page.goto("/settings");

  await page.getByLabel("Full name").fill("Alex Growth");
  await page.getByLabel("Website").fill("alpha-roofing.com");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect.poll(() => state.requestLog.profileUpdates.length).toBe(1);

  await page.getByLabel("Organization name").fill("Alpha Roofing HQ");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await expect.poll(() => state.requestLog.orgUpdates.length).toBe(1);
  await expect(page.getByTestId("org-switcher-trigger")).toContainText("Alpha Roofing HQ");
});

test("settings exposes billing controls for admins and removes delete account", async ({ page }) => {
  const state = await setup(page);

  await page.goto("/settings");

  await expect(page.getByTestId("settings-subscription-status")).toContainText("Active");
  await expect(page.getByTestId("settings-change-plan")).toBeVisible();
  await expect(page.getByTestId("settings-pause-subscription")).toBeVisible();
  await expect(page.getByTestId("settings-cancel-subscription")).toBeVisible();
  await expect(page.getByTestId("settings-manage-billing")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete account" })).toHaveCount(0);

  await page.getByTestId("settings-change-plan").click();
  await expect(page.getByTestId("change-plan-modal")).toBeVisible();
  await page.getByTestId("settings-plan-option-elite").click();
  await page.getByTestId("confirm-change-plan").click();

  await expect.poll(() => state.requestLog.changePlanCalls).toEqual(["ELITE"]);
  await expect(page.getByTestId("settings-plan-label")).toContainText("Ultimate ($499/mo)");

  await page.getByTestId("settings-pause-subscription").click();
  await expect(page.getByTestId("pause-subscription-modal")).toBeVisible();
  await page.getByTestId("confirm-pause-subscription").click();

  await expect.poll(() => state.requestLog.pauseCalls).toBe(1);
  await expect(page.getByTestId("settings-subscription-status")).toContainText("Pause scheduled");
  await expect(page.getByTestId("settings-resume-subscription")).toContainText("Keep current plan");

  await page.getByTestId("settings-resume-subscription").click();
  await expect.poll(() => state.requestLog.resumeCalls).toBe(1);
  await expect(page.getByTestId("settings-subscription-status")).toContainText("Active");

  await page.getByTestId("settings-cancel-subscription").click();
  await expect(page.getByTestId("cancel-subscription-modal")).toBeVisible();
  await page.getByTestId("confirm-cancel-subscription").click();

  await expect.poll(() => state.requestLog.cancelCalls).toBe(1);
  await expect(page.getByTestId("settings-cancel-subscription")).toContainText("Cancellation scheduled");
  await expect(page.getByTestId("settings-resume-subscription")).toContainText("Resume subscription");

  await page.getByTestId("settings-resume-subscription").click();
  await expect.poll(() => state.requestLog.resumeCalls).toBe(2);
  await expect(page.getByTestId("settings-subscription-status")).toContainText("Active");
});

test("members can view billing status but not manage subscription actions", async ({ page }) => {
  await setup(page, (state) => {
    state.orgs[0].role = "member";
    state.authMe.org_role = "member";
    state.authMe.orgs[0].role = "member";
  });

  await page.goto("/settings");

  await expect(page.getByTestId("settings-subscription-status")).toBeVisible();
  await expect(page.getByTestId("settings-billing-role-note")).toBeVisible();
  await expect(page.getByTestId("settings-billing-actions")).toHaveCount(0);
});

test("paused billing keeps history accessible while locking uploads", async ({ page }) => {
  await setup(page, (state) => {
    state.authMe.billing = {
      ...state.authMe.billing,
      subscription_status: "paused",
      is_subscribed: false,
      can_run_matching: false,
      needs_paywall: true,
      resume_plan_code: "INSIGHT",
      cancel_at_period_end: false,
      paywall_config: {
        title: "Subscription paused",
        body: "Resume a paid plan to upload files and run matching again.",
        primary_label: "Resume subscription",
        default_plan_code: "INSIGHT",
      },
    };
  });

  await page.goto("/dashboard");

  await expect(page.getByTestId("upload-readonly-message")).toBeVisible();
  await expect(page.getByTestId("upload-match-button")).toBeDisabled();

  await page.goto("/history");
  await expect(page.getByText("alpha-mail.csv")).toBeVisible();
});
