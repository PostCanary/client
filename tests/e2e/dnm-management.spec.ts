/**
 * dnm-management.spec.ts — Sprint 1.5 #4 DNM management page coverage
 *
 * Verifies the customer-facing /app/audience/do-not-mail page renders, lets
 * users add an entry through the modal, and reflects deletes optimistically.
 * Mocks /api/dnm/* with page.route() so the spec is self-contained.
 *
 * Run: npm run test:e2e -- dnm-management
 */
import { expect, test, type Page, type Route } from "@playwright/test";
import { createMockAppState, installMockApi } from "./support/mockApi";

type Entry = {
  id: string;
  address1: string;
  city: string;
  state: string;
  zip5: string;
  full_name: string | null;
  source: string;
  reason: string | null;
  created_at: string;
};

function entry(over: Partial<Entry> = {}): Entry {
  return {
    id: over.id ?? "11111111-1111-1111-1111-111111111111",
    address1: "123 Main St",
    city: "Phoenix",
    state: "AZ",
    zip5: "85001",
    full_name: null,
    source: "csv_upload",
    reason: null,
    created_at: "2026-05-01T12:00:00",
    ...over,
  };
}

async function installDnmRoutes(page: Page, store: { items: Entry[] }) {
  // GET /api/dnm/list
  await page.route("**/api/dnm/list*", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        items: store.items,
        total: store.items.length,
        page: 1,
        per_page: 50,
      }),
    });
  });

  // POST /api/dnm — single create
  await page.route("**/api/dnm", async (route: Route, request) => {
    if (request.method() === "POST") {
      const body = request.postDataJSON();
      const created: Entry = entry({
        id: "22222222-2222-2222-2222-222222222222",
        address1: body.address1,
        city: body.city,
        state: body.state,
        zip5: body.zip5,
        full_name: body.full_name ?? null,
        reason: body.reason ?? null,
        source: "manual",
        created_at: new Date().toISOString(),
      });
      store.items = [created, ...store.items];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, item: created }),
      });
      return;
    }

    await route.fallback();
  });

  // DELETE /api/dnm/<id>
  await page.route("**/api/dnm/**", async (route: Route, request) => {
    const method = request.method();
    const url = request.url();

    if (method === "DELETE") {
      const id = url.split("/").pop() ?? "";
      const before = store.items.length;
      store.items = store.items.filter((e) => e.id !== id);
      const status = store.items.length < before ? 200 : 404;
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(status === 200 ? { ok: true } : { error: "not_found" }),
      });
      return;
    }

    await route.fallback();
  });
}

test.describe("DNM management page — Sprint 1.5 #4", () => {
  test("empty state renders with the CSV format guide", async ({ page }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    const store = { items: [] as Entry[] };
    await installDnmRoutes(page, store);

    await page.goto("/app/audience/do-not-mail");

    // Scope to <main> — the topbar also renders "Do Not Mail" via navbarTitle.
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Do Not Mail" })).toBeVisible();
    await expect(main.getByText("Nothing on your Do Not Mail list yet.")).toBeVisible();
    await expect(main.getByText(/Header row required/)).toBeVisible();
  });

  test("add address flow inserts a row and closes the modal", async ({ page }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    const store = { items: [] as Entry[] };
    await installDnmRoutes(page, store);

    await page.goto("/app/audience/do-not-mail");
    const main = page.getByRole("main");
    await expect(main.getByText("Nothing on your Do Not Mail list yet.")).toBeVisible();

    await main.getByRole("button", { name: /Add address/ }).click();
    // Modal renders outside <main>, so scope to dialog.
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("123 Main St").fill("777 Pine Rd");
    await dialog.getByPlaceholder("Phoenix").fill("Tucson");
    await dialog.getByPlaceholder("AZ").fill("AZ");
    await dialog.getByPlaceholder("85001").fill("85701");
    await dialog.getByRole("button", { name: "Add to list" }).click();

    await expect(main.getByText("777 Pine Rd")).toBeVisible();
    await expect(main.getByText("Nothing on your Do Not Mail list yet.")).not.toBeVisible();
  });

  test("delete row removes it from the table optimistically", async ({ page }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    const store = {
      items: [
        entry({ id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", address1: "999 Test Lane" }),
      ],
    };
    await installDnmRoutes(page, store);

    await page.goto("/app/audience/do-not-mail");
    const main = page.getByRole("main");
    await expect(main.getByText("999 Test Lane")).toBeVisible();

    // The trash button lives inside the table row. Find the row by its address
    // text, then click the only button inside it (popconfirm trigger).
    const row = main.locator(".n-data-table-tr").filter({ hasText: "999 Test Lane" });
    await row.getByRole("button").click();
    // Popconfirm portals to <body>, not <main>.
    await page.getByRole("button", { name: "Remove" }).click();

    await expect(main.getByText("999 Test Lane")).not.toBeVisible();
  });
});
