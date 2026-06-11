import { test, expect, type Page } from "@playwright/test";

/**
 * S73 live verification on feature-mail (one walk-through, one draft —
 * draft creation runs 3 AI calls, so everything shares it):
 *
 * 1. License number saves from Business Info and triggers a re-render
 * 2. photo-top layout renders (wave-3 template, condensed headline)
 * 3. service-checklist: Edit Checklist section edits a row end-to-end
 * 4. urgency-notice: Edit Notice Text edits the body end-to-end
 * 5. Reconcile tail after a headline edit is measurably under the old ~7s
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const PREVIEW_CARD_RE = /\/api\/campaign-drafts\/([0-9a-f-]{36})\/preview-card\/(\d+)/;

test.describe("S73 features — live feature-mail", () => {
  test("license, photo-top, checklist/notice editors, reconcile tail", async ({
    page,
  }) => {
    const previewResponses: { at: number; status: number }[] = [];
    page.on("response", (resp) => {
      if (PREVIEW_CARD_RE.test(resp.url())) {
        previewResponses.push({ at: Date.now(), status: resp.status() });
      }
    });
    const previewCountSince = (t: number) =>
      previewResponses.filter((r) => r.at >= t && r.status === 200).length;

    // --- Step 1-3: new draft into the designer -------------------------
    await page.goto("/app/send");
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });
    const draftId = page.url().match(DRAFT_URL_RE)![1]!;

    await page
      .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
      .click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const step3Btn = page.getByRole("button", { name: /(?:3\s+)?Your Postcard/ });
    await expect(step3Btn).toBeEnabled({ timeout: 60_000 });
    await step3Btn.click();

    await expect
      .poll(() => previewResponses.some((r) => r.status === 200), {
        timeout: 120_000,
      })
      .toBe(true);

    // Wait for the goal-step's async AI generation to finish before any
    // design edits: generation completing later overwrites design state
    // server-side (observed live — a layout switch made during the
    // generation window is silently reverted; pre-existing race, noted
    // in the session report).
    await expect
      .poll(
        async () => {
          const draft = await page.request
            .get(`/api/campaign-drafts/${draftId}`)
            .then((r) => r.json());
          const cards = draft.data?.design?.sequenceCards ?? [];
          return (
            cards.length >= 3 &&
            cards.every((c: any) => c?.resolvedContent?.headline)
          );
        },
        { timeout: 120_000 },
      )
      .toBe(true);

    // --- 1. License number ---------------------------------------------
    // Unique per run: drake's brand kit keeps the previous value, and the
    // Save button only enables when the form is dirty.
    const licenseValue = `CSLB #${Date.now() % 1000000}`;
    await page.getByTestId("edit-business-toggle").click();
    const licenseInput = page.getByTestId("biz-license-input");
    await expect(licenseInput).toBeVisible();
    await licenseInput.fill(licenseValue);
    const beforeLicenseSave = Date.now();
    await page.getByTestId("biz-save").click();
    // Save round-trips the brand kit; the panel refreshes the preview.
    await expect
      .poll(() => previewCountSince(beforeLicenseSave), { timeout: 60_000 })
      .toBeGreaterThan(0);
    const bk = await page.request.get("/api/brand-kit").then((r) => r.json());
    expect(bk.data?.licenseNumber ?? bk.licenseNumber).toBe(licenseValue);

    // --- helper: switch layout through the template browser -------------
    const browserPanel = () =>
      page.locator("div.fixed.inset-0").filter({ hasText: "Choose a Template" });

    async function switchLayout(name: string) {
      await page
        .getByRole("button", { name: "Try Different Template" })
        .click();
      const panel = browserPanel();
      await expect(panel).toBeVisible();
      let card = panel
        .locator("div.rounded-xl")
        .filter({ has: page.getByText(name, { exact: true }) })
        .first();
      if (!(await card.isVisible().catch(() => false))) {
        await panel.getByRole("button", { name: /More styles/ }).click();
        card = panel
          .locator("div.rounded-xl")
          .filter({ has: page.getByText(name, { exact: true }) })
          .first();
      }
      const t0 = Date.now();
      await card.click();
      await expect(panel).toHaveCount(0, { timeout: 15_000 });
      // Switch is instant remap + one authoritative re-render.
      await expect
        .poll(() => previewCountSince(t0), { timeout: 60_000 })
        .toBeGreaterThan(0);
      await expect(page.getByText("Applying new layout…")).toHaveCount(0, {
        timeout: 30_000,
      });
      return t0;
    }

    async function activeCardField(field: string): Promise<any> {
      const draft = await page.request
        .get(`/api/campaign-drafts/${draftId}`)
        .then((r) => r.json());
      const cards = draft.data?.design?.sequenceCards ?? [];
      return cards[0]?.[field] ?? cards[0]?.resolvedContent?.[field];
    }

    // Draft saves are debounced — poll instead of one-shot asserting.
    async function expectCardField(field: string, predicate: (v: any) => boolean) {
      await expect
        .poll(async () => predicate(await activeCardField(field)), {
          timeout: 30_000,
        })
        .toBe(true);
    }

    // --- 2. photo-top renders -------------------------------------------
    await switchLayout("Photo Top");
    await expectCardField(
      "renderTemplateId",
      (v) => v === "photo-top-front-v1",
    );

    // --- 3. service-checklist row editor ---------------------------------
    await switchLayout("Service Checklist");
    await expectCardField(
      "renderTemplateId",
      (v) => v === "service-checklist-front-v1",
    );
    await page.getByTestId("edit-checklist-toggle").click();
    const row0 = page.getByTestId("checklist-row-0");
    await expect(row0).toBeVisible();
    const beforeRowEdit = Date.now();
    await row0.fill("Mini-Split Installs");
    await expect
      .poll(() => previewCountSince(beforeRowEdit), { timeout: 60_000 })
      .toBeGreaterThan(0);
    await expectCardField(
      "serviceRows",
      (v) => Array.isArray(v) && v[0] === "Mini-Split Installs",
    );

    // --- 4. urgency-notice body editor -----------------------------------
    await switchLayout("Urgency Notice");
    await page.getByTestId("edit-notice-toggle").click();
    const noticeBody = page.getByTestId("notice-body-input");
    await expect(noticeBody).toBeVisible();
    const beforeNoticeEdit = Date.now();
    await noticeBody.fill("Book before July 1 — summer slots are almost gone.");
    await expect
      .poll(() => previewCountSince(beforeNoticeEdit), { timeout: 60_000 })
      .toBeGreaterThan(0);
    await expectCardField(
      "urgencyText",
      (v) => typeof v === "string" && v.includes("Book before July 1"),
    );

    // --- 5. Reconcile tail on a headline edit ----------------------------
    await page.getByRole("button", { name: "Edit Headline", exact: true }).click();
    const lineInput = page.getByTestId("headline-line-red1");
    await expect(lineInput).toBeVisible();
    // Let the queue drain from the notice edit before measuring.
    await page.waitForTimeout(4_000);
    const editAt = Date.now();
    await lineInput.fill(`Timing ${Date.now() % 100000}`);
    await expect
      .poll(() => previewCountSince(editAt), { timeout: 30_000 })
      .toBeGreaterThan(0);
    const reconciled = previewResponses.find(
      (r) => r.at >= editAt && r.status === 200,
    )!;
    const tailMs = reconciled.at - editAt;
    console.log(`[s73] reconcile tail after keystroke: ${tailMs}ms`);
    // Old pipeline measured ~7s; single-pass + 96 DPI should land well under.
    expect(tailMs).toBeLessThan(6_000);
  });
});
