# PostCanary Client — Session Rules

## Visual Verification & UX Testing

**Primary tool: Playwright CLI** (flipped 2026-04-17 — memory ID 454). Write a spec once, run it every session. Real assertions, trace viewer, persistent artifacts that survive context compression. This is the default for any verification that could be asked again.

```bash
npm run test:e2e           # headless run
npm run test:e2e:ui        # interactive UI (time-travel debugging — the killer feature)
npm run test:e2e:headed    # visible browser
npm run test:e2e:debug     # pause-and-step on one test
npm run test:e2e:report    # open last HTML report

npx playwright codegen http://localhost:5175   # record clicks into a new spec
```

**Config:** `playwright.config.ts` (baseURL 5175, auto-boots Vite, traces on failure). Specs live in `tests/e2e/`. Mock API is in `tests/e2e/support/mockApi.ts` — tests run against the dev server with mocked backend, no real API needed. Generalized template at `~/.claude/templates/playwright-config.ts`.

**Secondary tool: Playwright MCP** — for exploration only. Use when: (a) selectors aren't known yet and you're poking around, (b) one-shot "what does this look like right now?", (c) watching a weird bug happen live, (d) UI polish iteration where every cycle is different. NOT for repeatable verification — that's what CLI specs are for. Config pinned to `@0.0.23`, wrapped with `cmd /c` on Windows (Session 35).

**Emergency fallback (if both Playwright CLI and MCP crash):** Puppeteer one-shot script for screenshots only:
```bash
node scripts/screenshot.mjs <url> <output.png> --wait 4000
npm run screenshot:postcard
```

**To show Drake a screenshot:** Open the folder in Explorer:
```bash
cmd /c start explorer.exe "<folder-containing-screenshot>"
```

**Verification discipline (CLAUDE.md global):** "Did you click through each step? yes with screenshots" — satisfied by `npm run test:e2e` producing a passing run + trace artifacts. MCP screenshots don't satisfy this; they disappear when context resets.

## Dev Server

Start on port 5175 (5173 often has stale connections):
```bash
npx vite --port 5175
```

## Expert Panel

When doing postcard design or review work, load:
- `.planning/experts-design-panel.md` — Gendusa/Draplin/Whitman/Halbert/Caples/Heath
- `.planning/experts-implementation-bridge.md` — Wathan/Drasner/Comeau

## Print Units

All postcard measurements in `pt` or `in`. Never `px`, `rem`, or `em` for postcard content. CSS custom properties in `src/styles/print-scale.css`.
