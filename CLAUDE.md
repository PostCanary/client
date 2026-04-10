# PostCanary Client — Session Rules

## Visual Verification & UX Testing

**Primary tool: Playwright MCP** — handles everything: screenshots, clicking, forms, navigation, full user journey testing. Config was fixed in Session 35 (pinned to `@0.0.23`, wrapped with `cmd /c` on Windows).

**After code changes:** Test the FULL user experience. Playwright drives the real user journey — navigate, click, fill forms, verify functionality works AND take screenshots to verify appearance at each step.

**Emergency fallback (if Playwright MCP crashes):** Puppeteer one-shot script for screenshots only:
```bash
node scripts/screenshot.mjs <url> <output.png> --wait 4000
npm run screenshot:postcard
```

**To show Drake a screenshot:** Open the folder in Explorer:
```bash
cmd /c start explorer.exe "<folder-containing-screenshot>"
```

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
