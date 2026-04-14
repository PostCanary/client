"""Text overflow cascade — imported by render.py for business_name sizing.

Same algorithm as spike-05, packaged as a reusable module.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

from PIL import ImageFont


def pt_to_px(pt: float) -> int:
    return round(pt * 96 / 72)


@dataclass
class Layout:
    size_pt: int
    lines: List[str]
    truncated: bool


def _measure(text: str, font_path: Path, size_pt: int) -> int:
    font = ImageFont.truetype(str(font_path), size=pt_to_px(size_pt))
    left, _, right, _ = font.getbbox(text)
    return right - left


def _wrap_greedy(text: str, font_path: Path, size_pt: int, max_w: int) -> List[str]:
    words = text.split()
    if not words:
        return []
    lines, current = [], []
    for word in words:
        candidate = " ".join(current + [word])
        if _measure(candidate, font_path, size_pt) <= max_w:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def _truncate(text: str, font_path: Path, size_pt: int, max_w: int) -> str:
    if _measure(text, font_path, size_pt) <= max_w:
        return text
    ellipsis = "…"
    for end in range(len(text), 0, -1):
        candidate = text[:end].rstrip() + ellipsis
        if _measure(candidate, font_path, size_pt) <= max_w:
            return candidate
    return ellipsis


def decide_business_name(name: str, font_path: Path, max_width_px: int = 340) -> Layout:
    n = len(name)
    if n <= 20 and _measure(name, font_path, 42) <= max_width_px:
        return Layout(size_pt=42, lines=[name], truncated=False)
    if _measure(name, font_path, 24) <= max_width_px:
        return Layout(size_pt=24, lines=[name], truncated=False)
    lines = _wrap_greedy(name, font_path, 20, max_width_px)
    truncated = len(lines) > 2
    if truncated:
        head, rest = lines[0], " ".join(lines[1:])
        tail = _truncate(rest, font_path, 20, max_width_px)
        lines = [head, tail]
    return Layout(size_pt=20, lines=lines, truncated=truncated)
