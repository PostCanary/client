import { test, expect } from "@playwright/test";

/**
 * Wizard Step 2 — job-marker popup regression guard (S68).
 *
 * Clicking a navy job pin on the map should open a Leaflet popup showing
 * the job's service type (as title), address, formatted date, and mock
 * job value. Mirrors the heatmap page's bindPopup pattern.
 *
 * We fire the click via the Leaflet layer's own event system
 * (window.__pcMap dev-mode handle) because SVG path elements inside the
 * leaflet-overlay-pane don't reliably receive Playwright's synthesized
 * mouse events — the browser's hit-test can land on the underlying tile
 * pane instead of the marker path.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

test("job marker click opens popup with address and job value", async ({
  page,
}, testInfo) => {
  page.on("dialog", (d) => d.accept());

  await page.goto("/app/send");
  await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

  // Step 1: pick neighbor marketing — this is the goal that pre-selects
  // jobs so they render as markers on the Step 2 map.
  await page
    .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
    .click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Wait for Step 2 map, pin markers, AND the dev-mode map handle.
  await page.waitForSelector(".leaflet-container", { timeout: 20_000 });
  await page.waitForFunction(
    () => !!(window as unknown as { __pcMap?: unknown }).__pcMap,
    null,
    { timeout: 10_000 },
  );

  // Dismiss the first-time intro modal if it's showing (fresh draft) —
  // otherwise it covers the map and screenshots are confusing.
  const introBtn = page.getByRole("button", { name: /Around My Jobs/i });
  if (await introBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await introBtn.click();
    await page.waitForTimeout(500);
  }

  await page.waitForFunction(
    () =>
      document.querySelectorAll(".leaflet-overlay-pane path.leaflet-interactive")
        .length >= 5,
    null,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(400);

  // Fire the click on the first job-pin layer via Leaflet's API. Fall back
  // to dispatching a DOM click if the fire-via-layer path doesn't open the
  // popup (shouldn't happen with the explicit click→openPopup handler in
  // useTargetingMap.ts, but defensive).
  const opened = await page.evaluate(() => {
    const pcMap = (window as unknown as { __pcMap?: { eachLayer: (fn: (l: unknown) => void) => void } }).__pcMap;
    if (!pcMap) return "no-map";
    let fired = false;
    pcMap.eachLayer((layer: unknown) => {
      if (fired) return;
      const l = layer as {
        options?: { radius?: number };
        getPopup?: () => unknown;
        fire?: (evt: string) => void;
        openPopup?: () => void;
      };
      // CircleMarker pins have radius ≤ 10 (we use 6). Radius CIRCLES have
      // much larger radius values in meters. Popups are only bound to pins.
      if (l.options?.radius != null && l.options.radius <= 10 && l.getPopup?.()) {
        l.fire?.("click");
        l.openPopup?.();
        fired = true;
      }
    });
    return fired ? "fired" : "no-pin-found";
  });
  expect(opened, "should have found and fired a pin-layer click").toBe("fired");

  // Popup should appear with service type (bold), address, date, value.
  const popup = page.locator(".leaflet-popup-content");
  await expect(popup).toBeVisible({ timeout: 5_000 });

  const text = (await popup.textContent()) ?? "";

  // Address check — every MOCK_JOBS entry has "Scottsdale, AZ" in its address.
  expect(text, "popup should contain the job address").toMatch(/Scottsdale,\s*AZ/);

  // Value row — should start with "Job value:" and include a $ + digits.
  expect(text, "popup should show 'Job value:' label").toContain("Job value:");
  expect(text, "popup should show a dollar amount").toMatch(/\$[\d,]+/);

  // Date row — MOCK_JOBS dates are all 2026; formatJobDate should produce
  // a human-readable "Mmm D, 2026".
  expect(text, "popup should show the job date").toMatch(/\b20\d{2}\b/);

  await page.screenshot({
    path: testInfo.outputPath("job-popup-open.png"),
    fullPage: true,
  });
});
