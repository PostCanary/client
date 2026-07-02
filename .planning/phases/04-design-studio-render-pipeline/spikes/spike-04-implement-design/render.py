"""Spike 04 — render postcard.html.j2 with Jinja2 + WeasyPrint.

Proves end-to-end: Figma design → HTML/CSS/Jinja → RenderContext → PDF.
"""
import sys
import time
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, __version__ as weasyprint_version

BASE_DIR = Path(__file__).parent
TEMPLATES_DIR = BASE_DIR / "templates"
OUTPUT_DIR = Path("/output")
OUTPUT_PATH = OUTPUT_DIR / "postcard.pdf"

# RenderContext — Desert Diamond HVAC sample fixture.
# In production this is built from CardDesign.resolvedContent + BrandKit subset.
RENDER_CONTEXT = {
    "business_name": "DESERT DIAMOND",
    "phone": "1-800-628-1804",
    "website": "www.desertdiamondhvac.com",
    "cta": "Call today to schedule your service!",
    "headline_line1": "THE SUMMER",
    "headline_line2": "HEAT IS HERE",
    "headline_line3": "NEW A/C",
    "headline_line4": "SYSTEM!",
    "bridge_text": "—stay comfortable with a",
    "offer_prefix": "Get",
    "offer_amount": "$750 OFF",
    "offer_suffix": "a full A/C system replacement",
    "offer_fine_print": "With this card. Offer expires 30 days from mail date.",
}


def main() -> int:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=True,
    )
    template = env.get_template("postcard.html.j2")
    rendered_html = template.render(**RENDER_CONTEXT)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"WeasyPrint version: {weasyprint_version}")
    print(f"Template: postcard.html.j2 ({len(rendered_html)} chars rendered)")
    print(f"Output:   {OUTPUT_PATH}")

    t0 = time.monotonic()
    HTML(string=rendered_html, base_url=str(BASE_DIR)).write_pdf(str(OUTPUT_PATH))
    elapsed_ms = (time.monotonic() - t0) * 1000
    size = OUTPUT_PATH.stat().st_size
    print(f"Rendered in {elapsed_ms:.0f} ms — {size} bytes")

    with OUTPUT_PATH.open("rb") as f:
        header = f.read(8)
    if not header.startswith(b"%PDF-"):
        print(f"ERROR: bad PDF header {header!r}", file=sys.stderr)
        return 2
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
