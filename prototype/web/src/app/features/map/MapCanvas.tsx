import { useState } from 'react'
import { Maximize, Minus, Plus } from 'lucide-react'
import { NODE_META, REL_META } from '../../data/meta'
import type { Edge, GNode, NodeType } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Dot, IconButton } from '../../ui'
import { ALL, bounds, hitNode } from './geometry'
import { ArrowDefs, MapEdge } from './MapEdge'
import { MapNode } from './MapNode'
import { Minimap } from './Minimap'
import type { Viewport } from './useViewport'

export type Sel = { kind: 'node' | 'edge'; id: string } | null
export type Layers = { labels: boolean; links: boolean; focus: boolean; grouping: 'none' | 'type' }

type Props = {
  vp: Viewport
  nodes: GNode[]
  edges: Edge[]
  sel: Sel
  setSel: (s: Sel) => void
  matches: Set<string> | null
  layers: Layers
  onConnect: (from: string, to: string) => void
  caption: string
}

export function MapCanvas({ vp, nodes, edges, sel, setSel, matches, layers, onConnect, caption }: Props) {
  const { snapshot, moveNodeLive, edges: allEdges } = useStore()
  const [link, setLink] = useState<{ from: GNode; x: number; y: number } | null>(null)
  const byId = (id: string) => nodes.find((n) => n.id === id)
  const selNode = sel?.kind === 'node' ? sel.id : null
  const neighbours = selNode
    ? new Set([
        selNode,
        ...allEdges.filter((e) => e.from === selNode || e.to === selNode).flatMap((e) => [e.from, e.to]),
      ])
    : null
  const linkCount = (id: string) => allEdges.filter((e) => e.from === id || e.to === id).length

  const track = (move: (ev: PointerEvent) => void, up: (ev: PointerEvent) => void = () => {}) => {
    const done = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', done)
      up(ev)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', done)
  }
  const dragNode = (e: React.PointerEvent, n: GNode) => {
    e.stopPropagation()
    setSel({ kind: 'node', id: n.id })
    const p0 = vp.toWorld(e.clientX, e.clientY)
    let moved = false
    track((ev) => {
      const p = vp.toWorld(ev.clientX, ev.clientY)
      if (!moved && Math.hypot(p.x - p0.x, p.y - p0.y) < 3) return
      if (!moved) snapshot()
      moved = true
      moveNodeLive(n.id, Math.round(n.x + p.x - p0.x), Math.round(n.y + p.y - p0.y))
    })
  }
  const dragLink = (e: React.PointerEvent, n: GNode) => {
    e.stopPropagation()
    setLink({ from: n, x: n.x, y: n.y })
    track(
      (ev) => setLink({ from: n, ...vp.toWorld(ev.clientX, ev.clientY) }),
      (ev) => {
        const p = vp.toWorld(ev.clientX, ev.clientY)
        const target = hitNode(nodes, p.x, p.y, n.id)
        setLink(null)
        if (target) onConnect(n.id, target.id)
      },
    )
  }
  const groups =
    layers.grouping === 'type'
      ? ALL.map((t) => ({ t, list: nodes.filter((n) => n.type === t) }))
          .filter((g) => g.list.length)
          .map((g) => ({ t: g.t as NodeType, b: bounds(g.list, 18) }))
      : []

  return (
    <div
      ref={vp.wrap}
      onWheel={vp.onWheel}
      className="relative flex-1 overflow-hidden rounded-2xl bg-canvas"
      style={{
        backgroundImage: 'radial-gradient(var(--dot) 1.2px, transparent 1.2px)',
        backgroundSize: `${22 * vp.zoom}px ${22 * vp.zoom}px`,
        backgroundPosition: `${vp.pan.x}px ${vp.pan.y}px`,
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full touch-none select-none"
        onPointerDown={(e) => {
          if (e.button === 0) {
            setSel(null)
            vp.startPan(e)
          }
        }}
        role="application"
        aria-label="Knowledge graph canvas"
      >
        <ArrowDefs />
        <g transform={`translate(${vp.pan.x} ${vp.pan.y}) scale(${vp.zoom})`}>
          {groups.map(({ t, b }) => (
            <g key={t}>
              <rect
                x={b.x}
                y={b.y - 26}
                width={b.w}
                height={b.h + 26}
                rx={20}
                fill="var(--raised)"
                fillOpacity={0.45}
              />
              <text x={b.x + 14} y={b.y - 8} fontSize={11} fontWeight={600} fill="var(--text2)">
                {NODE_META[t].label}
              </text>
            </g>
          ))}
          {edges.map((e) => {
            const a = byId(e.from)
            const b = byId(e.to)
            if (!a || !b) return null
            const active = !!selNode && (e.from === selNode || e.to === selNode)
            return (
              <MapEdge
                key={e.id}
                e={e}
                a={a}
                b={b}
                active={active}
                selected={sel?.kind === 'edge' && sel.id === e.id}
                dim={layers.focus && !!selNode && !active}
                showLabel={layers.labels}
                onSelect={() => setSel({ kind: 'edge', id: e.id })}
              />
            )
          })}
          {link && (
            <line
              x1={link.from.x}
              y1={link.from.y}
              x2={link.x}
              y2={link.y}
              stroke="var(--text)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
          )}
          {nodes.map((n) => (
            <MapNode
              key={n.id}
              n={n}
              selected={selNode === n.id}
              match={!!matches?.has(n.id)}
              dim={
                (!!matches && !matches.has(n.id)) || (layers.focus && !!neighbours && !neighbours.has(n.id))
              }
              showLinks={layers.links}
              links={linkCount(n.id)}
              onPointerDown={(e) => dragNode(e, n)}
              onHandleDown={(e) => dragLink(e, n)}
              onSelect={() => setSel({ kind: 'node', id: n.id })}
            />
          ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-card px-3 py-1.5 text-[11px] text-muted shadow-sm">
        {caption}
      </div>
      <div
        className="absolute top-3 right-3 flex items-center gap-3 rounded-full bg-card px-3 py-1.5 text-[11px] text-muted shadow-sm"
        aria-label="Legend"
      >
        <span className="flex items-center gap-1.5">
          <svg width="18" height="6" aria-hidden>
            <line x1="0" y1="3" x2="18" y2="3" stroke="var(--text)" strokeWidth="2" />
          </svg>
          Selected path
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="18" height="6" aria-hidden>
            <line
              x1="0"
              y1="3"
              x2="18"
              y2="3"
              stroke="var(--danger)"
              strokeWidth="2"
              strokeDasharray={REL_META.contradicts.dash}
            />
          </svg>
          Contradicts
        </span>
        <span className="flex items-center gap-1.5">
          <Dot color="var(--edge)" />
          Other
        </span>
      </div>
      <div className="absolute bottom-3 left-3 flex flex-col items-center gap-0.5 rounded-full bg-card p-1 shadow-sm">
        <IconButton label="Zoom in" icon={Plus} size={28} onClick={() => vp.zoomBy(1.18)} />
        <span className="font-mono text-[10px] text-muted">{Math.round(vp.zoom * 100)}%</span>
        <IconButton label="Zoom out" icon={Minus} size={28} onClick={() => vp.zoomBy(0.85)} />
        <IconButton label="Fit to screen" icon={Maximize} size={28} onClick={() => vp.fit(nodes)} />
      </div>
      <Minimap nodes={nodes} vp={vp} />
    </div>
  )
}
