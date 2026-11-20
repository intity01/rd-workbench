import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
import { buildIndex, search, tokenize } from '../lib/search'
import { useStore } from '../state/StoreProvider'
import { Kbd, Mark, Modal, cn } from '../ui'

const COMMANDS = [
  { title: 'Go to Home', to: '/', hint: 'Ctrl 1' },
  { title: 'Go to Projects', to: '/projects', hint: 'Ctrl 2' },
  { title: 'Open Research Workspace', to: '/research', hint: '' },
  { title: 'Import Source', to: '/imports?import=pdf', hint: 'Ctrl O' },
  { title: 'Open Knowledge Library', to: '/library', hint: 'Ctrl 3' },
  { title: 'Open Knowledge Map', to: '/map', hint: 'Ctrl ⇧ G' },
  { title: 'Open Task Monitor', to: '/tasks', hint: '' },
  { title: 'Settings', to: '/settings', hint: 'Ctrl ,' },
]

type Row = { title: string; sub: string; to: string }

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const index = useMemo(() => buildIndex(store), [store])

  const rows: Row[] = useMemo(() => {
    const seen = new Set<string>()
    const hits = q.trim()
      ? search(index, q)
          .filter((r) => {
            const k = r.item.type === 'Document' ? `${r.item.refId}${r.item.page}` : r.item.key
            if (seen.has(k)) return false
            seen.add(k)
            return true
          })
          .slice(0, 8)
      : []
    const cmds = COMMANDS.filter((c) => c.title.toLowerCase().includes(q.toLowerCase())).slice(0, q ? 3 : 8)
    return [
      ...hits.map((r) => ({
        title: r.item.title,
        sub: `${r.item.type}${r.item.page ? ` · p.${r.item.page}` : ''} — ${r.snippet}`,
        to: r.item.to,
      })),
      ...cmds.map((c) => ({ title: c.title, sub: c.hint ? `Command · ${c.hint}` : 'Command', to: c.to })),
    ]
  }, [index, q])

  const go = (to: string) => {
    onClose()
    nav(to)
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setI((x) => Math.min(rows.length - 1, x + 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setI((x) => Math.max(0, x - 1))
    }
    if (e.key === 'Enter' && rows[i]) go(rows[i].to)
  }
  const toks = tokenize(q)

  return (
    <Modal
      open
      onClose={onClose}
      title="Search R&D Workbench"
      subtitle="Projects, documents, notes, claims, citations and commands"
      width={640}
    >
      <div className="flex items-center gap-2 rounded-xl bg-raised px-3">
        <Search size={16} className="text-muted" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setI(0)
          }}
          onKeyDown={onKey}
          placeholder="Try “zero-copy IPC” or “process isolation”"
          className="h-11 flex-1 bg-transparent text-[15px] outline-none"
          aria-label="Search query"
        />
      </div>
      <div className="mt-2 max-h-[400px] overflow-auto" role="listbox">
        {q && rows.length === 0 && (
          <p className="px-3 py-3 text-xs text-muted">
            No content matches “{q}”. Only processed sources are searchable.
          </p>
        )}
        {rows.map((r, j) => (
          <button
            key={j}
            role="option"
            aria-selected={i === j}
            onMouseEnter={() => setI(j)}
            onClick={() => go(r.to)}
            className={cn('block w-full rounded-xl px-3 py-2 text-left', i === j && 'bg-raised')}
          >
            <div className="truncate text-[13px] font-medium">
              <Mark text={r.title} terms={toks} />
            </div>
            <div className="line-clamp-1 text-xs text-muted">
              <Mark text={r.sub} terms={toks} />
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigate
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Enter</Kbd> open
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Esc</Kbd> close
        </span>
      </div>
    </Modal>
  )
}
