# UX Testing Tools Scan — April 2026

Research for: Claude Code driving interactive UX testing on a Vue 3 app, Windows 11.

---

## Executive Summary

**Playwright is the clear winner for AI-driven browser testing in 2026.** No tool has displaced it. The specific question for PostCanary is not "which tool" but "which integration method" — MCP server vs CLI scripts vs hybrid.

---

## 1. Is Playwright Still the Best Tool? (Yes)

Every source from 2025-2026 agrees: Playwright is the default choice for new projects and AI-driven testing.

**Key numbers (2026):**
- 33M weekly npm downloads (Cypress: 7M)
- 78,600+ GitHub stars
- 45.1% market share adoption
- AI first-try success rate: 94% (Cypress: 71%, tested with Claude 3.7 Sonnet + GPT-4o)
- Async errors from AI-generated code: 2% (Cypress: 23%)

**Why Playwright wins for AI agents specifically:**
- `async/await` pattern matches AI training data — LLMs generate correct Playwright code 94% of the time vs 71% for Cypress
- Auto-wait on every action (no manual `.should()` chains)
- Multi-tab, multi-origin support (Cypress cannot)
- Free built-in parallelization (Cypress requires paid cloud)
- Cross-browser: Chromium, Firefox, WebKit
- Multi-language: JS/TS, Python, Java, C#
- Accessibility tree snapshots: ~120 tokens vs ~1,500 tokens for screenshot-based approaches
- Native MCP server from Microsoft (`@playwright/mcp`)
- Playwright v1.56+ introduced Test Agents (planner, generator, healer)

**Nothing has displaced it.** Tools like Stagehand, Browser Use, etc. are built ON TOP of Playwright or use CDP directly — they're complements, not replacements.

---

## 2. Tool-by-Tool Assessment

### Playwright MCP (`@playwright/mcp`) — RECOMMENDED
- **What:** Microsoft's official MCP server. 29,200+ GitHub stars. Apache 2.0. Free.
- **How it works:** Exposes 34 tools (navigate, click, type, screenshot, snapshot, assertions). Uses accessibility tree, not screenshots. ~120 tokens per interaction vs ~1,500 for pixel-based.
- **Claude Code integration:** One command: `claude mcp add playwright npx @playwright/mcp@latest`
- **Strengths:** Direct browser control. Persistent state. Real-time adaptation. Self-QA workflow (Claude builds code, then opens browser to verify). Test code generation via `--codegen`.
- **Weaknesses:** Higher token consumption than CLI (full accessibility tree per call). MCP server can crash (your exact issue when running via Bun).
- **Windows:** Works. Requires Node.js 18+ (not Bun).
- **Key tip from Builder.io:** Say "Playwright MCP" explicitly in first message or Claude defaults to Bash Playwright commands. Pin version (`@playwright/mcp@0.0.23`) instead of `@latest` to avoid crashes from beta releases.

### Playwright CLI (Script-based) — RECOMMENDED AS FALLBACK
- **What:** Standard `npx playwright test` or Node.js scripts.
- **How it works:** Claude writes Playwright test scripts, runs them via Bash, reads output.
- **Strengths:** More token-efficient (results go to files, not inline). No MCP server stability issues. Works perfectly on Windows via Node.js (your confirmed working setup). Better for repeatable/CI tests.
- **Weaknesses:** No persistent browser state between Claude messages. Less interactive — Claude can't "look around" in real-time.
- **Best use:** Repeatable regression tests. When MCP server is flaky.

### Hybrid: MCP + CLI — BEST APPROACH
- Use MCP for exploratory testing, self-QA, interactive debugging
- Use CLI for repeatable test suites, CI/CD
- MCP discovers flows, CLI codegen produces stable test files

