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
const EXISTING_JOB_ID = "abc12345-2222-3333-4444-555555555555";
const MOCK_CAMPAIGN_ID = "campaign-mock-id";

/** Navigate to CampaignDetail, open modal, fill minimal return address, click Confirm. */
async function submitFromCampaignDetail(page: import("@playwright/test").Page) {
  await page.goto(`/app/campaigns/${MOCK_CAMPAIGN_ID}`);
  // 30s timeout: Vite on-demand compilation latency on first parallel batch (see gotoStatusPage note).
  await expect(page.getByRole("heading", { name: /Mock Campaign/i })).toBeVisible({ timeout: 30_000 });
  // Open PrintJobConfirmModal via SubmitPrintJobButton
  await page.getByRole("button", { name: "Submit Print Job" }).first().click();
  // Fill return address fields — modal uses <label> wrapping <input>, matched by label text
  await expect(page.getByLabel("Name")).toBeVisible();
  await page.getByLabel("Name").fill("Test Sender");
  await page.getByLabel("Address line 1").fill("123 Main St");
  await page.getByLabel("City").fill("Austin");
  await page.getByLabel("State").fill("TX");
  await page.getByLabel("ZIP").fill("78701");
  // Confirm submission — modal footer confirm button is last "Submit Print Job" in DOM
  await page.getByRole("button", { name: "Submit Print Job" }).last().click();
}

async function gotoStatusPage(
  page: import("@playwright/test").Page,
  scenario: PrintJobMockScenario,
  jobId: string = MOCK_JOB_ID,
) {
  await installPrintJobMockApi(page, scenario);
  await page.goto(`/app/print-jobs/${jobId}`);
  // 30s timeout: Vite compiles SPA chunks on-demand; first-batch parallel tests
  // may hit the compile latency before the cache warms up (tests 5-6 pass at
  // 5s because they run after tests 1-4 have already warmed Vite's cache).
  await expect(page.getByRole("heading", { name: "Print job status" })).toBeVisible({ timeout: 30_000 });
}

test("happy path: status page polls through phases to delivered", async ({ page }) => {
  // S383 — MEDIUM-fold of S381 Codex strike-1: capture every distinct value the
  // ARIA live region announces so we can assert ordered phase progression
  // (accepted → producing → mailed → delivered) instead of only the final
  // copy. MutationObserver runs in-page and dedupes consecutive duplicates.
  // Installed BEFORE navigation so the initial idle/Loading copy is recorded.
  await page.addInitScript(() => {
    const history: string[] = [];
    (window as Window & { __phaseHistory?: string[] }).__phaseHistory = history;
    const attach = () => {
      const region = document.querySelector(
        '[role="status"][aria-live="polite"]',
      );
      if (!region) {
        requestAnimationFrame(attach);
        return;
      }
      const record = () => {
        const text = region.textContent?.trim();
        if (text && history[history.length - 1] !== text) history.push(text);
      };
      record();
      new MutationObserver(record).observe(region, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    };
    attach();
  });

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

  // S383 — assert ordered phase sequence via MutationObserver history.
  // Mock advances accepted → in_production → printed → mailed → delivered.
  // PHASE_COPY (PrintJobStatus.vue:64-75) maps `in_production` and `printed`
  // both to `producing` ("In production"), so 4 distinct copies are visible:
  // Accepted, In production, Mailed, Delivered.
  const history = await page.evaluate(
    () =>
      (window as Window & { __phaseHistory?: string[] }).__phaseHistory ?? [],
  );
  const indexOf = (rx: RegExp) => history.findIndex((c: string) => rx.test(c));
  const idxAccepted = indexOf(/^Accepted/i);
  const idxProducing = indexOf(/^In production/i);
  const idxMailed = indexOf(/^Mailed$/i);
  const idxDelivered = indexOf(/^Delivered$/i);
  expect(idxAccepted, `phase history: ${JSON.stringify(history)}`).toBeGreaterThanOrEqual(0);
  expect(idxProducing).toBeGreaterThan(idxAccepted);
  expect(idxMailed).toBeGreaterThan(idxProducing);
  expect(idxDelivered).toBeGreaterThan(idxMailed);

  // S389 strike-3 MED fold (Codex thread 019ddad4): scope assertion to the
  // delivered-only CTA branch via dedicated `data-testid`. Strike-2's
  // `.toHaveCount(2)` + `.last()` could pass on a regression that duplicates
  // the top back button AND removes the delivered CTA. The testid lives on
  // the `phase === 'delivered'` branch in PrintJobStatus.vue, so visibility
  // proves the terminal-CTA branch actually rendered.
  await expect(
    page.getByTestId("print-job-terminal-cta"),
  ).toBeVisible();

  // Terminal state: timeline still visible, no error banner.
  await expect(page.locator('[aria-label="Print job timeline"]')).toBeVisible();
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
});

test("idempotency replay (409): navigates to existing_job_id", async ({ page }) => {
  await installPrintJobMockApi(page, "idempotency_409");
  await submitFromCampaignDetail(page);
  // usePrintJob sees 409 + existing_job_id → CampaignDetail navigates to prior job
  await page.waitForURL(`**/app/print-jobs/${EXISTING_JOB_ID}`, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Print job status" })).toBeVisible();
});

test("empty campaign (400): banner stays on campaign-detail", async ({ page }) => {
  await installPrintJobMockApi(page, "empty_400");
  await submitFromCampaignDetail(page);
  // 400 campaign_empty → usePrintJob returns "failed", CampaignDetail shows error banner
  await expect(page.getByRole("heading", { name: /Mock Campaign/i })).toBeVisible();
  const alert = page.locator('[role="alert"]').first();
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(alert).toContainText(/submission failed|could not submit|campaign/i);
});

test("membership inactive (403): error banner on campaign-detail", async ({ page }) => {
  await installPrintJobMockApi(page, "membership_403");
  await submitFromCampaignDetail(page);
  // 403 membership_inactive → usePrintJob returns "failed", CampaignDetail shows error banner
  await expect(page.getByRole("heading", { name: /Mock Campaign/i })).toBeVisible();
  const alert = page.locator('[role="alert"]').first();
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(alert).toContainText(/subscription|inactive|membership|submission failed/i);
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
