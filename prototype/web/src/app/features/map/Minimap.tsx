import { NODE_META } from '../../data/meta'
import type { GNode } from '../../data/types'
import { H, W, bounds } from './geometry'
import type { Viewport } from './useViewport'

const MW = 168

/** Overview of all visible nodes; the frame is always fully inside the map. Click to recentre. */
export function Minimap({ nodes, vp }: { nodes: GNode[]; vp: Viewport }) {
  if (!nodes.length) return null
  const view = {
    x: -vp.pan.x / vp.zoom,
    y: -vp.pan.y / vp.zoom,
    w: vp.size.w / vp.zoom,
    h: vp.size.h / vp.zoom,
  }
  const nb = bounds(nodes, 40)
  const x0 = Math.min(nb.x, view.x)
  const y0 = Math.min(nb.y, view.y)
  const bw = Math.max(nb.x + nb.w, view.x + view.w) - x0
  const bh = Math.max(nb.y + nb.h, view.y + view.h) - y0
  const sc = Math.min(MW / bw, 120 / bh)
  const mh = bh * sc
  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    vp.centerOn(x0 + (e.clientX - r.left) / sc, y0 + (e.clientY - r.top) / sc)
  }
  return (
    <div className="absolute right-3 bottom-3 rounded-2xl bg-card p-2 shadow-sm" aria-label="Minimap">
      <svg width={MW} height={mh} className="block cursor-pointer" onClick={onClick}>
        {nodes.map((n) => (
          <rect
            key={n.id}
            x={(n.x - W / 2 - x0) * sc}
            y={(n.y - H / 2 - y0) * sc}
            width={W * sc}
            height={H * sc}
            rx={2}
            fill={NODE_META[n.type].color}
          />
        ))}
        <rect
          x={(view.x - x0) * sc + 0.75}
          y={(view.y - y0) * sc + 0.75}
          width={Math.max(4, view.w * sc - 1.5)}
          height={Math.max(4, view.h * sc - 1.5)}
          rx={4}
          fill="var(--text)"
          fillOpacity={0.06}
          stroke="var(--text)"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  )
}
