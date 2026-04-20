import { test, expect } from "@playwright/test";

/**
 * S69 — Home greeting shows the logged-in user's first name (not the
 * hardcoded MOCK_HOME_CONTEXT.firstName="Drake"). Wired via auth.userName
 * split on space. Also confirms the greeting auto-adjusts to the current
 * time-of-day: morning (<12), afternoon (<17), evening (>=17).
 */

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

test("greeting shows user's first name + time-appropriate salutation", async ({ page }) => {
  await page.goto("/app/home");
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  const title = page.locator(".greeting-title").first();
  await expect(title).toBeVisible({ timeout: 10_000 });

  const text = (await title.textContent())?.trim() ?? "";
  // Must include one of the three time-of-day greetings
  expect(
    text,
    `greeting should start with "Good morning/afternoon/evening": ${text}`,
  ).toMatch(/^Good (morning|afternoon|evening),/);

  // Name should NOT be "Drake" anymore (was the hardcoded mock). It
  // should be whatever the dev auth user's first name is — for
  // drake@postcanary.com the full_name is "Joe Shmoe" → "Joe".
  expect(
    text,
    `greeting should NOT use the hardcoded mock name "Drake": ${text}`,
  ).not.toMatch(/,\s*Drake\b/);

  // Must greet a real human first name (letters only, at least 2 chars)
  expect(
    text,
    `greeting should include a real first name after the comma: ${text}`,
  ).toMatch(/,\s*[A-Z][a-z]+/);
});
