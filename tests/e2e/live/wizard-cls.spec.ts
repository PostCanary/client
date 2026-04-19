import { test, expect, type Page } from "@playwright/test";

/**
 * Wizard Step 1 + Step 2 layout-shift ("shake") diagnostic — mem 556.
 *
 * Drake observed intermittent CLS on "Choose Your Goal" (Step 1) and
 * "Pick Your Neighborhood" (Step 2): page "lowers a tiny bit real quickly
 * and then goes back to normal." Classic Cumulative Layout Shift pattern.
 *
 * S68 top suspect: the `"Saving..."` indicator in WizardShell.vue
 * (lines 87–91) is a conditional block in the flex flow. When
 * draftStore.saving toggles (on every setGoal / commitTargeting),
 * the bar mounts/unmounts, adding/removing ~24px above the step content.
 *
 * This spec installs a PerformanceObserver for `layout-shift` entries
 * BEFORE page load, then drives normal wizard interactions on Step 1
 * and Step 2, capturing every shift entry plus its sources. Output goes
 * to stdout + a JSON artifact in the test output dir for later review.
 *
 * Pass condition: none yet — this is diagnostic. Once we ship the fix,
 * convert the assertion to `expect(totalCls).toBeLessThan(0.01)` and
 * keep as a regression guard.
 *
 * Runs against the LIVE dev stack (nginx :8080 → api-dev → render-worker).
 * Mirrors wizard-demo.spec.ts auth + draft-auto-create flow.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

type ShiftEntry = {
  value: number;
  startTime: number;
  hadRecentInput: boolean;
  sources: Array<{
    nodeName: string | null;
    className: string | null;
    id: string | null;
    previousY: number | null;
    currentY: number | null;
    previousHeight: number | null;
    currentHeight: number | null;
  }>;
};

async function installShiftObserver(page: Page) {
  await page.addInitScript(() => {
    (window as any).__shifts = [] as ShiftEntry[];
    (window as any).__shiftMark = (label: string) => {
      (window as any).__shifts.push({
        __mark: label,
        startTime: performance.now(),
      });
    };
    try {
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as any;
          (window as any).__shifts.push({
            value: e.value,
            startTime: entry.startTime,
            hadRecentInput: e.hadRecentInput,
            sources: (e.sources ?? []).map((s: any) => ({
              nodeName: s.node?.nodeName ?? null,
              className:
                typeof s.node?.className === "string" ? s.node.className : null,
              id: s.node?.id ?? null,
              previousY: s.previousRect?.y ?? null,
              currentY: s.currentRect?.y ?? null,
              previousHeight: s.previousRect?.height ?? null,
              currentHeight: s.currentRect?.height ?? null,
            })),
          });
        }
      });
      obs.observe({ type: "layout-shift", buffered: true });
    } catch (err) {
      (window as any).__shiftObserverError = String(err);
    }
  });
}

async function readShifts(page: Page): Promise<any[]> {
  return await page.evaluate(() => (window as any).__shifts ?? []);
}

async function mark(page: Page, label: string) {
  await page.evaluate((l) => (window as any).__shiftMark(l), label);
}

test.describe("wizard layout-shift diagnostic — live stack", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await installShiftObserver(page);
  });

  test("Step 1 goal selection + Step 2 radius change do not cause layout shifts", async ({
    page,
  }, testInfo) => {
    // Collect Saving... indicator toggle events from the DOM for correlation.
    const savingEvents: Array<{ event: "appeared" | "disappeared"; t: number }> =
      [];
    await page.exposeFunction("__logSavingEvent", (event: string, t: number) => {
      savingEvents.push({ event: event as any, t });
    });

    await page.goto("/app/send");
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

    // Wire up a MutationObserver to catch the moment the always-mounted
    // status strip toggles into its "Saving..." text state (class + text
    // change, not mount/unmount — post-fix pattern).
    await page.evaluate(() => {
      const mo = new MutationObserver(() => {
        const strip = document.body.querySelector('[aria-live="polite"]');
        const saving = !!strip && strip.textContent?.trim() === "Saving...";
        const last = (window as any).__lastSavingPresent ?? false;
        if (saving !== last) {
          (window as any).__lastSavingPresent = saving;
          (window as any).__logSavingEvent?.(
            saving ? "appeared" : "disappeared",
            performance.now(),
          );
        }
      });
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    });

    // Step 1: wait for goal cards to be visible, then mark + interact.
    await expect(
      page.getByRole("button", { name: /Recommended\s+Neighbor Marketing/i }),
    ).toBeVisible({ timeout: 30_000 });

    await mark(page, "step1-before-goal-click");
    await page
      .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
      .click();

    // Wait for Saving... to appear then disappear, capturing the full cycle.
    // Use polling since the bar is transient.
    await page
      .waitForFunction(
        () => (window as any).__lastSavingPresent === true,
        null,
        { timeout: 10_000 },
      )
      .catch(() => {
        /* saving may be too fast to observe — continue */
      });
    await page.waitForTimeout(1500); // let the bar disappear + any post-save shifts settle
    await mark(page, "step1-after-save-settled");

    // Move to Step 2.
    await mark(page, "step2-before-click-next");
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Wait for Step 2's map-and-panel layout to settle.
    await expect(page.locator(".leaflet-container, [role=region]").first()).toBeVisible({
      timeout: 30_000,
    });
    await page.waitForTimeout(1500);
    await mark(page, "step2-settled");

    // Step 2 interaction that triggers commitTargeting → save cycle.
    // The targeting panel has a radius slider; any control change triggers
    // the 1s-debounced save. Alternative: toggle a job card.
    const firstJobToggle = page
      .getByRole("button", { name: /Select|Deselect/i })
      .first();
    if (await firstJobToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await mark(page, "step2-before-job-toggle");
      await firstJobToggle.click();
      await page.waitForTimeout(2500); // 1s debounce + save + observe
      await mark(page, "step2-after-save-settled");
    }

    // ---------- Report ----------
    const shifts = await readShifts(page);

    const realShifts = shifts.filter((s: any) => typeof s.value === "number");
    const marks = shifts.filter((s: any) => s.__mark);

    const totalCls = realShifts.reduce((sum: number, s: any) => sum + s.value, 0);
    const maxShift = realShifts.reduce(
      (m: number, s: any) => Math.max(m, s.value),
      0,
    );

    // Decorate each shift with which mark-phase it fell into.
    const decorated = realShifts.map((s: any) => {
      let phase = "pre-step1";
      for (const m of marks) {
        if (m.startTime <= s.startTime) phase = m.__mark;
      }
      return { ...s, phase };
    });

    const summary = {
      totalCls: Number(totalCls.toFixed(4)),
      maxShift: Number(maxShift.toFixed(4)),
      shiftCount: realShifts.length,
      savingEvents,
      shifts: decorated,
    };

    console.log("\n===== CLS DIAGNOSTIC REPORT =====");
    console.log(JSON.stringify(summary, null, 2));
    console.log("=================================\n");

    await testInfo.attach("cls-report.json", {
      body: JSON.stringify(summary, null, 2),
      contentType: "application/json",
    });

    // Screenshot state at end for visual reference.
    await page.screenshot({
      path: testInfo.outputPath("step2-end-state.png"),
      fullPage: true,
    });

    // Diagnostic assertion: confirm the observer worked and we saw at least
    // ONE saving-indicator toggle, which proves the hypothesis path is
    // reachable. Failure here = observer broken or no save fired, investigate.
    expect(
      savingEvents.length,
      "expected to observe at least one Saving... indicator toggle across Step 1 + Step 2",
    ).toBeGreaterThan(0);

    // Regression guard: the S68 fix (always-mounted status strip in
    // WizardShell.vue) brought total CLS from ~0.067 down to ~0.005.
    // Budget: 0.02 leaves headroom for legitimate content-reveal shifts
    // (sequence config mounting after goal click, targeting panel
    // populating). If this ever exceeds 0.02 again, the shake is back
    // and someone has re-introduced a conditional block in the wizard
    // vertical flow. See mem 556.
    expect(
      totalCls,
      `total CLS across Step 1 + Step 2 interactions was ${totalCls.toFixed(4)} (budget 0.02) — see cls-report.json attachment`,
    ).toBeLessThan(0.02);

    // Also assert no shift on the step content wrapper itself — that's
    // the specific element that shook in the original bug. Residual
    // shifts on goal cards / progress bar / targeting panel are fine.
    const stepContentShifts = realShifts.filter((s: any) =>
      s.sources?.some(
        (src: any) => src.className === "flex-1 overflow-y-auto",
      ),
    );
    const stepContentCls = stepContentShifts.reduce(
      (sum: number, s: any) => sum + s.value,
      0,
    );
    expect(
      stepContentCls,
      `step-content wrapper <.flex-1.overflow-y-auto> shifted ${stepContentCls.toFixed(4)} total — this is the original shake bug element, should be 0`,
    ).toBeLessThan(0.005);
  });
});
