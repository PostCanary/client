import { test, expect } from "@playwright/test";

/**
 * DIAGNOSTIC spec for Card 1 Generate Proof bug (mem 482).
 *
 * Observed in Session 59:
 *   - Proof panel opens with 3-card grid.
 *   - Card 1 shows blank with alt-text "Proof for card 1".
 *   - Cards 2 and 3 appear to render, but hypothesis is they're stale blobs.
 *   - Render-worker logs showed Card 1 endpoint hit TWICE, none for Cards 2/3.
 *
 * This spec records every POST to /preview-card/N with timestamp, status,
 * body size, and X-Render-Warnings, plus every browser console event, then
 * clicks Generate Proof and asserts on the proofImages <img> src values.
 * On failure it writes the full event log to the trace for review.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const PREVIEW_CARD_RE = /\/api\/campaign-drafts\/([0-9a-f-]{36})\/preview-card\/(\d+)/;

test.describe("generate-proof diagnostic — live stack", () => {
  test(
    "captures network + console + <img> src during Generate Proof click",
    async ({ page }, testInfo) => {
      type PreviewResponse = {
        ts: number;
        draftId: string;
        cardN: number;
        status: number;
        size: number;
        warnings: string;
      };
      const previewResponses: PreviewResponse[] = [];
      const consoleEvents: { ts: number; type: string; text: string }[] = [];
      const pageErrors: string[] = [];

      page.on("response", async (resp) => {
        const m = resp.url().match(PREVIEW_CARD_RE);
        if (!m) return;
        let size = 0;
        try {
          const body = await resp.body();
          size = body.length;
        } catch {
          size = -1;
        }
        previewResponses.push({
          ts: Date.now(),
          draftId: m[1],
          cardN: Number(m[2]),
          status: resp.status(),
          size,
          warnings: resp.headers()["x-render-warnings"] ?? "",
        });
      });

      page.on("console", (msg) => {
        consoleEvents.push({
          ts: Date.now(),
          type: msg.type(),
          text: msg.text(),
        });
      });

      page.on("pageerror", (err) => {
        pageErrors.push(`${err.name}: ${err.message}\n${err.stack ?? ""}`);
      });

      await page.goto("/app/send");
      await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });
      const draftId = page.url().match(DRAFT_URL_RE)![1];

      await page
        .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
        .click();
      await page.getByRole("button", { name: "Next", exact: true }).click();

      const step3Btn = page.getByRole("button", { name: /3\s+Your Postcard/ });
      await expect(step3Btn).toBeEnabled({ timeout: 30_000 });
      await step3Btn.click();

      await expect(
        page.getByText("Your 3-card sequence — same branding, different messaging"),
      ).toBeVisible({ timeout: 30_000 });

      // Wait until the single-card preview has finished hydrating so that
      // the useCardPreview composable isn't actively fetching Card 1 when
      // we click Generate Proof.
      await expect(page.getByRole("img", { name: "Postcard preview" })).toBeVisible({
        timeout: 60_000,
      });

      // Clear the response log so we only capture what happens post-click.
      const clickedAt = Date.now();
      const baselinePreviews = [...previewResponses];

      await page.getByRole("button", { name: /Generate Proof/i }).click();

      // Wait up to 90s for proofImages to populate the grid. The app
      // sequentially calls previewCard for each card in the sequence.
      const proofImgs = page.locator('img[alt^="Proof for card"]');
      await expect(async () => {
        const count = await proofImgs.count();
        expect(count).toBeGreaterThanOrEqual(3);
      }).toPass({ timeout: 90_000, intervals: [500, 1000, 2000] });

      const srcs = await proofImgs.evaluateAll((els) =>
        els.map((el) => (el as HTMLImageElement).getAttribute("src") ?? ""),
      );

      const postClickPreviews = previewResponses.filter((r) => r.ts >= clickedAt);

      const report = {
        draftId,
        clickedAt,
        srcs,
        baselinePreviews,
        postClickPreviews,
        consoleTail: consoleEvents.slice(-60),
        pageErrors,
      };
      await testInfo.attach("diagnostic-report.json", {
        body: JSON.stringify(report, null, 2),
        contentType: "application/json",
      });

      console.log("\n=== GENERATE-PROOF DIAGNOSTIC REPORT ===");
      console.log("draftId:", draftId);
      console.log("img srcs:");
      srcs.forEach((s, i) => console.log(`  Card ${i + 1}:`, s?.slice(0, 80) || "(empty)"));
      console.log("\npost-click /preview-card calls:");
      postClickPreviews.forEach((r) =>
        console.log(
          `  t+${r.ts - clickedAt}ms  card=${r.cardN}  status=${r.status}  size=${r.size}  warnings=${r.warnings || "-"}`,
        ),
      );
      console.log("\npage errors:", pageErrors.length === 0 ? "(none)" : pageErrors);
      const errConsole = consoleEvents
        .filter((e) => e.ts >= clickedAt && (e.type === "error" || e.type === "warning"))
        .slice(-20);
      console.log("\npost-click console errors/warnings:");
      errConsole.forEach((e) =>
        console.log(`  [${e.type}] ${e.text.slice(0, 160)}`),
      );
      console.log("=== END REPORT ===\n");

      // Assertions — fail visibly so the HTML report shows the story.
      expect(pageErrors, "no uncaught page errors during Generate Proof").toEqual([]);
      expect(srcs.length, "proof grid should have 3 imgs").toBe(3);
      const blankCards = srcs
        .map((s, i) => ({ i, s }))
        .filter(({ s }) => !s || s === "");
      expect(
        blankCards,
        `cards with empty src: ${JSON.stringify(blankCards)}`,
      ).toEqual([]);

      // Each card should have triggered a unique /preview-card call.
      for (const cardN of [1, 2, 3]) {
        const hits = postClickPreviews.filter((r) => r.cardN === cardN);
        expect(
          hits.length,
          `post-click preview-card calls for card ${cardN}: ${hits.length}. Full log: ${JSON.stringify(postClickPreviews, null, 2)}`,
        ).toBeGreaterThanOrEqual(1);
      }
    },
  );
});
