"""PDF text layer -> Markdown via the optional ``pypdf`` (``pip install rdw-worker[pdf]``).

Each page is preceded by an ``<!-- page N -->`` marker so notes and
citations can point at a page. Scanned PDFs have no text layer; they need the
OCR tier, which is not available yet.
"""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path


def pdf_to_markdown(src: Path, progress: Callable[[int, str], None]) -> tuple[str, int]:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("PDF support needs pypdf: pip install pypdf") from exc

    reader = PdfReader(str(src))
    if reader.is_encrypted and not reader.decrypt(""):
        raise ValueError("the PDF is password-protected")
    total = len(reader.pages)
    chunks: list[str] = []
    found_text = False
    for i, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        found_text = found_text or bool(text)
        chunks.append(f"<!-- page {i} -->\n\n{text}")
        progress(5 + int(90 * i / max(total, 1)), f"page {i} of {total}")
    if total and not found_text:
        raise ValueError("no text layer (scanned PDF?); OCR extraction is not available yet")
    return "\n\n".join(chunks) + "\n", total
