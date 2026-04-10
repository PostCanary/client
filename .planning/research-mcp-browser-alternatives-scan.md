# MCP Browser Alternatives Scan

**Date:** 2026-04-09
**Problem:** @playwright/mcp crashes on Windows 11 (Bun "Illegal instruction" panics), and when the parent Claude Code/Bun process dies, the MCP server dies too. Need something more stable for visual verification workflows (localhost screenshots of PostCanary).

---

## TL;DR Recommendation

**For PostCanary's use case (localhost screenshot verification):**

1. **Best option: `agent-browser` CLI (one-shot commands, no MCP server needed)**
2. **Solid alternative: Chrome DevTools MCP (`chrome-devtools-mcp`)**
3. **Lightweight fallback: `chrome-local-mcp` (Puppeteer-based, Node.js runtime)**
4. **Nuclear option: plain CLI screenshot script (zero dependencies beyond Chrome)**

---

## Option 1: agent-browser (Vercel Labs) -- RECOMMENDED

- **URL:** https://github.com/vercel-labs/agent-browser
- **Stars:** 28,372 | Latest: v0.25.3 (2026-04-07)
- **Runtime:** Native Rust CLI binary (no Bun, no Node.js daemon dependency for core)
- **Windows 11:** Supported (x64 native binary)

### How it works
```bash
npm install -g agent-browser
agent-browser install              # downloads Chrome for Testing
agent-browser open http://localhost:3000
agent-browser screenshot page.png  # one-shot screenshot
agent-browser close
```

### Why this fits
- **One-shot CLI commands** -- no long-running MCP server process required
- Claude Code can just run shell commands; no MCP protocol overhead
- Native Rust binary boots in <50ms
- Daemon auto-starts and persists between commands (but crashes don't lose state -- next command restarts it)
- Works with existing Chrome/Brave/Edge installations (auto-detected)
- `--annotate` flag adds numbered element labels to screenshots
- Can also run as MCP server if desired: `claude mcp add browser -- npx -y agent-browser --mcp` (but CLI mode avoids the fragility)

### Crash resilience
- CLI commands are stateless -- each invocation is independent
- If the daemon crashes, the next CLI command restarts it automatically
- No coupling to Claude Code's process lifecycle when used as CLI
- If used as MCP server, same fragility as Playwright MCP applies

### Integration with AI coding tools
- Has a dedicated SKILL.md for Claude Code: `npx skills add vercel-labs/agent-browser`
- Output is compact text (~200-400 tokens vs ~3000-5000 for DOM)
- Supports `--screenshot-dir` for organized output

### Limitations
- Daemon architecture means there IS a background process (auto-managed)
- Relatively new project (Jan 2026)
- 385 open issues (active development, some rough edges)

---

## Option 2: Chrome DevTools MCP (Google Official)

- **URL:** https://github.com/ChromeDevTools/chrome-devtools-mcp
- **Stars:** 33,745 | Latest: v0.21.0 (2026-04-01)
- **Runtime:** Node.js (npx) + Puppeteer under the hood
- **Windows 11:** Supported (explicit Windows config documented, including for Codex)

### How it works
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "chrome-devtools-mcp@latest", "--headless"]
    }
  }
}
```

### Why this fits
- **Official Google project** -- well-maintained, 80 contributors, fast release cadence
- `--slim` mode exposes only 3 tools (navigate, script, screenshot) -- minimal token cost
- `--headless` mode for CI-like screenshot capture
- Can connect to an already-running Chrome instance (`--browser-url`, `--autoConnect`)
- Puppeteer under the hood (not Playwright) -- different runtime, may avoid Bun crashes
- Rich debugging: network requests, console logs, performance traces, Lighthouse audits

### Crash resilience
- Runs on Node.js via npx (not Bun) -- avoids the Bun "Illegal instruction" panics
- Still an MCP server -- dies if Claude Code dies (same fundamental fragility)
- Can connect to external Chrome process, so browser state survives MCP restart
- `--browser-url=http://127.0.0.1:9222` mode: you start Chrome separately, MCP just connects

