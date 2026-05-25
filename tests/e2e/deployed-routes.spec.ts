import { expect, test } from "@playwright/test";

const defaultRoutes = ["/"];

function liveRoutes(): string[] {
  const configured = process.env.E2E_LIVE_ROUTES?.split(",")
    .map((route) => route.trim())
    .filter(Boolean);

  return configured && configured.length > 0 ? configured : defaultRoutes;
}

function shouldTrackFailure(
  url: string,
  resourceType: string,
  failureText?: string,
): boolean {
  if (
    url.includes("google-analytics.com") ||
    url.includes("/g/collect") ||
    url.includes("api.claydar.com/tracker/event") ||
    url.includes("/.well-known/vercel/jwe")
  ) {
    return false;
  }

  // Vercel previews can emit failed document events even when page.goto returns
  // a successful route response. The explicit response assertion below protects
  // route availability; this assertion is for app/API subresource failures.
  if (resourceType === "document") {
    return false;
  }

  return true;
}

test.describe("deployed preview route smoke", () => {
  test.skip(
    !process.env.E2E_LIVE_BASE_URL,
    "Set E2E_LIVE_BASE_URL to smoke deployed preview routes.",
  );

  for (const route of liveRoutes()) {
    test(`${route} loads without app errors`, async ({ page }) => {
      const routeUrl = new URL(route, process.env.E2E_LIVE_BASE_URL).href;
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });
      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });
      page.on("requestfailed", (request) => {
        if (request.url() === routeUrl) {
          return;
        }

        if (
          shouldTrackFailure(
            request.url(),
            request.resourceType(),
            request.failure()?.errorText,
          )
        ) {
          failedRequests.push(request.url());
        }
      });

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);

      expect(response?.status(), `${route} should return HTTP 200`).toBe(200);
      await expect(page.locator("body")).toContainText(
        /PostCanary|Sign in|Get Started|Send to a List/i,
      );
      expect(pageErrors, `${route} page errors`).toEqual([]);
      expect(consoleErrors, `${route} console errors`).toEqual([]);
      expect(failedRequests, `${route} first-party failed requests`).toEqual([]);
    });
  }
});
