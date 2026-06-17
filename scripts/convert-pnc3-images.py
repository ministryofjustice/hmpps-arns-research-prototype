#!/usr/bin/env python3
"""Export PNC3.pdf pages to PNG images for the prototype viewer.

Requires: pip install pymupdf

Usage:
  python3 scripts/convert-pnc3-images.py
"""

from pathlib import Path

try:
    import fitz
except ImportError as exc:
    raise SystemExit("Install PyMuPDF first: pip install pymupdf") from exc

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "app/assets/doc/PNC3.pdf"
OUTPUT_DIR = ROOT / "app/assets/images/pnc3"
SCALE = 2


def main() -> None:
    if not PDF_PATH.is_file():
        raise SystemExit(f"PDF not found: {PDF_PATH}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(PDF_PATH)
    matrix = fitz.Matrix(SCALE, SCALE)

    for index in range(doc.page_count):
        page_number = index + 1
        output_path = OUTPUT_DIR / f"page-{page_number:02d}.png"
        pixmap = doc.load_page(index).get_pixmap(matrix=matrix)
        pixmap.save(output_path)
        print(f"Wrote {output_path.relative_to(ROOT)} ({pixmap.width}x{pixmap.height})")

    print(f"Exported {doc.page_count} page(s) from {PDF_PATH.name}")


if __name__ == "__main__":
    main()
