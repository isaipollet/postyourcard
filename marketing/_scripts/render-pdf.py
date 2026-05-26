#!/usr/bin/env python3
"""
Render pitch-share.html naar pitch.pdf via Playwright screenshots.

Waarom screenshots? Chrome's --print-to-pdf API heeft een bug waardoor
rotated absolute-positioned elementen + box-shadows verkeerd renderen
(shadows als solid rechthoeken, transforms genegeerd). Screenshots
gebruiken de gewone compositor pipeline en omzeilen die bug.

Vereist:
    pip install playwright pillow
    python -m playwright install chromium

Gebruik:
    python3 render-pdf.py <pitch-folder>
    bv: python3 marketing/_scripts/render-pdf.py marketing/jetimport-2026

Output: <pitch-folder>/pitch.pdf
"""
import io
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <pitch-folder>")
        sys.exit(1)

    folder = Path(sys.argv[1]).resolve()
    src = folder / "pitch-share.html"
    dst = folder / "pitch.pdf"

    if not src.exists():
        print(f"Not found: {src}")
        print("Run embed.py first.")
        sys.exit(1)

    # A4 landscape at 2x DPI = 2246 × 1588 px
    W, H = 2246, 1588

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": W, "height": H},
            device_scale_factor=2,
        )
        page = ctx.new_page()
        page.goto(f"file://{src}")
        page.wait_for_load_state("networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(1500)

        slides = page.query_selector_all(".slide")
        print(f"Found {len(slides)} slides")

        images = []
        for i, slide in enumerate(slides, 1):
            img = Image.open(io.BytesIO(slide.screenshot())).convert("RGB")
            print(f"  slide {i}: {img.size[0]}×{img.size[1]}")
            images.append(img)

        browser.close()

    images[0].save(
        dst,
        save_all=True,
        append_images=images[1:],
        format="PDF",
        resolution=200.0,
    )
    print(f"Wrote {dst}: {dst.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
