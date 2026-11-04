#!/usr/bin/env python3
"""Build the single-file Workshop Manager app (index.html) from src/ and fonts/.

    python3 build.py              # writes index.html next to this script
    python3 build.py --out X.html # write somewhere else (e.g. for a test build)

The output must stay ONE self-contained file: it runs from file:// and from
GitHub Pages, and print popups copy the <style id="embeddedFonts"> block, so the
fonts have to be embedded as base64 in the built file. Edit src/, never index.html.
"""
import argparse
import base64
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8", newline="") as f:
        return f.read()


def embed_fonts(css):
    """Replace {{font:NAME.woff2}} placeholders with the base64 of fonts/NAME.woff2."""
    def sub(m):
        path = os.path.join(ROOT, "fonts", m.group(1))
        if not os.path.exists(path):
            sys.exit("missing font file: fonts/" + m.group(1))
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("ascii")
    return re.sub(r"\{\{font:([^}]+)\}\}", sub, css)


def build():
    js_files = sorted(glob.glob(os.path.join(ROOT, "src", "js", "*.js")))
    if not js_files:
        sys.exit("no modules found in src/js/")
    parts = [
        read("src/shell/head.html"),
        '<style id="embeddedFonts">', embed_fonts(read("src/fonts.css")), "</style>\n",
        read("src/shell/vendor.html"),
        "<style>", read("src/styles.css"), "</style>",
        "\n</head>\n",
        read("src/shell/body.html"),
        "<script>",
    ]
    parts += [read(os.path.relpath(p, ROOT)) for p in js_files]
    parts.append(read("src/shell/tail.html"))
    return "".join(parts)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default=os.path.join(ROOT, "index.html"))
    args = ap.parse_args()
    html = build()
    with open(args.out, "w", encoding="utf-8", newline="") as f:
        f.write(html)
    print("wrote %s (%d bytes)" % (args.out, len(html.encode("utf-8"))))


if __name__ == "__main__":
    main()
