//! `cargo xtask <command>` — repository chores with no external dependencies.
//!
//! * `check-size [--max N]` fails when any source file exceeds the line budget
//!   (default 250). Small files keep modules single-purpose and easy to refactor.

use std::path::{Path, PathBuf};
use std::process::ExitCode;

const DEFAULT_MAX: usize = 250;
const ROOTS: &[&str] = &["crates", "apps", "tools", "workers", "prototype/web/src"];
const EXTENSIONS: &[&str] = &["rs", "py", "ts", "tsx"];
const SKIP_DIRS: &[&str] = &["target", "node_modules", "__pycache__", ".venv", "dist"];

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.first().map(String::as_str) {
        Some("check-size") => check_size(parse_max(&args[1..])),
        _ => {
            eprintln!("usage: cargo xtask check-size [--max N]");
            ExitCode::from(2)
        }
    }
}

fn parse_max(args: &[String]) -> usize {
    args.iter()
        .position(|a| a == "--max")
        .and_then(|i| args.get(i + 1))
        .and_then(|v| v.parse().ok())
        .unwrap_or(DEFAULT_MAX)
}

fn workspace_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../..")
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name();
        if path.is_dir() {
            if !SKIP_DIRS.iter().any(|s| name == *s) {
                walk(&path, out);
            }
        } else if path.extension().and_then(|e| e.to_str()).is_some_and(|e| EXTENSIONS.contains(&e)) {
            out.push(path);
        }
    }
}

fn check_size(max: usize) -> ExitCode {
    let root = workspace_root();
    let mut files = Vec::new();
    for r in ROOTS {
        walk(&root.join(r), &mut files);
    }
    let mut rows: Vec<(usize, String)> = files
        .iter()
        .filter_map(|f| {
            let text = std::fs::read_to_string(f).ok()?;
            let rel = f.strip_prefix(&root).unwrap_or(f).to_string_lossy().replace('\\', "/");
            Some((text.lines().count(), rel))
        })
        .collect();
    rows.sort_by_key(|r| std::cmp::Reverse(r.0));

    let over: Vec<_> = rows.iter().filter(|(n, _)| *n > max).collect();
    println!("checked {} files (limit {max} lines)", rows.len());
    for (n, f) in rows.iter().take(5) {
        println!("  {n:>4}  {f}");
    }
    if over.is_empty() {
        println!("ok");
        ExitCode::SUCCESS
    } else {
        eprintln!("\n{} file(s) over the limit — split by responsibility:", over.len());
        for (n, f) in over {
            eprintln!("  {n:>4}  {f}");
        }
        ExitCode::FAILURE
    }
}
