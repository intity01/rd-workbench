"""Extraction dispatch: pick a backend by file type and mode, write Markdown.

Adaptive tiers (see docs/ARCHITECTURE.md):

* plain text / Markdown / source code -> copied as-is (UTF-8, LF)
* DOCX                                -> standard library only (``docx.py``)
* PDF, ``fast``                       -> text layer via the optional ``pypdf``
* PDF, ``balanced`` / ``accurate``    -> OCR / vision backends, not yet available

Heavy libraries are optional imports so the worker starts without them.
"""

from __future__ import annotations

import importlib.util
from collections.abc import Callable
from pathlib import Path

Progress = Callable[[int, str], None]

TEXT_SUFFIXES = {".txt", ".md", ".markdown", ".rst", ".py", ".rs", ".ts", ".tsx", ".json", ".toml"}


def available_backends() -> list[str]:
    caps = ["text", "docx"]
    if importlib.util.find_spec("pypdf") is not None:
        caps.append("pdf")
    if importlib.util.find_spec("marker") is not None:
        caps.append("marker")
    return caps


def _convert(src: Path, mode: str, progress: Progress) -> tuple[str, int]:
    suffix = src.suffix.lower()
    if suffix in TEXT_SUFFIXES:
        return src.read_text(encoding="utf-8", errors="replace"), 1
    if suffix == ".docx":
        from .docx import docx_to_markdown

        return docx_to_markdown(src, progress)
    if suffix == ".pdf":
        if mode != "fast":
            raise NotImplementedError(f"'{mode}' PDF extraction (OCR) is not available yet; use 'fast'")
        from .pdf import pdf_to_markdown

        return pdf_to_markdown(src, progress)
    raise ValueError(f"unsupported file type: {suffix or '(none)'}")


def extract(path: str, out_path: str, mode: str, progress: Progress) -> tuple[str, int]:
    """Converts ``path`` to Markdown at ``out_path``; returns (out_path, pages)."""
    src = Path(path)
    if not src.is_file():
        raise FileNotFoundError(path)
    progress(5, f"reading {src.name} ({mode})")
    text, pages = _convert(src, mode, progress)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8", newline="\n")  # LF on every OS
    progress(100, "done")
    return str(out), pages
