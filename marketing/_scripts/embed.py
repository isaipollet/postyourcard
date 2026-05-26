#!/usr/bin/env python3
"""
Bouw een standalone share-versie van een pitch.html:
- Embed alle Google Fonts woff2 als base64
- Embed alle losse images uit images/ als base64

Vereist: niets buiten stdlib.

Gebruik:
    python3 embed.py <pitch-folder>
    bv: python3 marketing/_scripts/embed.py marketing/jetimport-2026

Output: <pitch-folder>/pitch-share.html
"""
import base64
import re
import sys
import urllib.request
from pathlib import Path


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <pitch-folder>")
        sys.exit(1)

    folder = Path(sys.argv[1]).resolve()
    src = folder / "pitch.html"
    dst = folder / "pitch-share.html"

    if not src.exists():
        print(f"Not found: {src}")
        sys.exit(1)

    html = src.read_text()

    # 1. Embed Google Fonts
    gf_match = re.search(
        r'<link\s+href="(https://fonts\.googleapis\.com[^"]+)"[^>]*>', html
    )
    if gf_match:
        gf_url = gf_match.group(1)
        ua = {"User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36"}
        with urllib.request.urlopen(
            urllib.request.Request(gf_url, headers=ua), timeout=20
        ) as r:
            css = r.read().decode()

        for woff in sorted(set(re.findall(r"url\((https://[^)]+\.woff2)\)", css))):
            with urllib.request.urlopen(woff, timeout=20) as r:
                data = r.read()
            css = css.replace(
                woff, f"data:font/woff2;base64,{base64.b64encode(data).decode()}"
            )

        html = html.replace(gf_match.group(0), f"<style>\n{css}\n</style>")
        html = re.sub(r'<link rel="preconnect"[^>]*>\s*', "", html)
        print(f"  Embedded fonts")

    # 2. Embed images from images/
    img_dir = folder / "images"
    if img_dir.exists():
        for img in img_dir.glob("*"):
            if img.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                continue
            mime = "image/jpeg" if img.suffix.lower() in (".jpg", ".jpeg") else "image/png"
            b64 = base64.b64encode(img.read_bytes()).decode()
            data_uri = f"data:{mime};base64,{b64}"
            html = html.replace(f"url('images/{img.name}')", f"url('{data_uri}')")
            html = html.replace(f'src="images/{img.name}"', f'src="{data_uri}"')
            print(f"  Embedded {img.name}")

    dst.write_text(html)
    print(f"Wrote {dst}: {dst.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
