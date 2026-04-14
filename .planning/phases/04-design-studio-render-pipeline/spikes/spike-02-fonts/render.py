"""Spike 02 — render fonts.html to PDF with @font-face.

Verifies custom font loading from ./fonts/ directory via @font-face.
"""
import sys
import time
from pathlib import Path

from weasyprint import HTML, __version__ as weasyprint_version

HTML_PATH = Path(__file__).parent / "fonts.html"
OUTPUT_DIR = Path("/output")
OUTPUT_PATH = OUTPUT_DIR / "fonts.pdf"


def main() -> int:
    if not HTML_PATH.exists():
        print(f"ERROR: {HTML_PATH} not found", file=sys.stderr)
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"WeasyPrint version: {weasyprint_version}")
    print(f"Input:  {HTML_PATH}")
    print(f"Output: {OUTPUT_PATH}")

    t0 = time.monotonic()
    HTML(filename=str(HTML_PATH), base_url=str(HTML_PATH.parent)).write_pdf(str(OUTPUT_PATH))
    elapsed_ms = (time.monotonic() - t0) * 1000

    size_bytes = OUTPUT_PATH.stat().st_size
    print(f"Rendered in {elapsed_ms:.0f} ms — {size_bytes} bytes")

    with OUTPUT_PATH.open("rb") as f:
        header = f.read(8)
    if not header.startswith(b"%PDF-"):
        print(f"ERROR: output does not start with %PDF- header: {header!r}", file=sys.stderr)
        return 2

    print("OK: PDF header present, render succeeded.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
