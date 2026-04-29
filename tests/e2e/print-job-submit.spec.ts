// tests/e2e/print-job-submit.spec.ts
//
// S376 — U.7 phase B Playwright E2E for the print-job submit→status flow
// (mock-mode, route-stubbed via support/printJobMockApi.ts).
//
// Six scenarios per S308 brief §"Item U.7" Work-items 1-6:
//   1. happy            — deep-link to status page, polls through 5 phases to delivered
//   2. idempotency_409  — SKIPPED (SubmitPrintJobButton not yet wired into CampaignDetail.vue)
//   3. empty_400        — SKIPPED (same)
//   4. membership_403   — SKIPPED (same)
//   5. watch_404        — deep-link to nonexistent id, error banner with watch-load copy
//   6. poll_timeout     — deep-link, page.clock fast-forwards past POLL_DEADLINE_MS
//
// S376 finding: the submit-flow scenarios (2, 3, 4) require SubmitPrintJobButton.vue
// to be rendered on a parent page (CampaignDetail.vue per U.3 brief). grep across
// `client/src/` confirms zero references to `SubmitPrintJobButton` outside its own
// definition file — component is authored but not yet integrated. Tracking as
// blocker; un-skip these tests once integration lands. Until then, the deep-link
// scenarios (1, 5, 6) cover the integration surface that matters most for U.7's
// goal (catch Vue/router/composable regressions in PrintJobStatus.vue).

import { expect, test } from "@playwright/test";

import {
  installPrintJobMockApi,
  type PrintJobMockScenario,
} from "./support/printJobMockApi";

const MOCK_JOB_ID = "11111111-2222-3333-4444-555555555555";

async function gotoStatusPage(
  page: import("@playwright/test").Page,
  scenario: PrintJobMockScenario,
  jobId: string = MOCK_JOB_ID,
) {
  await installPrintJobMockApi(page, scenario);
  await page.goto(`/app/print-jobs/${jobId}`);
  await expect(page.getByRole("heading", { name: "Print job status" })).toBeVisible();
}

test("happy path: status page polls through phases to delivered", async ({ page }) => {
  await gotoStatusPage(page, "happy");

  // Phase 1: timeline appears once first GET resolves (idle skeleton replaced).
  await expect(page.locator('[aria-label="Print job timeline"]')).toBeVisible();

  // Composable polls with 1s+backoff intervals (per useRenderJob clone). The
  // happy mock advances one phase per GET; with 5 phases + a 30s default
  // assertion timeout, expect the terminal phase copy by the end.
  await expect(page.locator('[role="status"][aria-live="polite"]')).toContainText(
    /delivered/i,
    { timeout: 30_000 },
  );

  // Terminal state: timeline still visible, no error banner.
  await expect(page.locator('[aria-label="Print job timeline"]')).toBeVisible();
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
});

test.skip("idempotency replay (409): navigates to existing_job_id", async () => {
  // BLOCKED-S376: SubmitPrintJobButton.vue is authored (U.3, commit f3c6b75)
  // but not yet rendered on any parent page. CampaignDetail.vue does not
  // import it. Un-skip after the parent-integration commit lands.
});

test.skip("empty campaign (400): banner stays on campaign-detail", async () => {
  // BLOCKED-S376: see above.
});

test.skip("membership inactive (403): subscription-redirect CTA", async () => {
  // BLOCKED-S376: see above.
});

test("watch failure on deep-link (404): renders watch-load error copy", async ({ page }) => {
  await gotoStatusPage(page, "watch_404", "nonexistent-job-id");

  // Per S359 strike-3 fold: watch-load 404 surfaces as a non-terminal failure
  // copy, NOT "Print job failed". Banner has role="alert".
  const alert = page.locator('[role="alert"]').first();
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(alert).toContainText(/could not load print job status/i);

  // Timeline must NOT render on watch-load failure.
  await expect(page.locator('[aria-label="Print job timeline"]')).toHaveCount(0);
});

test("polling timeout: fast-forward past POLL_DEADLINE_MS surfaces timeout copy", async ({
  page,
}) => {
  await page.clock.install();
  await gotoStatusPage(page, "poll_timeout");

  // First GET resolves with status='submitted' → timeline renders, phase copy
  // shows submitted state. Stays there indefinitely (mock returns 'submitted'
  // for every subsequent GET).
  await expect(page.locator('[aria-label="Print job timeline"]')).toBeVisible();

  // Fast-forward well past POLL_DEADLINE_MS=120000 (120s). Composable should
  // emit POLL_TIMEOUT and the page renders the terminal-error banner with
  // the watch-load copy ("Could not load print job status").
  await page.clock.fastForward(150_000);

  const alert = page.locator('[role="alert"]').first();
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(alert).toContainText(/could not load print job status/i);
});
