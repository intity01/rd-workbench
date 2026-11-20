"""DOCX -> Markdown with the standard library only (a DOCX file is a zip of XML).

Keeps headings, paragraphs, line breaks and list items; drops styling. Tables
become one paragraph per cell, in reading order.
"""

from __future__ import annotations

import re
import zipfile
from collections.abc import Callable
from pathlib import Path
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
# Refuse documents whose XML would expand past this (zip-bomb guard).
MAX_XML_BYTES = 200 * 1024 * 1024
_HEADING = re.compile(r"^(?:heading|title)\s*(\d)?$", re.IGNORECASE)


def _read(z: zipfile.ZipFile, name: str) -> bytes | None:
    try:
        info = z.getinfo(name)
    except KeyError:
        return None
    if info.file_size > MAX_XML_BYTES:
        raise ValueError(f"{name} is too large ({info.file_size} bytes)")
    return z.read(info)


def _paragraph(p: ET.Element) -> str:
    parts: list[str] = []
    for node in p.iter():
        if node.tag == W + "t" and node.text:
            parts.append(node.text)
        elif node.tag == W + "tab":
            parts.append("\t")
        elif node.tag in (W + "br", W + "cr"):
            parts.append("\n")
    text = "".join(parts).strip()
    if not text:
        return ""
    style = p.find(f"{W}pPr/{W}pStyle")
    name = (style.get(W + "val") or "") if style is not None else ""
    m = _HEADING.match(name)
    if m:
        level = int(m.group(1) or 1)
        return f"{'#' * min(max(level, 1), 6)} {text}"
    if p.find(f"{W}pPr/{W}numPr") is not None:
        return f"- {text}"
    return text


def _page_count(z: zipfile.ZipFile) -> int:
    raw = _read(z, "docProps/app.xml")
    if raw:
        m = re.search(rb"<Pages>(\d+)</Pages>", raw)
        if m:
            return int(m.group(1))
    return 1


def docx_to_markdown(src: Path, progress: Callable[[int, str], None]) -> tuple[str, int]:
    with zipfile.ZipFile(src) as z:
        raw = _read(z, "word/document.xml")
        if raw is None:
            raise ValueError("not a Word document (word/document.xml missing)")
        progress(40, "parsing document")
        body = ET.fromstring(raw).find(W + "body")
        paragraphs = [] if body is None else [_paragraph(p) for p in body.iter(W + "p")]
        pages = _page_count(z)
    return "\n\n".join(p for p in paragraphs if p) + "\n", pages
