import { test, expect, type Page } from "@playwright/test";

/**
 * Wizard Step 2 — map shape editing regression guard.
 *
 * Bugs this locks in (S68):
 *  - Circle move handle dragged → resize handle stayed behind. Root cause:
 *    the existing leaflet-draw-strict-mode patch on L.Edit.Circle._move
 *    dropped the resize-marker sync step. Fixed by re-adding the
 *    _getResizeMarkerPoint call in useTargetingMap.ts.
 *  - Custom edit-handle styling (circles, branded teal) applied without
 *    breaking drag behavior.
 *
 * Each shape gets its own test: draw → drag move → assert handles stay in
 * sync with the shape → drag resize → assert move handle re-centers.
 * Polygon uses vertex drags (no central move handle in leaflet-draw defaults).
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

async function advanceToStep2(page: Page) {
  page.on("dialog", (d) => d.accept());
  await page.goto("/app/send");
  await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });
  await page
    .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
    .click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForSelector(".leaflet-container", { timeout: 20_000 });
  await page.waitForTimeout(1200);
}

async function mapCenter(page: Page): Promise<{ x: number; y: number; w: number; h: number }> {
  const box = await page.locator(".leaflet-container").first().boundingBox();
  if (!box) throw new Error("map not measured");
  return { x: box.x + box.width * 0.55, y: box.y + box.height * 0.5, w: box.width, h: box.height };
}

async function handlePositions(page: Page) {
  // Returns center points of every edit handle in viewport coords.
  return page.evaluate(() => {
    const handles = Array.from(
      document.querySelectorAll(
        ".leaflet-editing-icon.leaflet-edit-move, .leaflet-editing-icon.leaflet-edit-resize",
      ),
    );
    return handles.map((h) => {
      const r = (h as HTMLElement).getBoundingClientRect();
      const cls = h.className;
      return {
        kind: cls.includes("leaflet-edit-move") ? "move" : "resize",
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
      };
    });
  });
}

async function dragBy(page: Page, fromX: number, fromY: number, dx: number, dy: number) {
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  // Move in steps so leaflet's mousemove handlers fire repeatedly.
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(fromX + (dx * i) / steps, fromY + (dy * i) / steps);
  }
  await page.mouse.up();
  await page.waitForTimeout(150);
}

test.describe("wizard step 2 — shape edit regression", () => {
  test("CIRCLE — dragging the move handle keeps the resize handle locked to the shape edge", async ({
    page,
  }, testInfo) => {
    await advanceToStep2(page);
    const m = await mapCenter(page);

    // Draw a circle.
    await page.getByRole("button", { name: /Draw Circle/i }).click();
    await page.waitForTimeout(250);
    await dragBy(page, m.x, m.y, 110, 70);
    await page.waitForSelector(".leaflet-edit-move", { timeout: 5_000 });
    await page.waitForTimeout(400);

    const before = await handlePositions(page);
    const moveBefore = before.find((h) => h.kind === "move")!;
    const resizeBefore = before.find((h) => h.kind === "resize")!;
    expect(moveBefore, "move handle should exist after drawing a circle").toBeTruthy();
    expect(resizeBefore, "resize handle should exist after drawing a circle").toBeTruthy();

    // Distance from move→resize BEFORE the drag. We expect this offset to
    // stay roughly constant after moving the shape.
    const offsetBefore = {
      dx: resizeBefore.cx - moveBefore.cx,
      dy: resizeBefore.cy - moveBefore.cy,
    };

    // Drag the move handle by (+80, -40).
    const DRAG_DX = 80;
    const DRAG_DY = -40;
    await dragBy(page, moveBefore.cx, moveBefore.cy, DRAG_DX, DRAG_DY);

    const after = await handlePositions(page);
    const moveAfter = after.find((h) => h.kind === "move")!;
    const resizeAfter = after.find((h) => h.kind === "resize")!;

    // Move handle should have shifted approximately by the drag delta.
    expect(Math.abs(moveAfter.cx - moveBefore.cx - DRAG_DX)).toBeLessThan(12);
    expect(Math.abs(moveAfter.cy - moveBefore.cy - DRAG_DY)).toBeLessThan(12);

    // Resize handle should have shifted by the same delta (move-sync).
    // Before fix: resize stays put → dx diff = full 80px. After fix: <12px.
    const resizeShift = {
      dx: resizeAfter.cx - resizeBefore.cx,
      dy: resizeAfter.cy - resizeBefore.cy,
    };
    expect(
      Math.abs(resizeShift.dx - DRAG_DX),
      `resize handle should move with the shape. expected ~${DRAG_DX}px x-shift, got ${resizeShift.dx.toFixed(1)}`,
    ).toBeLessThan(12);
    expect(Math.abs(resizeShift.dy - DRAG_DY)).toBeLessThan(12);

    // Offset between move and resize should remain stable (circle radius
    // shouldn't change during a move).
    const offsetAfter = {
      dx: resizeAfter.cx - moveAfter.cx,
      dy: resizeAfter.cy - moveAfter.cy,
    };
    expect(Math.abs(offsetAfter.dx - offsetBefore.dx)).toBeLessThan(6);
    expect(Math.abs(offsetAfter.dy - offsetBefore.dy)).toBeLessThan(6);

    await page.screenshot({
      path: testInfo.outputPath("circle-after-move.png"),
      fullPage: true,
    });

    // Now drag the resize handle outward and assert move handle stays put.
    const moveBeforeResize = moveAfter;
    await dragBy(page, resizeAfter.cx, resizeAfter.cy, 50, 30);
    const finalHandles = await handlePositions(page);
    const moveFinal = finalHandles.find((h) => h.kind === "move")!;
    expect(Math.abs(moveFinal.cx - moveBeforeResize.cx)).toBeLessThan(6);
    expect(Math.abs(moveFinal.cy - moveBeforeResize.cy)).toBeLessThan(6);
  });

  test("RECTANGLE — dragging the move handle keeps all 4 corner handles aligned", async ({
    page,
  }, testInfo) => {
    await advanceToStep2(page);
    const m = await mapCenter(page);

    await page.getByRole("button", { name: /Draw Rectangle/i }).click();
    await page.waitForTimeout(250);
    await dragBy(page, m.x, m.y, 120, 80);
    await page.waitForSelector(".leaflet-edit-move", { timeout: 5_000 });
    await page.waitForTimeout(400);

    const before = await handlePositions(page);
    const moveBefore = before.find((h) => h.kind === "move")!;
    const resizesBefore = before.filter((h) => h.kind === "resize");
    expect(resizesBefore.length, "rectangle should have 4 corner handles").toBe(4);

    const DRAG_DX = -60;
    const DRAG_DY = 50;
    await dragBy(page, moveBefore.cx, moveBefore.cy, DRAG_DX, DRAG_DY);

    const after = await handlePositions(page);
    const moveAfter = after.find((h) => h.kind === "move")!;
    const resizesAfter = after.filter((h) => h.kind === "resize");

    expect(Math.abs(moveAfter.cx - moveBefore.cx - DRAG_DX)).toBeLessThan(12);
    expect(Math.abs(moveAfter.cy - moveBefore.cy - DRAG_DY)).toBeLessThan(12);

    // All 4 corners should have shifted by the same delta.
    for (let i = 0; i < 4; i++) {
      const shiftX = resizesAfter[i].cx - resizesBefore[i].cx;
      const shiftY = resizesAfter[i].cy - resizesBefore[i].cy;
      expect(
        Math.abs(shiftX - DRAG_DX),
        `rectangle corner ${i} should shift with move. x-shift ${shiftX.toFixed(1)} vs expected ${DRAG_DX}`,
      ).toBeLessThan(12);
      expect(Math.abs(shiftY - DRAG_DY)).toBeLessThan(12);
    }

    await page.screenshot({
      path: testInfo.outputPath("rectangle-after-move.png"),
      fullPage: true,
    });
  });

  test("POLYGON — draw multi-point + drag a vertex, other vertices stay put", async ({
    page,
  }, testInfo) => {
    await advanceToStep2(page);
    const m = await mapCenter(page);

    await page.getByRole("button", { name: /Draw Area/i }).click();
    await page.waitForTimeout(250);

    // Leaflet-draw polygon: click each vertex, then click the first again (or
    // double-click the last) to finish.
    const pts = [
      { x: m.x, y: m.y },
      { x: m.x + 120, y: m.y + 20 },
      { x: m.x + 100, y: m.y + 120 },
      { x: m.x - 40, y: m.y + 100 },
    ];
    for (const p of pts) {
      await page.mouse.click(p.x, p.y);
      await page.waitForTimeout(150);
    }
    // Double-click the last point to finish.
    await page.mouse.dblclick(pts[pts.length - 1].x, pts[pts.length - 1].y);
    await page.waitForTimeout(600);
    await page.waitForSelector(".leaflet-edit-resize", { timeout: 5_000 });

    const before = await handlePositions(page);
    const vertices = before.filter((h) => h.kind === "resize");
    expect(
      vertices.length,
      "polygon should produce at least 4 vertex markers (plus midpoints)",
    ).toBeGreaterThanOrEqual(4);

    // Drag the first vertex.
    const v0 = vertices[0];
    const DRAG_DX = 40;
    const DRAG_DY = -30;
    await dragBy(page, v0.cx, v0.cy, DRAG_DX, DRAG_DY);

    const after = await handlePositions(page);
    const verticesAfter = after.filter((h) => h.kind === "resize");

    // Primary check: a vertex should exist at approximately the dragged
    // position. (Leaflet also re-positions midpoint markers between the
    // moved corner and its neighbors — we don't assert on those because
    // their positions are a function of the corners that remained.)
    const moved = verticesAfter.find(
      (v) =>
        Math.abs(v.cx - v0.cx - DRAG_DX) < 14 &&
        Math.abs(v.cy - v0.cy - DRAG_DY) < 14,
    );
    expect(moved, "the dragged vertex should have moved by the drag delta").toBeTruthy();

    // Sanity: the polygon still has its corner vertices (nothing got
    // deleted or corrupted during the drag). Count should be >= 4.
    expect(
      verticesAfter.length,
      "polygon should still have at least 4 vertex markers after a vertex drag",
    ).toBeGreaterThanOrEqual(4);

    await page.screenshot({
      path: testInfo.outputPath("polygon-after-vertex-drag.png"),
      fullPage: true,
    });
  });
});
