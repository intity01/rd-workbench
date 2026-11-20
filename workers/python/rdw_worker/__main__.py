"""Document worker entry point: ``python -m rdw_worker``.

Speaks the rdw-ipc protocol on stdin/stdout. Logs must go through
``protocol.log`` (never bare ``print``) or they corrupt the stream.

Extraction backends are pluggable; see ``extract.py``.
"""

from __future__ import annotations

import sys

from . import protocol as p
from .extract import available_backends, extract


def main() -> int:
    # The wire format is UTF-8 regardless of the OS locale (Windows defaults to a code page).
    for stream in (sys.stdin, sys.stdout):
        stream.reconfigure(encoding="utf-8")
    for msg in p.receive():
        kind = msg.get("type")
        if kind == "hello":
            if msg.get("protocol") != p.PROTOCOL_VERSION:
                p.send(p.log("error", f"protocol mismatch: core={msg.get('protocol')} worker={p.PROTOCOL_VERSION}"))
                return 1
            p.send(p.ready("python-docs", available_backends()))
        elif kind == "extract":
            task_id = msg["task_id"]
            try:
                out_path, pages = extract(
                    msg["path"], msg.get("mode", "fast"), lambda pct, m: p.send(p.progress(task_id, pct, m))
                )
                p.send(p.done(task_id, out_path, pages))
            except Exception as exc:  # report, never crash the worker
                p.send(p.failed(task_id, f"{type(exc).__name__}: {exc}"))
        elif kind == "cancel":
            p.send(p.log("warn", "cancel is not implemented yet"))
        elif kind == "shutdown":
            return 0
        else:
            p.send(p.log("warn", f"unknown message type: {kind!r}"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