### Cypress — NOT RECOMMENDED FOR THIS USE CASE
- AI-generated Cypress code fails 29% of the time (vs 6% for Playwright)
- Custom command queue confuses LLMs — `cy.get().should()` chaining is unlike standard async/await
- No multi-tab support
- No WebKit/Safari support
- Parallel execution requires paid Cypress Cloud
- Market share declining (14% adoption vs Playwright's 45%)
- **Only advantage:** Interactive test runner DX for human-written tests. Not relevant for AI-driven testing.

### Puppeteer — NOT RECOMMENDED
- Spiritual predecessor to Playwright, built by same team
- Chrome-only (no Firefox, no WebKit)
- No official MCP server from Google
- Manual `waitForSelector` (no auto-wait)
- Community MCP implementations are fragmented
- **Verdict:** "If you're starting new, choose Playwright" (every source)

### Chrome DevTools MCP (`chrome-devtools-mcp`) — SPECIALIST COMPLEMENT
- **What:** Google's official Chrome DevTools MCP. 33,745 GitHub stars.
- **How it works:** Exposes full DevTools Protocol — network inspection, JS execution, performance profiling, Lighthouse audits, console monitoring.
- **Strengths:** Deep diagnostics Playwright MCP can't do: CrUX field data, JS heap snapshots, full network response body inspection, performance traces.
- **Weaknesses:** Chrome only. 18,000 tokens just for tool definitions (6x more than Playwright MCP). Not a general-purpose automation tool.
- **Best use:** Pair with Playwright MCP — Playwright for automation, Chrome DevTools for debugging performance issues.
- **PostCanary relevance:** Low priority. Useful later for performance debugging, not for interactive UX verification.

### Stagehand (Browserbase) — INTERESTING BUT OVERKILL
- **What:** AI-native automation framework. 22k+ GitHub stars. 700k+ weekly downloads. MIT license.
- **How it works:** Three primitives: `act()` (click/type), `extract()` (structured data with Zod schemas), `observe()` (inspect page). Plus `agent()` for autonomous multi-step tasks. v3 dropped Playwright dependency, uses CDP directly. 44% faster than v2.
- **Strengths:** Self-healing (adapts when selectors change). Natural language commands. Mix AI with deterministic code. Model-agnostic.
- **Weaknesses:** Designed for production automation and scraping, not dev-time UX testing. Cloud-oriented (Browserbase). Additional complexity layer. Requires LLM API costs for every action.
- **PostCanary relevance:** Overkill. Claude Code + Playwright MCP already provides the "AI drives browser" capability without an intermediary framework.

### Browser Use — NOT RELEVANT
- **What:** Python library for autonomous browser agents. 81k GitHub stars.
- **Strengths:** Highest WebVoyager benchmark (89.1%). Great for autonomous Python agents.
- **Weaknesses:** Python-only. Designed for autonomous browsing agents, not dev testing. Not integrated with Claude Code's workflow.
- **PostCanary relevance:** Wrong tool for the job. This is for building browser agents, not testing web apps.

### Agent Browser (Vercel) — NICHE
- **What:** Purpose-built for AI coding agents. Fastest for targeted queries.
- **Strengths:** Fastest when diagnosing failures from existing output (CI reports, stack traces). Native cookie/session storage access.
- **Weaknesses:** Blocked by bot detection (`navigator.webdriver=true` in HeadlessChrome). Less capable for exploratory testing.
- **PostCanary relevance:** Low. Playwright MCP covers the use case better.

### OpenBrowser MCP — TOKEN-EFFICIENT ALTERNATIVE
- **What:** Single `execute_code` tool that runs Python with browser context. 3.2x fewer tokens than Playwright MCP.
- **Strengths:** Dramatically lower token usage at scale. 100% success rate in benchmarks.
- **Weaknesses:** Requires Python. Less ecosystem/backing. Newer, less proven.
- **PostCanary relevance:** Not needed for dev-time testing where token cost isn't the bottleneck.

---

## 3. For Claude Code Integration: MCP vs CLI vs Script

| Approach | Interactive | Token Cost | Stability | Best For |
|----------|------------|------------|-----------|----------|
| Playwright MCP | High — persistent browser, real-time | Higher (accessibility tree inline) | MCP server can crash | Exploratory testing, self-QA, debugging |
| CLI scripts | Low — no persistent state | Lower (results to files) | Rock solid | Repeatable tests, CI/CD |
| Hybrid | Both | Mixed | Best of both | **Recommended approach** |

### Recommended Setup for PostCanary

**Primary: Playwright MCP via Node.js (NOT Bun)**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@0.0.23"]
    }
  }
}
```

**Important:** Pin the version. `@latest` pulls unstable/beta releases that cause crashes.

**Fallback: CLI scripts when MCP is flaky**
Claude writes a Playwright script, runs it via `node`, reads the output. No MCP server needed. This is what already works on your setup.

**Key workflow:**
1. Claude builds/edits Vue components
2. Claude uses Playwright MCP to open localhost, verify UI
3. If MCP crashes, Claude falls back to writing a quick Playwright script and running it via Node.js
4. For repeatable checks, Claude generates Playwright test files via `--codegen`

---

## 4. The Bun Problem

The issue is specifically: **Playwright MCP server crashes when launched via Bun, but Playwright itself works fine via Node.js.**

This is a known pattern. The MCP server (`@playwright/mcp`) is a Node.js package that uses Node-specific APIs. Bun's compatibility layer sometimes breaks stdio transport or Node.js internals the MCP server depends on.

**Fix:** Run the MCP server via `npx` (Node.js), not Bun. On Windows with Claude Code, the MCP config should use:
```json
{
  "command": "cmd",
  "args": ["/c", "npx", "@playwright/mcp@0.0.23"]
}
```

Per your CLAUDE.md: MCP servers on Windows MUST be wrapped with `cmd /c`.

---

## 5. What's New in 2026 Worth Watching

1. **Playwright Test Agents (v1.56+):** Three AI agents — planner (explores app, creates test plan), generator (turns plan into test files), healer (auto-repairs failing tests). Microsoft's signal that AI-assisted testing is the future.

2. **Playwright MCP in GitHub Copilot:** Ships built-in. Shows Microsoft commitment to this integration pattern.

3. **Stagehand v3 caching:** Caches discovered elements/actions to avoid repeat LLM calls. Could matter if PostCanary later needs production monitoring.

4. **AI-native testing platforms (Autonoma, qtrl):** Generate and maintain tests from codebase automatically. Worth revisiting when PostCanary needs a full test suite, but overkill now.

---

## 6. Decision

**Use Playwright.** Specifically:

| Priority | Tool | Purpose |
|----------|------|---------|
| Primary | Playwright MCP (`@playwright/mcp` pinned version, via Node.js/npx, wrapped in `cmd /c` on Windows) | Interactive UX testing, self-QA, exploratory testing |
| Fallback | Playwright CLI scripts (Node.js) | When MCP is flaky, or for repeatable tests |
| Optional later | Chrome DevTools MCP | Performance debugging if needed |
| Skip | Cypress, Puppeteer, Stagehand, Browser Use, Agent Browser | Wrong fit for this use case |

---

## Sources

- Builder.io: "How to Use Playwright MCP Server with Claude Code" (March 2026)
- QASkills.sh: "Cypress vs Playwright in 2026" (Feb 2026)
- Replay.build: "Cypress vs Playwright for AI-Generated E2E Suites in 2026" (Feb 2026)
- Markaicode: "Cypress vs Playwright: Which Test Tool Works Better with AI Agents?" (Feb 2026)
- Awesome Agents: "AI Browser Automation in 2026: Top 6 Tools Compared" (March 2026)
- qtrl.ai: "Playwright MCP vs Chrome MCP vs Agent Browser vs Stagehand" (Feb 2026)
- BSWEN: "OpenBrowser MCP vs Playwright MCP vs Chrome DevTools" (Feb 2026)
- DevTools Research: "Playwright vs Cypress vs Selenium 2026" (Feb 2026)
- Autonoma: "E2E Testing Tools in 2026" (March 2026)
- Fazm.ai: "Playwright vs Puppeteer vs Selenium for AI Agents" (Dec 2025)
- NxCode: "Stagehand vs Browser Use vs Playwright" (Feb 2026)
- Browserbase: Stagehand v3 docs and blog posts (2025-2026)
- ChatForest: "Best Browser Automation MCP Servers in 2026" (March 2026)
- AgentRank: "Best MCP Servers for Web Scraping & Browser Automation" (March 2026)
- No Hacks: "The Agentic Browser Landscape in 2026" (Jan 2026)
- Chrome DevTools MCP GitHub (33.7k stars, last updated April 2026)
