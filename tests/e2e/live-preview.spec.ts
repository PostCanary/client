import { expect, test } from "@playwright/test";

test("deployed preview loads without client-side page errors", async ({ page }) => {
  test.skip(!process.env.E2E_LIVE_BASE_URL, "Set E2E_LIVE_BASE_URL to smoke a deployed preview.");

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("body")).toContainText(/PostCanary|Sign in|Get Started/i);
  expect(pageErrors).toEqual([]);
});