### Windows 11 specific config
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "chrome-devtools-mcp@latest"],
      "env": { "SystemRoot": "C:\\Windows", "PROGRAMFILES": "C:\\Program Files" }
    }
  }
}
```

### Limitations
- Chrome only (no Firefox/WebKit, but that's fine for PostCanary)
- Collects usage statistics by default (opt-out with `--no-usage-statistics`)
- Still an MCP server process -- parent crash = child crash

---

## Option 3: chrome-local-mcp (Puppeteer-based, lightweight)

- **URL:** https://github.com/callmehuyv/chrome-local-mcp
- **npm:** chrome-local-mcp (299 weekly downloads)
- **Runtime:** Node.js + Puppeteer
- **Latest:** v1.3.0 (Mar 2026)

### How it works
```json
{
  "mcpServers": {
    "chrome-local": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "chrome-local-mcp"]
    }
  }
}
```

### Why this fits
- **Purpose-built for Claude Code** -- designed for "how Claude Code actually works"
- Persistent browser profile (log in once, stays logged in)
- Batch actions in single tool call (fewer round trips)
- Uses real Chrome with extensions and profiles
- Optional REST API on port 3033 for external access
- Node.js runtime (avoids Bun crashes)

### Crash resilience
- Same MCP fragility as all MCP servers
- REST API mode could be run independently: `npm run server` starts HTTP on port 3033
- Puppeteer auto-downloads Chromium if needed

### Limitations
- Small project (7 stars equivalent, 299 downloads/week)
- Less mature than Google's official offering
- macOS-specific features (Apple Vision OCR) won't help on Windows

---

## Option 4: Agent Browser Protocol (ABP) -- Chromium Fork

- **URL:** https://github.com/theredsix/agent-browser-protocol
- **Stars:** N/A (11 releases) | Latest: v0.1.10 (2026-03-28)
- **Runtime:** Modified Chromium binary with embedded HTTP+MCP server

### How it works
```bash
npx -y agent-browser-protocol --mcp
# OR just REST:
curl -s http://localhost:8222/api/v1/tabs
curl -X POST http://localhost:8222/api/v1/tabs/{id}/screenshot
```

### Why this might fit
- HTTP server baked into the browser engine itself
- Each API call is one atomic step (action + wait + screenshot + event log)
- Claims 2x lower token usage, 2x faster, 2x fewer tool calls vs Playwright MCP
- REST API means you can drive it from anything (curl, scripts, etc.)
- ~100ms overhead per action including screenshots

### Why it might NOT fit
- It's a Chromium fork -- heavier install, unusual dependency
- Very new (Jan 2026, only 11 releases)
- Running a modified Chromium binary is more exotic than running standard Chrome
- Less community validation

---

## Option 5: BrowserControl (Python, vision-first)

- **URL:** https://github.com/adityasasidhar/browsercontrol
- **Stars:** 7 | Python-based
- **Runtime:** Python + Playwright (ironically)

### Why to consider
- Vision-first approach: annotated screenshots with numbered red boxes
- Simple: `pip install browsercontrol` then `browsercontrol` to run
- 100% local/offline
- Session recording capability

### Why to skip for PostCanary
- Python dependency (project is Node/TS)
- Uses Playwright under the hood (same crash potential)
- Tiny community (7 stars, 1 contributor)

---

## Option 6: Vibium (Go-based, WebDriver BiDi)

- **URL:** https://github.com/VibiumDev/vibium
- **Stars:** 2,729 | Latest: v26.3.18
- **Runtime:** Go binary
- **Windows 11:** Supported (x64)

### How it works
```bash
npm install -g vibium
vibium open http://localhost:3000
vibium screenshot -o page.png
vibium screenshot --annotate -o annotated.png
```

### Why this fits
- Go binary = no Node/Bun/Python dependency for the core tool
- Standards-based (WebDriver BiDi, not proprietary CDP)
- CLI + MCP server + JS/TS/Python/Java client libraries
- `--annotate` screenshots with element labels
- Cross-platform native binaries

### Limitations
- Smaller community than agent-browser
- WebDriver BiDi protocol is newer/less battle-tested than CDP

---

## Option 7: Nuclear Fallback -- Plain Script

If all MCP/daemon solutions prove fragile, a one-shot Node.js script using Puppeteer directly:

```js
// screenshot.js -- zero daemon, zero MCP
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(process.argv[2] || 'http://localhost:3000');
  await page.screenshot({ path: process.argv[3] || 'screenshot.png', fullPage: true });
  await browser.close();
})();
```

Usage: `node screenshot.js http://localhost:3000 output.png`

