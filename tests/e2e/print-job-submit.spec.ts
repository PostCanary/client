// tests/e2e/print-job-submit.spec.ts
//
// Playwright E2E for the customer-visible print-job status flow
// (mock-mode, route-stubbed via support/printJobMockApi.ts).
//
// Raw POST /api/print_jobs/submit is no longer customer-reachable from
// CampaignDetail. Operator recovery replays purchase-records and is covered in
// campaign-detail-flow-v2.spec.ts; this file retains status polling coverage.

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
