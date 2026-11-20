import { FileText, Link2, NotebookPen } from 'lucide-react'
import { NODE_META } from '../../data/meta'
import type { GNode } from '../../data/types'
import { Dot, IconTile, Tag, cn } from '../../ui'
import { H, W } from './geometry'
import { NODE_ICON } from './nodeIcons'

const LABEL_H = 22

type Props = {
  n: GNode
  selected: boolean
  match: boolean
  dim: boolean
  showLinks: boolean
  links: number
  onPointerDown: (e: React.PointerEvent) => void
  onHandleDown: (e: React.PointerEvent) => void
  onSelect: () => void
}

/** Node card: type label above, solid card with icon tile, title, and technical tags. */
export function MapNode({
  n,
  selected,
  match,
  dim,
  showLinks,
  links,
  onPointerDown,
  onHandleDown,
  onSelect,
}: Props) {
  const meta = NODE_META[n.type]
  return (
    <g transform={`translate(${n.x - W / 2} ${n.y - H / 2})`} opacity={dim ? 0.3 : 1}>
      <foreignObject
        x={0}
        y={-LABEL_H}
        width={W}
        height={H + LABEL_H}
        onPointerDown={onPointerDown}
        className="cursor-grab overflow-visible active:cursor-grabbing"
      >
        <div className="flex h-[22px] items-center gap-1.5 px-1 text-[11px] font-medium text-muted">
          <Dot color={meta.color} />
          {meta.label}
        </div>
        <div
          tabIndex={0}
          role="button"
          aria-label={`${meta.label}: ${n.label}`}
          aria-pressed={selected}
          onKeyDown={(e) => e.key === 'Enter' && onSelect()}
          className={cn(
            'flex h-[92px] flex-col rounded-2xl bg-card p-2.5 shadow-sm',
            selected && 'ring-2 ring-signal-ink',
            match && !selected && 'ring-2 ring-warning',
          )}
        >
          <div className="flex items-start gap-2.5">
            <IconTile icon={NODE_ICON[n.type]} color={meta.color} size={28} />
            <div className="line-clamp-2 min-w-0 flex-1 text-[12.5px] leading-snug font-semibold break-words whitespace-normal text-fg">
              {n.label}
            </div>
          </div>
          <div className="mt-auto flex items-center gap-1.5">
            {showLinks && n.sourceId && (
              <Tag mono>
                <FileText size={10} />
                {n.page ? `p.${n.page}` : 'src'}
              </Tag>
            )}
            {showLinks && n.noteId && (
              <Tag mono>
                <NotebookPen size={10} />
                note
              </Tag>
            )}
            <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted">
              <Link2 size={10} />
              {links}
            </span>
          </div>
        </div>
      </foreignObject>
      <circle cx={0} cy={H / 2} r={4} fill="var(--card)" stroke="var(--edge)" strokeWidth={1.5} />
      <circle
        cx={W}
        cy={H / 2}
        r={6}
        fill="var(--card)"
        stroke="var(--text)"
        strokeWidth={1.5}
        className="cursor-crosshair"
        onPointerDown={onHandleDown}
      >
        <title>Drag to connect</title>
      </circle>
    </g>
  )
}
