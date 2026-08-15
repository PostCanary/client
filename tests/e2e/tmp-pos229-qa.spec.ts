import { chromium, devices, expect, firefox, test, webkit } from "@playwright/test";

const PROD = "https://www.postcanary.com/";
const SHOT =
  "/private/tmp/claude-501/-Users-dustinthompson-repos-work-PostCanary/7a33da40-146e-4389-b7d4-815fd390816c/scratchpad";

const SECTIONS = ["hero", "features", "eddm", "targeted-mail", "analytics", "pricing"];

test.describe.configure({ mode: "serial" });

test("renders in webkit and firefox with no horizontal overflow", async () => {
  for (const [name, engine] of [
    ["webkit", webkit],
    ["firefox", firefox],
  ] as const) {
    const browser = await engine.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(PROD, { waitUntil: "networkidle" });
    for (const id of SECTIONS) {
      await expect(page.locator(`section#${id}`)).toBeVisible();
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    console.log(`${name}: overflow=${overflow}px`);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `${SHOT}/pos229-${name}.png` });
    await browser.close();
  }
});

test("mobile viewport: hamburger nav, no overflow, CTAs reachable", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ ...devices["iPhone 13"] });
  await page.goto(PROD, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log("mobile overflow:", overflow);
  expect(overflow).toBeLessThanOrEqual(1);
  for (const id of SECTIONS) {
    await expect(page.locator(`section#${id}`)).toBeVisible();
  }
  await page.screenshot({ path: `${SHOT}/pos229-mobile-top.png` });
  await page.locator("section#pricing").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOT}/pos229-mobile-pricing.png` });
  await browser.close();
});

test("page weight and hero video cost", async ({ page }) => {
  let total = 0;
  const byType: Record<string, number> = {};
  page.on("response", async (res) => {
    const len = Number(res.headers()["content-length"] || 0);
    if (!len) return;
    total += len;
    const ct = (res.headers()["content-type"] || "other").split(";")[0];
    byType[ct] = (byType[ct] || 0) + len;
  });
  await page.goto(PROD, { waitUntil: "networkidle" });
  console.log("TOTAL KB:", Math.round(total / 1024));
  for (const [ct, bytes] of Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    console.log(`  ${ct}: ${Math.round(bytes / 1024)} KB`);
  }
});

test("accordion semantics and reduced motion", async ({ page }) => {
  await page.goto(PROD, { waitUntil: "networkidle" });
  const triggers = page.locator("section#eddm [aria-expanded]");
  const count = await triggers.count();
  console.log("eddm accordion triggers:", count);
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const t = triggers.nth(i);
    expect(await t.getAttribute("aria-controls")).toBeTruthy();
    const role = await t.evaluate((el) => el.tagName.toLowerCase());
    expect(role).toBe("button");
  }
  // Every section heading level and a single h1
  const h1 = await page.locator("h1").count();
  console.log("h1 count:", h1);
  expect(h1).toBe(1);
  // Images carry alt text
  const missingAlt = await page.locator("img:not([alt])").count();
  console.log("images without alt:", missingAlt);
  expect(missingAlt).toBe(0);
});

test("auth CTAs point at the app, chat widget state", async ({ page }) => {
  await page.goto(PROD, { waitUntil: "networkidle" });
  const chatVisible = await page
    .locator("iframe[title*='hat'], [id*='chat'], [class*='chat-widget']")
    .first()
    .isVisible()
    .catch(() => false);
  console.log("chat widget visible on load:", chatVisible);

  await page.getByRole("button", { name: /log in/i }).first().click();
  await page.waitForTimeout(1500);
  console.log("after Log In click, url:", page.url());
  const modal = await page.locator("[role='dialog'], .login-modal").count();
  console.log("login modal present:", modal > 0);
  await page.screenshot({ path: `${SHOT}/pos229-login.png` });
});