### Why this fits
- Zero long-running processes
- Completely crash-proof (each invocation is independent)
- Claude Code can run it as a bash command
- No MCP overhead, no protocol, no daemon
- Puppeteer on Node.js (not Bun) -- stable on Windows

### Limitations
- No interactive element clicking/typing
- Cold start each time (~2-3 seconds)
- No MCP integration (Claude has to parse the screenshot image from disk)
- Have to build any interactivity yourself

---

## Comparison Matrix

| Feature | agent-browser CLI | Chrome DevTools MCP | chrome-local-mcp | Vibium | Plain Script |
|---|---|---|---|---|---|
| **Long-running process?** | Daemon (auto-managed) | Yes (MCP server) | Yes (MCP server) | Daemon (auto-managed) | No |
| **Crash resilience** | High (auto-restart) | Medium (reconnect) | Low | High (auto-restart) | Perfect |
| **Windows 11** | Native binary | Node.js/npx | Node.js/npx | Native binary | Node.js |
| **Runtime** | Rust | Node.js | Node.js | Go | Node.js |
| **Bun dependency** | None | None | None | None | None |
| **One-shot screenshots** | Yes | No (needs MCP) | No (needs MCP) | Yes | Yes |
| **Interactive browsing** | Yes | Yes | Yes | Yes | No |
| **Token efficiency** | High (text output) | Medium (slim=high) | Medium | High (text output) | N/A |
| **Maturity** | Medium (28K stars) | High (34K stars) | Low (new) | Medium (2.7K stars) | N/A |
| **Setup complexity** | `npm i -g agent-browser` | npx one-liner | npx one-liner | `npm i -g vibium` | One JS file |

---

## Community Consensus (Reddit r/ClaudeAI, April 2026)

From the thread "Faster / more efficient Playwright MCP alternatives?":

- **Most recommended:** Chrome DevTools MCP and CLI-based approaches
- **Key insight from user SM373:** "Use the CLI tool. Avoid MCPs at all cost unless you absolutely need them as they bloat everything and are extremely slow. The CLI approach is way faster, more reliable, more transparent and overall better."
- **Claude Code native:** `claude --chrome` launches Claude with Chrome extension integration, using scripting + screenshots. Available but separate from MCP.
- **Notte** mentioned as faster alternative (AI-native, intelligent waiting)
- **Playwright CLI with skills** recommended over Playwright MCP for token efficiency

---

## Analysis: Playwright vs Chrome DevTools MCP (Steve Kinney, April 2026)

From the most comprehensive comparison article found:

- **Playwright = driving the browser** (user flow automation, cross-browser testing)
- **Chrome DevTools MCP = debugging the browser** (performance, network, console inspection)
- For PostCanary's use case (screenshot verification of localhost): Chrome DevTools MCP in `--slim` mode is sufficient
- Microsoft themselves acknowledge: "CLI invocations are more token-efficient... MCP remains relevant for specialized agentic loops"
- Both teams have built explicit "slim/lean" modes because MCP tool schemas are token-heavy

---

## Recommended Path for PostCanary

### Phase 1: Immediate (replace @playwright/mcp)
1. Install `agent-browser` globally: `npm install -g agent-browser`
2. Add to CLAUDE.md as a skill or instruction
3. Use CLI commands for screenshots: `agent-browser open http://localhost:3000 && agent-browser screenshot page.png`
4. No MCP server needed -- just shell commands

### Phase 2: If agent-browser has issues
1. Switch to Chrome DevTools MCP in slim+headless mode (Node.js runtime, not Bun)
2. Config: `npx -y chrome-devtools-mcp@latest --slim --headless`
3. Wrap with `cmd /c` per Drake's MCP Windows rule

### Phase 3: If all MCP/daemon solutions fail
1. Use the plain Puppeteer script approach
2. One-shot, zero process management
3. Claude reads screenshots from disk path

### Key principle
The fragility comes from long-running processes tied to Claude Code's lifecycle. Every option that uses **CLI one-shot commands** instead of **persistent MCP servers** is inherently more crash-resilient on Windows.
