/**
 * One-shot screenshot script using Puppeteer (Node.js, not Bun).
 * Replaces the Playwright MCP server which crashes on Windows.
 *
 * Usage:
 *   node scripts/screenshot.mjs <url> <output.png> [--wait <ms>] [--width <px>] [--height <px>]
 *
 * Examples:
 *   node scripts/screenshot.mjs http://localhost:5175/dev/postcard-preview screenshot.png
 *   node scripts/screenshot.mjs http://localhost:5175/dev/postcard-preview front.png --wait 5000
 *   node scripts/screenshot.mjs http://localhost:5175/dev/postcard-preview card.png --width 1200 --height 900
 */

import puppeteer from 'puppeteer';

const args = process.argv.slice(2);
const url = args[0] || 'http://localhost:5173/dev/postcard-preview';
const output = args[1] || 'screenshot.png';

// Parse optional flags
const waitIdx = args.indexOf('--wait');
const waitMs = waitIdx !== -1 ? parseInt(args[waitIdx + 1], 10) : 3000;

const widthIdx = args.indexOf('--width');
const width = widthIdx !== -1 ? parseInt(args[widthIdx + 1], 10) : 1920;

const heightIdx = args.indexOf('--height');
const height = heightIdx !== -1 ? parseInt(args[heightIdx + 1], 10) : 1080;

const fullPage = !args.includes('--no-full-page');

try {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // Extra wait for Vue hydration / font loading
  if (waitMs > 0) {
    await new Promise(r => setTimeout(r, waitMs));
  }

  await page.screenshot({ path: output, fullPage, type: 'png' });
  await browser.close();

  console.log(`Screenshot saved: ${output}`);
} catch (err) {
  console.error('Screenshot failed:', err.message);
  process.exit(1);
}
