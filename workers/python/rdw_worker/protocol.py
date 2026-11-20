"""Mirror of `crates/rdw-ipc/src/messages.rs`.

Newline-delimited JSON, one object per line, tagged by a ``type`` field.
Keep this file and the Rust enums in lockstep; bump PROTOCOL_VERSION together.
"""

from __future__ import annotations

import json
import sys
from collections.abc import Iterator
from typing import Any, TextIO

PROTOCOL_VERSION = 2

EXTRACT_MODES = ("fast", "balanced", "accurate")


def send(msg: dict[str, Any], out: TextIO = sys.stdout) -> None:
    out.write(json.dumps(msg, ensure_ascii=False, separators=(",", ":")) + "\n")
    out.flush()


def receive(inp: TextIO = sys.stdin) -> Iterator[dict[str, Any]]:
    for line in inp:
        line = line.strip()
        if line:
            yield json.loads(line)


def ready(worker: str, capabilities: list[str]) -> dict[str, Any]:
    return {"type": "ready", "protocol": PROTOCOL_VERSION, "worker": worker, "capabilities": capabilities}


def progress(task_id: str, percent: int, message: str) -> dict[str, Any]:
    return {"type": "progress", "task_id": task_id, "percent": max(0, min(100, percent)), "message": message}


def done(task_id: str, markdown_path: str, pages: int) -> dict[str, Any]:
    return {"type": "done", "task_id": task_id, "markdown_path": markdown_path, "pages": pages}


def failed(task_id: str, error: str) -> dict[str, Any]:
    return {"type": "failed", "task_id": task_id, "error": error}


def log(level: str, message: str) -> dict[str, Any]:
    return {"type": "log", "level": level, "message": message}
