"""Spike 06 — E2E smoke test.

BrandKit + offer fixture → text overflow cascade → Jinja2 → WeasyPrint → PDF.
Renders 3 fixtures (short / medium / long business names) to validate the cascade
at render-time end-to-end.
"""
from __future__ import annotations

import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, __version__ as weasyprint_version

from cascade import decide_business_name

BASE_DIR = Path(__file__).parent
TEMPLATES_DIR = BASE_DIR / "templates"
FONT_PATH = BASE_DIR / "fonts" / "BebasNeue-Regular.ttf"
OUTPUT_DIR = Path("/output")


@dataclass
class Fixture:
    slug: str
    business_name: str
    phone: str = "1-800-628-1804"
    website: str = "www.desertdiamondhvac.com"
    cta: str = "Call today to schedule your service!"
    headline_line1: str = "THE SUMMER"
    headline_line2: str = "HEAT IS HERE"
    headline_line3: str = "NEW A/C"
    headline_line4: str = "SYSTEM!"
    bridge_text: str = "—stay comfortable with a"
    offer_prefix: str = "Get"
    offer_amount: str = "$750 OFF"
    offer_suffix: str = "a full A/C system replacement"
    offer_fine_print: str = "With this card. Offer expires 30 days from mail date."


FIXTURES: List[Fixture] = [
    Fixture(slug="short", business_name="DESERT DIAMOND"),
    Fixture(slug="medium", business_name="Phoenix Arizona Cooling Co"),
    Fixture(slug="long", business_name="Associates of Greater Phoenix Heating and Air Conditioning"),
]


def render_one(env: Environment, fixture: Fixture) -> tuple[Path, int, float]:
    layout = decide_business_name(fixture.business_name, FONT_PATH)

    context = {
        "business_name": fixture.business_name,
        "business_name_lines": layout.lines,
        "business_name_size_pt": layout.size_pt,
        "business_name_truncated": layout.truncated,
        "phone": fixture.phone,
        "website": fixture.website,
        "cta": fixture.cta,
        "headline_line1": fixture.headline_line1,
        "headline_line2": fixture.headline_line2,
        "headline_line3": fixture.headline_line3,
        "headline_line4": fixture.headline_line4,
        "bridge_text": fixture.bridge_text,
        "offer_prefix": fixture.offer_prefix,
        "offer_amount": fixture.offer_amount,
        "offer_suffix": fixture.offer_suffix,
        "offer_fine_print": fixture.offer_fine_print,
    }

    template = env.get_template("postcard.html.j2")
    rendered = template.render(**context)

    out_path = OUTPUT_DIR / f"postcard-{fixture.slug}.pdf"
    t0 = time.monotonic()
    HTML(string=rendered, base_url=str(BASE_DIR)).write_pdf(str(out_path))
    elapsed_ms = (time.monotonic() - t0) * 1000

    return out_path, out_path.stat().st_size, elapsed_ms


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=True)

    print(f"WeasyPrint version: {weasyprint_version}")
    print(f"Rendering {len(FIXTURES)} fixtures:")
    print()

    for fixture in FIXTURES:
        layout = decide_business_name(fixture.business_name, FONT_PATH)
        out_path, size_bytes, elapsed_ms = render_one(env, fixture)
        lines_repr = " | ".join(layout.lines)
        trunc = " [TRUNCATED]" if layout.truncated else ""
        print(
            f"  [{fixture.slug}] {fixture.business_name!r}\n"
            f"    cascade: {layout.size_pt}pt, {len(layout.lines)} line(s): {lines_repr}{trunc}\n"
            f"    rendered: {elapsed_ms:.0f} ms, {size_bytes} bytes → {out_path.name}"
        )
        with out_path.open("rb") as f:
            if not f.read(5).startswith(b"%PDF-"):
                print(f"    ERROR: bad PDF header on {out_path}", file=sys.stderr)
                return 2

    print("\nAll fixtures rendered. Compare visually vs Figma native export.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
