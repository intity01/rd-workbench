import { Search } from 'lucide-react'
import { NODE_META } from '../../data/meta'
import type { GNode, NodeType } from '../../data/types'
import { Dot, Segmented, cn, field } from '../../ui'
import { ALL, ARG } from './geometry'

export type MapView = 'argument' | 'knowledge'

type Props = {
  view: MapView
  setView: (v: MapView) => void
  q: string
  setQ: (q: string) => void
  matchCount: number | null
  onGoFirst: () => void
  types: NodeType[]
  setTypes: (fn: (t: NodeType[]) => NodeType[]) => void
  nodes: GNode[]
}

export function MapSidebar({ view, setView, q, setQ, matchCount, onGoFirst, types, setTypes, nodes }: Props) {
  const toggle = (t: NodeType) => setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))
  return (
    <aside className="w-[216px] shrink-0 overflow-auto p-3">
      <Segmented
        full
        label="Graph view"
        value={view}
        onChange={setView}
        options={[
          { value: 'argument', label: 'Argument' },
          { value: 'knowledge', label: 'Knowledge' },
        ]}
      />
      <div className="relative mt-3">
        <Search size={13} className="absolute top-2.5 left-3 text-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search nodes"
          className={field('h-8 rounded-full pl-8 text-[13px]')}
          aria-label="Search nodes"
        />
      </div>
      {matchCount !== null && (
        <p className="mt-1.5 px-1 text-[11px] text-muted">
          {matchCount} match{matchCount === 1 ? '' : 'es'}
          {matchCount > 0 && (
            <button
              className="ml-2 font-medium text-fg underline decoration-signal-ink decoration-2 underline-offset-2"
              onClick={onGoFirst}
            >
              Go to first
            </button>
          )}
        </p>
      )}
      <div className="mt-5 mb-1.5 flex items-center justify-between px-1 text-[11px] font-medium text-muted">
        Node types
        <button className="text-fg hover:underline" onClick={() => setTypes(() => ALL)}>
          Show all
        </button>
      </div>
      <div className="space-y-0.5">
        {(view === 'argument' ? ARG : ALL).map((t) => {
          const on = types.includes(t)
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              aria-pressed={on}
              title={NODE_META[t].hint}
              className={cn(
                'flex h-8 w-full items-center gap-2.5 rounded-xl px-2.5 text-[13px]',
                on ? 'text-fg hover:bg-raised' : 'text-muted line-through decoration-1 hover:bg-raised/60',
              )}
            >
              <Dot color={on ? NODE_META[t].color : 'var(--hover)'} />
              <span className="flex-1 text-left">{NODE_META[t].label}</span>
              <span className="font-mono text-[10.5px] text-muted">
                {nodes.filter((n) => n.type === t).length}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-5 px-1 text-[11px] leading-relaxed text-muted">
        {view === 'argument'
          ? 'Argument view shows claims, evidence and logical structure.'
          : 'Knowledge view adds topics, concepts and documents.'}
      </p>
    </aside>
  )
}
