# Screenshot Tools for Localhost Web Apps (2025-2026)

Research scan for capturing full-page screenshots of a Vue 3 + Vite app on localhost (Windows 11).
Use case: AI coding assistant (Claude Code) verifying visual output of postcard designs.

**Problem being solved:** Playwright MCP server via Bun crashes with "Illegal instruction" panics on Windows.

---

## Tool Comparison Matrix

| Tool | Install | One-Shot CLI | Long-Running | Windows Stability | Image Quality | AI-Agent Ready |
|------|---------|-------------|--------------|-------------------|---------------|----------------|
| **Puppeteer (Node.js script)** | `npm i puppeteer` | Script-based | Yes (pool) | Excellent | 1920x1080+ | Indirect |
| **Playwright (Node.js script)** | `npm i playwright` | Script-based | Yes (context) | Excellent via Node | 1920x1080+ | Indirect |
| **Playwright CLI** | `npx playwright screenshot` | Yes, native | No | Good | 1920x1080+ | Yes |
| **Chrome Headless Shell** | Ships with Chrome | `chrome --screenshot` | No | Excellent (native) | Good (viewport only) | Yes |
| **agent-browser (Vercel)** | `npm i -g agent-browser` | Yes | Daemon-based | Experimental | 1920x1080+ | Built for AI agents |
| **Chromancer** | `npm i -g chromancer` | Yes | Daemon-based | Full support listed | Good | Yes (AI commands) |
| **screencut** | `npm i screencut` | `npx screencut <url>` | SDK mode | Likely good (Puppeteer-based) | 1920x1080+ | Indirect |
| **WebShot (Rust)** | `cargo install` from source | Yes | No | Listed as supported | 1920x1080+ | No |
| **gochromedp (Go)** | `go install` from source | Yes | No | Cross-platform | 1920x1080+ | No |
| **Stagehand / Browse CLI** | `npm i @browserbasehq/stagehand` | Browse CLI: yes | Daemon | Windows: WSL only (browse CLI) | 1920x1080+ | Built for AI agents |
| **OpenChrome** | npm or desktop installer | CLI + MCP | MCP server | Full support (Windows EXE) | Adaptive | Built for AI agents |
| **Snaprocket** | `npm i -g snaprocket` | Yes | No | Puppeteer-based, likely good | Multiple viewports | No |

---

## Detailed Analysis

### 1. Puppeteer (Direct Node.js Script) -- RECOMMENDED FOR STABILITY

**What:** Google's official Chrome automation library. Focused on Chromium only.
**Install:** `npm install puppeteer` (auto-downloads Chromium ~280MB)
**Windows stability:** Excellent. Runs via Node.js, no Bun dependency. Battle-tested on Windows for years.

**One-shot script:**
```js
const puppeteer = require('puppeteer');
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto('http://localhost:5173/route', { waitUntil: 'networkidle0' });
await page.screenshot({ path: 'screenshot.png', fullPage: true });
await browser.close();
```

**Pros:**
- Lighter install (one browser, ~280MB vs ~900MB for Playwright)
- Faster browser launch (~0.9s vs ~1.2s)
- Lower memory (~200MB vs ~250MB per instance)
- Massive ecosystem, tons of Stack Overflow answers
- Google-maintained, tracks Chrome releases closely
- No Bun dependency -- runs on plain Node.js

**Cons:**
- No built-in CLI `screenshot` command (need a wrapper script)
- No auto-wait (must manually `waitForSelector` or `waitForNetworkIdle`)
- Chromium only (fine for this use case)

**Known issues:** None significant on Windows in 2025-2026. Memory leaks possible in long-running scenarios but irrelevant for one-shot usage.

---

### 2. Playwright (Direct Node.js Script)

**What:** Microsoft's cross-browser automation. Supports Chromium, Firefox, WebKit.
**Install:** `npm install playwright` then `npx playwright install chromium`
**Windows stability:** Excellent when run via Node.js directly. The crashes you're experiencing are from the Playwright MCP server running through Bun, not Playwright itself.

**One-shot script:**
```js
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto('http://localhost:5173/route', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'screenshot.png', fullPage: true });
await browser.close();
```

**Built-in CLI screenshot command:**
```bash
npx playwright screenshot --viewport-size="1920,1080" --full-page http://localhost:5173 screenshot.png
```

**Pros:**
- Built-in CLI `screenshot` command (no script needed)
- Auto-wait built in (more reliable page-ready detection)
- Better debugging (trace viewer, screenshot on failure)
- ~7M weekly npm downloads (vs ~4M for Puppeteer) as of March 2026
- BrowserContext isolation (lighter than full browser instances)

**Cons:**
- Larger install if you download all 3 browsers (~900MB)
- Slightly slower browser launch
- The MCP server + Bun combo is what's crashing, not Playwright itself

