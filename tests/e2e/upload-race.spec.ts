import { expect, test, type Page } from "@playwright/test";

import { createMockAppState, installMockApi, type MockAppState } from "./support/mockApi";

/**
 * Regression: clicking "Upload & Match" while the /upload/<src>/start
 * requests are still in flight used to be silently dropped (batch ids not
 * assigned yet), so matching never ran and the user got no feedback.
 * The fix queues the commit and replays it once uploads settle, and keeps
 * the button disabled with an "Uploading…" label during the flight window.
 */

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

test("Upload & Match clicked during in-flight uploads still commits", async ({ page }) => {
  const state = await setup(page, (draft) => {
    draft.runStatusByOrg["org-alpha"] = null;
    draft.runResultByOrg["org-alpha"] = null;
    draft.runMatchesByOrg["org-alpha"] = null;
  });

  // Delay the upload-start endpoints so the click definitely lands while
  // both uploads are still pending. Registered after installMockApi, so this
  // handler runs first; fallback() hands off to the mock once the delay ends.
  await page.route(/\/api\/upload\/(mail|crm)\/start$/, async (route) => {
    await new Promise((r) => setTimeout(r, 1_500));
    await route.fallback();
  });

  await page.goto("/dashboard");
  await expect(page.getByText("Upload Files")).toBeVisible();

  await page.locator("#mailCsv").setInputFiles(
    csvFile("mail.csv", "Address,City,State,ZIP,Sent Date\n123 Peachtree St,Atlanta,GA,30309,2024-02-01\n"),
  );
  await page.locator("#crmCsv").setInputFiles(
    csvFile("crm.csv", "Address,City,State,ZIP,Job Date,Job Value\n123 Peachtree St,Atlanta,GA,30309,2024-02-18,2400\n"),
  );

  // Click immediately — uploads are still in flight (1.5s delay each).
  const button = page.getByTestId("upload-match-button");
  await expect(button).toContainText("Uploading…");
  await button.click();

  // The click is acknowledged: the label shows the queued commit.
  await expect(button).toContainText("Uploading… (will match)");

  // Once uploads settle, the queued commit replays: campaign prompt appears.
  await page.getByRole("button", { name: "No thanks" }).click();

  // The commit reached normalize for both batches — the click was not lost.
  await expect.poll(() => state.requestLog.normalizeCalls.length, { timeout: 15_000 }).toBe(2);
});
