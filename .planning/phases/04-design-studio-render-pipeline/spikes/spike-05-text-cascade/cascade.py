"""Spike 05 — business name text overflow cascade.

Tiers (from PLAN.md v6):
  - 1-20 chars:  render at 42pt (default Bebas Neue)
  - 21-35 chars: auto-resize to 24pt
  - 36+ chars:   wrap to 2 lines at 20pt, truncate with ellipsis if still overflowing

Uses Pillow ImageFont.getbbox() for actual pixel-width measurement as a sanity check
on the char-count heuristic. Width budget matches the white logo panel inner width
(486.6px panel width in the Figma template, ~122px left padding, ~20px right padding
→ ~340px usable for the business_name field).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from PIL import ImageFont

FONT_PATH = Path(__file__).parent / "BebasNeue-Regular.ttf"

# Inner width of the white logo panel available for the business_name text.
# Panel is 486.6px wide, business_name left=122.15px (inset for the logo circle),
# leaving ~340px to the panel's right edge.
MAX_WIDTH_PX = 340

# Convert pt → px for Pillow (72 pt per inch, 96 px per inch → 1pt = 96/72 ≈ 1.333 px)
def pt_to_px(pt: float) -> int:
    return round(pt * 96 / 72)


@dataclass
class LayoutDecision:
    name: str
    char_count: int
    tier: str
    font_size_pt: int
    lines: List[str]
    truncated: bool
    measured_width_px: List[int] = field(default_factory=list)

    def __str__(self) -> str:
        lines_repr = " | ".join(self.lines)
        trunc = " [TRUNCATED]" if self.truncated else ""
        widths = f" widths={self.measured_width_px}"
        return (
            f"{self.char_count:>3}ch  {self.tier:<20}  "
            f"{self.font_size_pt}pt  →  {lines_repr}{trunc}{widths}"
        )


def measure_width(text: str, font_size_pt: int) -> int:
    """Measure rendered pixel width of `text` at the given pt size in Bebas Neue."""
    font = ImageFont.truetype(str(FONT_PATH), size=pt_to_px(font_size_pt))
    left, top, right, bottom = font.getbbox(text)
    return right - left


def wrap_greedy(text: str, font_size_pt: int, max_width_px: int) -> List[str]:
    """Greedy word-wrap: append words until the line would overflow."""
    words = text.split()
    if not words:
        return []
    lines: List[str] = []
    current: List[str] = []
    for word in words:
        candidate = " ".join(current + [word])
        if measure_width(candidate, font_size_pt) <= max_width_px:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            # Word alone might still overflow — accept it (browser would too)
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def truncate_to_width(text: str, font_size_pt: int, max_width_px: int) -> str:
    """Cut text and append '…' until it fits in max_width_px."""
    if measure_width(text, font_size_pt) <= max_width_px:
        return text
    ellipsis = "…"
    # Binary-ish: shrink by characters until width fits
    for end in range(len(text), 0, -1):
        candidate = text[:end].rstrip() + ellipsis
        if measure_width(candidate, font_size_pt) <= max_width_px:
            return candidate
    return ellipsis


def decide_layout(business_name: str) -> LayoutDecision:
    """Apply the cascade (measurement-first). Char-count gates from the plan are
    retained as advisory, but actual pixel width determines which tier applies."""
    n = len(business_name)

    # Tier 1 — try full 42pt single line
    if n <= 20:
        width = measure_width(business_name, 42)
        if width <= MAX_WIDTH_PX:
            return LayoutDecision(
                name=business_name,
                char_count=n,
                tier="short (42pt fit)",
                font_size_pt=42,
                lines=[business_name],
                truncated=False,
                measured_width_px=[width],
            )
        # Overflow at 42pt → fall through

    # Tier 2 — try 24pt single line
    width24 = measure_width(business_name, 24)
    if width24 <= MAX_WIDTH_PX:
        return LayoutDecision(
            name=business_name,
            char_count=n,
            tier="medium (24pt fit)",
            font_size_pt=24,
            lines=[business_name],
            truncated=False,
            measured_width_px=[width24],
        )

    # Tier 3 — wrap at 20pt, 2-line cap, truncate if still overflowing
    lines = wrap_greedy(business_name, 20, MAX_WIDTH_PX)
    truncated = False
    if len(lines) > 2:
        truncated = True
        # Keep first line, truncate second
        head = lines[0]
        rest = " ".join(lines[1:])
        tail = truncate_to_width(rest, 20, MAX_WIDTH_PX)
        lines = [head, tail]
    widths = [measure_width(line, 20) for line in lines]
    return LayoutDecision(
        name=business_name,
        char_count=n,
        tier="long (20pt wrap)",
        font_size_pt=20,
        lines=lines,
        truncated=truncated,
        measured_width_px=widths,
    )


FIXTURES = [
    "AB",
    "Desert Diamond HVAC",
    "Phoenix Arizona Cooling Co",
    "Associated Phoenix Heating and AC",
    "Associates of Greater Phoenix Heating and Air Conditioning",
    "Supercalifragilistic Heating Cooling Plumbing Electrical Services Incorporated",
]


def main() -> None:
    print(f"Font: {FONT_PATH.name}")
    print(f"Panel width budget: {MAX_WIDTH_PX}px")
    print(f"Fixtures (char count | tier | size | rendered lines | measured widths):\n")
    for fixture in FIXTURES:
        decision = decide_layout(fixture)
        print(decision)
    print()
    print("Sanity check — raw pixel widths at base 42pt:")
    for fixture in FIXTURES:
        w = measure_width(fixture, 42)
        over = " [overflow at 42pt]" if w > MAX_WIDTH_PX else ""
        print(f"  {len(fixture):>3}ch  {w:>4}px  {fixture!r}{over}")


if __name__ == "__main__":
    main()
