// scripts/render-postcard-preview.mjs
//
// Renders the /dev/postcard-preview route for the Desert Diamond HVAC demo
// and writes PNG screenshots of the front and back to demo-smoke-test-<DATE>/.
//
// Assumes `npm run dev` is ALREADY running on http://localhost:5173 (or
// whatever port Vite has picked — pass via DEV_URL env var if non-default).
//
// Usage:
//   npm run dev               # in one terminal
//   npm run render-postcard-preview   # in another terminal
//
// Writes:
//   demo-smoke-test-<YYYY-MM-DD>/desert-diamond-FRONT.png
//   demo-smoke-test-<YYYY-MM-DD>/desert-diamond-BACK.png

import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const devUrl = process.env.DEV_URL ?? "http://localhost:5173";
const route = "/dev/postcard-preview";

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const outDir = resolve(repoRoot, `demo-smoke-test-${today}`);
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2, // Retina — crisper PNGs for visual inspection
});
const page = await context.newPage();

console.log(`Navigating to ${devUrl}${route}`);
await page.goto(`${devUrl}${route}`, { waitUntil: "networkidle" });

// Wait for the front card to be visible. The dev route shows both front
// and back stacked vertically. Screenshot each by selector.
await page.waitForSelector(".pc-card", { timeout: 10000 });

const cards = await page.locator(".pc-card").all();
if (cards.length < 2) {
  throw new Error(`Expected 2 .pc-card elements (front + back), found ${cards.length}`);
}

const frontPath = resolve(outDir, "desert-diamond-FRONT.png");
const backPath = resolve(outDir, "desert-diamond-BACK.png");

await cards[0].screenshot({ path: frontPath });
console.log(`Wrote ${frontPath}`);

await cards[1].screenshot({ path: backPath });
console.log(`Wrote ${backPath}`);

await browser.close();
console.log("Done.");
