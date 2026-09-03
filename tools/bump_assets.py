#!/usr/bin/env python3
"""Stamp styles.css / site.js references with a hash of their contents.

The hash changes only when the file's bytes change, so returning visitors
refetch an asset exactly when it moved and keep their cached copy otherwise.
Run before deploying. Safe to run repeatedly -- it rewrites nothing if the
files haven't changed.
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ["styles.css", "site.js", "assets/tech/tech.css", "favicon.svg"]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()[:8]


def main():
    hashes = {}
    for rel in ASSETS:
        path = ROOT / rel
        if not path.exists():
            print(f"  skip   {rel} (missing)")
            continue
        hashes[rel] = digest(path)

    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        sys.exit("no .html files found")

    changed = 0
    for page in pages:
        original = page.read_text(encoding="utf-8")
        updated = original
        for rel, h in hashes.items():
            # match the reference with or without an existing ?v=...
            pattern = re.compile(r'(["\'])' + re.escape(rel) + r'(?:\?v=[^"\']*)?\1')
            updated = pattern.sub(lambda m: f'{m.group(1)}{rel}?v={h}{m.group(1)}', updated)
        if updated != original:
            page.write_text(updated, encoding="utf-8")
            changed += 1
            print(f"  update {page.name}")
        else:
            print(f"  ok     {page.name}")

    print()
    for rel, h in hashes.items():
        print(f"  {rel}?v={h}")
    print(f"\n{changed} file(s) rewritten, {len(pages)} page(s) checked")


if __name__ == "__main__":
    main()
