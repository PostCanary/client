# Spike 05 — Business name text overflow cascade

**Status:** ✅ PASS (with measurement-first refinement vs PLAN.md char-count gates)
**Date:** 2026-04-14
**Session:** 48

## Goal

Prove that Pillow `ImageFont.getbbox()` can measure rendered pixel width of business_name strings, and that a 3-tier cascade correctly handles strings from 2 chars ("AB") to 78+ chars (pathological long names).

## Fixtures tested

| Name | Chars | Tier picked | Size | Lines | Width(s) px |
|------|-------|------------|------|-------|-------------|
| `AB` | 2 | short (42pt fit) | 42pt | 1 | 45 |
| `Desert Diamond HVAC` | 19 | medium (24pt fit) | 24pt | 1 | 223 |
| `Phoenix Arizona Cooling Co` | 26 | medium (24pt fit) | 24pt | 1 | 289 |
| `Associated Phoenix Heating and AC` | 33 | long (20pt wrap) | 20pt | 1 | 310 |
| `Associates of Greater Phoenix Heating and Air Conditioning` | 58 | long (20pt wrap) | 20pt | 2 | 274 \| 258 |
| `Supercalifragilistic Heating Cooling Plumbing Electrical Services Incorporated` | 78 | long (20pt wrap), TRUNCATED | 20pt | 2 | 330 \| 340 |

Budget: 340px (white logo panel inner width after logo circle padding).

## Refinement from PLAN.md v6

**PLAN.md said:** char-count gates — 1-20 = 42pt, 21-35 = 24pt, 36+ = 20pt wrap.

**Reality:** "Desert Diamond HVAC" is 19 chars but **388px wide at 42pt** — it overflows the 340px budget. Char-count-only gates would incorrectly render at 42pt and overflow the panel visibly.

**Fix:** measurement-first cascade. Try 42pt → if `measure_width ≤ 340px` use it; else try 24pt → if fits use it; else wrap at 20pt with 2-line cap + ellipsis truncation. Char-count is advisory (still checked as the entry gate to Tier 1 to skip measurement for obviously-long strings), not authoritative.

This is strictly better than the PLAN.md cascade:
- Matches the **intent** of the tier system (fit first, then resize, then wrap)
- Handles short-but-wide names correctly ("ABC HVAC Services" at 18 chars overflows 42pt)
- Handles long-but-narrow names correctly (hypothetical all-i's)
- No visual overflow possible at any tier

## Cascade algorithm (production-ready)

```python
def decide_layout(business_name: str, font_path: Path, max_width_px: int) -> dict:
    n = len(business_name)
    # Tier 1: try 42pt
    if n <= 20 and measure_width(business_name, 42) <= max_width_px:
        return {"size_pt": 42, "lines": [business_name], "truncated": False}
    # Tier 2: try 24pt
    if measure_width(business_name, 24) <= max_width_px:
        return {"size_pt": 24, "lines": [business_name], "truncated": False}
    # Tier 3: wrap at 20pt, 2-line cap, ellipsis truncate if overflow
    lines = wrap_greedy(business_name, 20, max_width_px)
    truncated = len(lines) > 2
    if truncated:
        head, rest = lines[0], " ".join(lines[1:])
        tail = truncate_to_width(rest, 20, max_width_px)
        lines = [head, tail]
    return {"size_pt": 20, "lines": lines, "truncated": truncated}
```

Production integration: called from the render-worker BEFORE Jinja template rendering. Adds `business_name_lines`, `business_name_size_pt`, `business_name_truncated` to the RenderContext. Template uses these instead of raw `business_name`.

## Gotchas captured

1. **pt→px conversion:** Pillow's `ImageFont.truetype(size=...)` takes pixels, not points. Must convert: `px = round(pt * 96 / 72)`. Web/print convention is 1in = 72pt = 96px.
2. **Char-count is a weak proxy for width.** Wide letters (W, M) and dense condensed fonts (Bebas Neue is relatively narrow, but M is still ~25% wider than I) break char-count heuristics. Always measure.
3. **Ellipsis truncation needs per-character measurement** (binary-ish search) since variable-width glyphs make fixed-char-count truncation unreliable.
4. **Windows console encoding bug** — Python default cp1252 can't print `≤`/`…`. Use `PYTHONIOENCODING=utf-8` or stick to ASCII.

## Files

- `cascade.py` — cascade logic + 6 fixture tests + sanity check raw widths
- `BebasNeue-Regular.ttf` — font for measurement

## Reproducibility

```bash
cd ~/postcanary/client/.planning/phases/04-design-studio-render-pipeline/spikes/spike-05-text-cascade
PYTHONIOENCODING=utf-8 python cascade.py
```

(Runs on host — no Docker needed, Pillow is the only dependency.)

## Ready for Spike 6

**Yes.** The cascade is production-ready. Integration into Spike 6 (full E2E smoke test) involves calling `decide_layout` before Jinja render and passing the chosen size + line breaks into the template.
