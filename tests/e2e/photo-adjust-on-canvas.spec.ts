import { expect, test, type Route } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * S81 — ON-CANVAS photo position/crop visual + behavior verification.
 *
 * Mounts the dev fold harness (/dev/step-design-fold) which seeds a 3-card
 * sequence with a real photo. We mock the preview-card PNG (so the canvas
 * mounts) and the media-features probe, then drive the adjust flow:
 *   - click the photo zone → on-canvas overlay appears
 *   - overlay rect == photo zone rect (±2px)
 *   - drag changes the overlay img's object-position INSTANTLY (no network)
 *   - the zoom slider scales the overlay img
 *   - Done commits + exits; Esc exits
 */

const CARD_PNG = readFileSync("/tmp/s81-card.png");

async function mockHarness(page: import("@playwright/test").Page) {
  // The dev route is auth-guarded (router.beforeEach → fetchMe). Mock an
  // authenticated session so the harness mounts instead of redirecting to login.
  await page.route("**/auth/me", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        authenticated: true,
        user_id: "user-owner",
        email: "alex@alpha.example",
        full_name: "Alex Owner",
        role: "owner",
        features: ["postcards"], // S85 gate: spec org is approved
        org_id: "org-alpha",
        org_name: "Alpha Roofing",
        org_role: "owner",
        orgs: [{ id: "org-alpha", name: "Alpha Roofing", slug: "alpha-roofing", role: "owner" }],
        billing: { is_subscribed: true, needs_paywall: false, plan_code: "INSIGHT" },
      }),
    }),
  );
  // User profile (router/auth store fetches this after /auth/me). An unmocked
  // 401 here trips the global interceptor → opens the login modal.
  await page.route("**/api/users/me", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user_id: "user-owner",
        email: "alex@alpha.example",
        full_name: "Alex Owner",
        profile_complete: true,
      }),
    }),
  );
  await page.route("**/api/campaign-drafts/**/preview-card/**", (route: Route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: CARD_PNG }),
  );
  await page.route("**/api/campaign-drafts/**/preview-back", (route: Route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: CARD_PNG }),
  );
  await page.route("**/api/brand-kit/media-features", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ mapsConfigured: false, stockConfigured: false }),
    }),
  );
}

test.use({ viewport: { width: 1280, height: 800 } });

test("clicking the photo zone enters on-canvas adjust mode; drag + zoom are instant; Done/Esc exit", async ({
  page,
}) => {
  const networkAfterEnter: string[] = [];
  await mockHarness(page);

  await page.goto("/dev/step-design-fold");

  // Canvas PNG must mount (the photo zone hotspots live on the card box).
  const cardImg = page.getByRole("img", { name: "Postcard preview" });
  await expect(cardImg).toBeVisible();

  // Enter adjust mode by clicking the photo zone hotspot.
  const photoZone = page.getByTestId("card-zone-photo");
  await expect(photoZone).toBeAttached();
  await photoZone.click({ force: true });

  const overlay = page.getByTestId("photo-adjust-overlay");
  await expect(overlay).toBeVisible();
  await expect(page.getByTestId("photo-adjust-zoom")).toBeVisible();
  await expect(page.getByTestId("photo-adjust-done")).toBeVisible();

  // Overlay rect must land on the photo zone rect (±2px).
  const zoneBox = await photoZone.boundingBox();
  const overlayBox = await overlay.boundingBox();
  expect(zoneBox).not.toBeNull();
  expect(overlayBox).not.toBeNull();
  expect(Math.abs(overlayBox!.x - zoneBox!.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(overlayBox!.y - zoneBox!.y)).toBeLessThanOrEqual(2);
  expect(Math.abs(overlayBox!.width - zoneBox!.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(overlayBox!.height - zoneBox!.height)).toBeLessThanOrEqual(2);

  await page.screenshot({ path: "/tmp/s81-shots/01-adjust-mode.png" });

  const img = page.getByTestId("photo-adjust-img");
  const posBefore = await img.evaluate((el) => getComputedStyle(el).objectPosition);

  // Watch for ANY network during the drag — there must be none (pure CSS).
  page.on("request", (req) => {
    if (req.url().includes("/api/")) networkAfterEnter.push(req.url());
  });

  // Drag across the overlay to pan. Use mouse moves so pointer capture works.
  const cx = overlayBox!.x + overlayBox!.width / 2;
  const cy = overlayBox!.y + overlayBox!.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 60, cy - 40, { steps: 8 });
  await page.mouse.move(cx - 120, cy - 80, { steps: 8 });
  await page.mouse.up();

  const posAfter = await img.evaluate((el) => getComputedStyle(el).objectPosition);
  expect(posAfter).not.toBe(posBefore);
  // No server round-trip happened during the drag itself (debounce not elapsed).
  expect(networkAfterEnter).toHaveLength(0);

  await page.screenshot({ path: "/tmp/s81-shots/02-after-drag.png" });

  // Zoom slider scales the overlay img (transform: scale(...)).
  await page.getByTestId("photo-adjust-zoom").fill("2");
  await page.getByTestId("photo-adjust-zoom").dispatchEvent("input");
  const transform = await img.evaluate((el) => getComputedStyle(el).transform);
  // A 2x scale → matrix(2, 0, 0, 2, ...) (identity is "none").
  expect(transform).not.toBe("none");

  await page.screenshot({ path: "/tmp/s81-shots/03-after-zoom.png" });

  // Done commits + (eventually) exits. The overlay lingers through the
  // reconcile then clears; assert it is gone within the reconcile window.
  await page.getByTestId("photo-adjust-done").click();
  await expect(overlay).toBeHidden({ timeout: 6000 });

  await page.screenshot({ path: "/tmp/s81-shots/04-after-done.png" });

  // Re-enter and verify Esc exits.
  await photoZone.click({ force: true });
  await expect(page.getByTestId("photo-adjust-overlay")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("photo-adjust-overlay")).toBeHidden({ timeout: 6000 });
});
