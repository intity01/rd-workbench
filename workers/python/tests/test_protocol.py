import io
import json
import subprocess
import sys
from pathlib import Path

from rdw_worker import protocol as p

ROOT = Path(__file__).resolve().parents[1]


def test_send_receive_round_trip():
    buf = io.StringIO()
    p.send(p.progress("T1", 150, "x"), buf)
    buf.seek(0)
    (msg,) = list(p.receive(buf))
    assert msg == {"type": "progress", "task_id": "T1", "percent": 100, "message": "x"}


def test_worker_handshake_and_text_extract(tmp_path):
    src = tmp_path / "note.md"
    src.write_text("# สวัสดี\n", encoding="utf-8")
    lines = [
        {"type": "hello", "protocol": p.PROTOCOL_VERSION},
        {
            "type": "extract",
            "task_id": "T1",
            "path": str(src),
            "out_path": str(tmp_path / "out" / "T1.md"),
            "mode": "fast",
        },
        {"type": "shutdown"},
    ]
    stdin = "".join(json.dumps(m) + "\n" for m in lines)
    out = subprocess.run(
        [sys.executable, "-m", "rdw_worker"],
        input=stdin,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=ROOT,
        check=True,
    )
    msgs = [json.loads(line) for line in out.stdout.splitlines() if line.strip()]
    assert msgs[0]["type"] == "ready"
    assert msgs[-1]["type"] == "done" and msgs[-1]["task_id"] == "T1"
    assert (tmp_path / "out" / "T1.md").read_text(encoding="utf-8") == "# สวัสดี\n"