**Key insight:** The "Illegal instruction" crash is almost certainly a Bun + Playwright interaction issue on Windows, not a Playwright stability problem. Running Playwright directly via Node.js should be completely stable.

---

### 3. Chrome Headless Shell (Built-in Chrome)

**What:** Chrome's built-in headless mode. No extra install needed if Chrome is already on the system.
**Install:** Already installed (Chrome on Windows 11)

**One-shot command:**
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --headless=new \
  --screenshot=screenshot.png \
  --window-size=1920,1080 \
  --disable-gpu \
  http://localhost:5173
```

**Pros:**
- Zero dependencies -- uses system Chrome
- Extremely stable (it IS Chrome)
- Fastest possible launch
- No Node.js, no npm, no nothing

**Cons:**
- No `fullPage` option (captures viewport only, not scrollable area)
- No `waitUntil` control (may capture before page fully renders)
- Limited options for waiting for dynamic content
- Can't set device pixel ratio easily
- Output quality depends on viewport size

**Verdict:** Good for quick checks but unreliable for SPAs that need JS to finish rendering. No way to wait for Vue components to mount.

---

### 4. agent-browser (Vercel Labs)

**What:** Headless browser CLI designed specifically for AI coding agents. Built by a Vercel engineer.
**Install:** `npm install -g agent-browser && agent-browser install`
**Architecture:** Rust CLI -> Node.js daemon -> Playwright -> Chromium

**Usage:**
```bash
agent-browser open http://localhost:5173
agent-browser screenshot postcard.png
agent-browser close
```

**Pros:**
- Purpose-built for AI agent workflows (Claude Code, Codex, Gemini CLI)
- Daemon architecture: first command starts browser, subsequent commands reuse it (<200ms latency)
- 60+ commands including navigation, form filling, screenshot
- Deterministic element refs for reliable interaction
- Snapshot-based workflow reduces token usage by ~90%
- Cross-platform: macOS, Linux, Windows

**Cons:**
- Relatively new (Jan 2026)
- Chromium only
- Under the hood uses Playwright via Node.js daemon -- if the daemon crashes, same class of issues
- No built-in stealth or proxy
- Windows support is listed but may have rough edges (Unix socket based -- Windows requires TCP or named pipes)

**Verdict:** Very promising for the AI-agent use case. The daemon model means the browser stays warm between screenshots. However, it's new and the Windows socket implementation may not be fully mature. Worth testing.

---

### 5. Chromancer (by John Lindquist / Script Kit)

**What:** CLI for automating Chrome using Playwright. Designed for scraping, screenshots, and AI-driven workflows.
**Install:** `npm install -g chromancer`

**Usage:**
```bash
chromancer spawn --headless
chromancer navigate http://localhost:5173
chromancer wait --selector ".postcard-loaded"
chromancer screenshot postcard.png
chromancer stop
```

**Pros:**
- Full Windows support with automatic Chrome detection
- Daemon model (spawn -> commands -> stop)
- Wait for selectors before screenshot
- AI integration (`chromancer ai "..."`)
- Powered by Playwright under the hood

**Cons:**
- Low adoption (~10 weekly npm downloads)
- Relies on system Chrome (not bundled)
- Under active development (many versions in June 2025)

**Verdict:** Interesting but too low adoption to trust for production use. The CLI ergonomics are nice though.

---

### 6. Stagehand + Browse CLI (Browserbase)

**What:** AI browser automation framework (22K GitHub stars). Browse CLI is its headless CLI for agents.
**Install:** `npm install -g @browserbasehq/stagehand` or use Browse CLI

**Browse CLI usage:**
```bash
browse open http://localhost:5173
browse screenshot ./postcard.png --full-page
browse stop
```

**Stagehand SDK usage:**
```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  localBrowserLaunchOptions: {
    headless: true,
    viewport: { width: 1920, height: 1080 }
  }
});
await stagehand.init();
const page = stagehand.context.pages()[0];
await page.goto("http://localhost:5173");
await page.screenshot({ path: "postcard.png", fullPage: true });
await stagehand.close();
```

**Pros:**
- Massive community (22K stars, active development)
- Local mode works without cloud/API keys
- SDK + CLI options
- Auto-caching and self-healing for repeated workflows
- Desktop app available (Windows EXE)

**Cons:**
- Browse CLI explicitly states "Windows support requires WSL or TCP socket implementation" -- NOT native Windows
- Stagehand SDK should work on Windows (it's Node.js + Playwright underneath)
- Overkill for simple screenshots -- designed for AI agent navigation
- Requires LLM API key for AI features (not needed for raw page.screenshot())

**Verdict:** The SDK works on Windows but Browse CLI does not natively support Windows. For your use case (just screenshots, no AI navigation), using Stagehand is equivalent to using Playwright directly with extra overhead.

---

### 7. OpenChrome

**What:** Open-source MCP server that talks directly to Chrome via CDP (no Playwright/Puppeteer middleware).
**Install:** `npm install -g openchrome-mcp` or download Windows EXE installer
**Architecture:** MCP -> CDP (direct). No Playwright layer.

**Pros:**
- Direct CDP connection (no middleware = fewer crash points)
- Full Windows support with taskkill process cleanup
- Desktop app with Windows installer
- Can reuse existing Chrome login sessions
- 46 tools including screenshot with adaptive quality
- MCP server (works with Claude Code natively)

**Cons:**
- Designed as MCP server, not standalone CLI
- Relatively new
- Headless mode doesn't persist cookies across restarts

**Verdict:** Interesting because it removes the Playwright layer that may be contributing to your crashes. Direct CDP to Chrome is the most stable possible architecture. Worth testing as MCP replacement.

---

### 8. screencut

**What:** Puppeteer-based screenshot tool. CLI + Node.js SDK.
**Install:** `npm install screencut`

**One-shot:**
```bash
npx screencut http://localhost:5173 --width 1920 --height 1080 --full-page
```

**Pros:**
- Dead simple CLI
- Puppeteer underneath (stable on Windows)
- SDK for programmatic use
- TypeScript types bundled
- Auto-timestamped filenames

**Cons:**
- Very new (Feb 2026), zero GitHub stars
- Thin wrapper around Puppeteer (could just use Puppeteer directly)

---

### 9. WebShot (Rust + headless_chrome crate)

**What:** Rust CLI using the `headless_chrome` crate for screenshots and visual regression.
**Install:** `cargo install --path .` (from source) or download release binary

**Usage:**
```bash
webshot http://localhost:5173 -o postcard.png -w 1920 -h 1080
```

**Pros:**
- Native binary (fast, no Node.js runtime)
- Visual regression testing built in (pixel-diff, SSIM comparison)
- Custom Chrome flags supported
- Windows/macOS/Linux

**Cons:**
- Tiny project (4 stars, 1 contributor)
- Requires Chrome installed
- No npm install (need Rust toolchain or release binary)
- Only 787 total crate downloads

---

## Recommendations

### Best Option: Simple Puppeteer/Playwright Script via Node.js

The "Illegal instruction" crash is a Bun runtime issue, not a Playwright issue. The fix is straightforward:

**Option A -- Playwright CLI (zero code):**
```bash
npx playwright install chromium
npx playwright screenshot --viewport-size="1920,1080" --full-page --wait-for-timeout=3000 http://localhost:5173/postcard screenshot.png
```

**Option B -- Puppeteer one-shot script (most control):**
Create `screenshot.mjs`:
```js
import puppeteer from 'puppeteer';
const [,, url, output] = process.argv;
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(url || 'http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
await page.screenshot({ path: output || 'screenshot.png', fullPage: true, type: 'png' });
await browser.close();
```
Run: `node screenshot.mjs http://localhost:5173/postcard postcard.png`

**Option C -- Replace Playwright MCP with OpenChrome MCP:**
If you want to keep the MCP server pattern but avoid the Bun+Playwright crash, OpenChrome talks directly to Chrome via CDP with no Playwright middleware. Has a Windows installer.

### Why NOT to use:
- **Browse CLI (Stagehand):** Does not support Windows natively (requires WSL)
- **agent-browser:** Windows socket support uncertain; new project
- **Chrome --screenshot:** No wait-for-render, bad for SPAs
- **Chromancer:** Too low adoption
- **WebShot/gochromedp:** Requires Rust/Go toolchain

### Root Cause of Current Crashes

The "Illegal instruction" panic is almost certainly caused by running Playwright's MCP server through Bun on Windows. Bun's Windows support has known issues with native modules and child process management. The fix is to run the same Playwright code through Node.js instead of Bun, OR use a tool that bypasses Playwright entirely (OpenChrome via direct CDP, or raw Chrome headless shell for simple cases).

---

## Sources

- renderscreenshot.com/blog/puppeteer-vs-playwright-screenshots (Feb 2026)
- snapapi.pics/blog-playwright-vs-puppeteer-screenshots.html (Feb 2026)
- pkgpulse.com/blog/playwright-vs-puppeteer-2026 (Mar 2026)
- screenshotengine.com/blog/playwright-vs-puppeteer (Jan 2026)
- blog.lordpatil.com/posts/agent-browser-lightweight-headless-browser-cli-for-ai-agents (Jan 2026)
- github.com/browserbase/stagehand (22K stars, active Apr 2026)
- github.com/shaun0927/openchrome (Jan 2026)
- npmjs.com/package/@browserbasehq/browse-cli (Mar 2026)
- npmjs.com/package/chromancer (Jun 2025)
- github.com/kholdrex/webshot (Aug 2025)
- github.com/benoitpetit/screencut (Feb 2026)
- dawid.dev/dev/snaprocket
- github.com/chinmay-sawant/gochromedp (Sep 2025)
