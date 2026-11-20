"""Extraction backends.

Adaptive tiers (see docs/ARCHITECTURE.md):

* plain text / Markdown / source code -> handled here directly (and later in Rust)
* ``fast``      -> PDF text layer on CPU (e.g. Marker without OCR)
* ``balanced``  -> layout + OCR where needed
* ``accurate``  -> GPU vision model for equations, tables and scans

Heavy libraries are optional imports so the worker starts without them.
"""

from __future__ import annotations

import importlib.util
from collections.abc import Callable
from pathlib import Path

Progress = Callable[[int, str], None]

TEXT_SUFFIXES = {".txt", ".md", ".markdown", ".rst", ".py", ".rs", ".ts", ".tsx", ".json", ".toml"}


def available_backends() -> list[str]:
    caps = ["text"]
    if importlib.util.find_spec("marker") is not None:
        caps.append("marker")
    return caps


def _out_path(src: Path) -> Path:
    return src.with_suffix(src.suffix + ".rdw.md")


def extract(path: str, mode: str, progress: Progress) -> tuple[str, int]:
    src = Path(path)
    if not src.is_file():
        raise FileNotFoundError(path)
    progress(5, f"starting ({mode})")

    if src.suffix.lower() in TEXT_SUFFIXES:
        text = src.read_text(encoding="utf-8", errors="replace")
        out = _out_path(src)
        out.write_text(text, encoding="utf-8", newline="\n")  # LF on every OS
        progress(100, "copied text")
        return str(out), 1

    if src.suffix.lower() == ".pdf":
        raise NotImplementedError("PDF backend lands in Phase 2 (install the 'marker' extra)")

    raise ValueError(f"unsupported file type: {src.suffix}")
