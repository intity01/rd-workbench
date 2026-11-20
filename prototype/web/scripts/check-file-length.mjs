// Fails when any source file under src/app exceeds the line budget.
// Keeps modules small enough to port 1:1 into Rust modules / egui widgets.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'src/app'
const MAX_LINES = 250
const EXTENSIONS = ['.ts', '.tsx']

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : EXTENSIONS.some((e) => p.endsWith(e)) ? [p] : []
  })
}

const rows = walk(ROOT).map((file) => ({ file: relative('.', file), lines: readFileSync(file, 'utf8').split('\n').length }))
const over = rows.filter((r) => r.lines > MAX_LINES)
const largest = [...rows].sort((a, b) => b.lines - a.lines).slice(0, 5)

console.log(`${rows.length} files checked · limit ${MAX_LINES} lines`)
largest.forEach((r) => console.log(`  ${String(r.lines).padStart(4)}  ${r.file}`))
if (over.length) {
  console.error(`\n${over.length} file(s) over the limit:`)
  over.forEach((r) => console.error(`  ${r.lines}  ${r.file}`))
  process.exit(1)
}
