import { NODE_META, REL_META } from '../../data/meta'
import type { GNode, NodeType, Rel } from '../../data/types'

export const W = 228
export const H = 92
export const ARG: NodeType[] = ['claim', 'evidence', 'counter', 'question', 'decision']
export const ALL = Object.keys(NODE_META) as NodeType[]
export const RELS = Object.keys(REL_META) as Rel[]

export type Box = { x: number; y: number; w: number; h: number }

export function bounds(list: { x: number; y: number }[], pad = 0): Box {
  const xs = list.map((n) => n.x)
  const ys = list.map((n) => n.y)
  const x = Math.min(...xs) - W / 2 - pad
  const y = Math.min(...ys) - H / 2 - pad
  return { x, y, w: Math.max(...xs) + W / 2 + pad - x, h: Math.max(...ys) + H / 2 + pad - y }
}

const corner = (d: number, room: number) => Math.min(12, Math.abs(d) / 2, Math.abs(room))

/** Orthogonal connector with rounded corners. Returns the SVG path and a label anchor. */
export function connector(a: GNode, b: GNode) {
  const horizontal = Math.abs(b.x - a.x) > W * 0.75
  if (horizontal) {
    const sx = Math.sign(b.x - a.x)
    const x1 = a.x + (sx * W) / 2
    const x2 = b.x - (sx * W) / 2
    const [y1, y2] = [a.y, b.y]
    const mx = (x1 + x2) / 2
    const dy = y2 - y1
    if (Math.abs(dy) < 1) return { d: `M${x1} ${y1} H${x2}`, lx: mx, ly: y1, p1: [x1, y1], p2: [x2, y2] }
    const r = corner(dy, mx - x1)
    const sy = Math.sign(dy)
    const d = `M${x1} ${y1} H${mx - sx * r} Q${mx} ${y1} ${mx} ${y1 + sy * r} V${y2 - sy * r} Q${mx} ${y2} ${mx + sx * r} ${y2} H${x2}`
    return { d, lx: mx, ly: (y1 + y2) / 2, p1: [x1, y1], p2: [x2, y2] }
  }
  const sy = Math.sign(b.y - a.y) || 1
  const y1 = a.y + (sy * H) / 2
  const y2 = b.y - (sy * H) / 2
  const [x1, x2] = [a.x, b.x]
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  if (Math.abs(dx) < 1) return { d: `M${x1} ${y1} V${y2}`, lx: x1, ly: my, p1: [x1, y1], p2: [x2, y2] }
  const r = corner(dx, my - y1)
  const sx = Math.sign(dx)
  const d = `M${x1} ${y1} V${my - sy * r} Q${x1} ${my} ${x1 + sx * r} ${my} H${x2 - sx * r} Q${x2} ${my} ${x2} ${my + sy * r} V${y2}`
  return { d, lx: (x1 + x2) / 2, ly: my, p1: [x1, y1], p2: [x2, y2] }
}

const COLUMN: Record<NodeType, number> = {
  evidence: 0,
  claim: 1,
  counter: 2,
  question: 2,
  decision: 3,
  concept: 0,
  topic: 1,
  document: 2,
}

/** Column layout: argument types on top rows, knowledge types below. */
export function autoLayout(nodes: GNode[]): GNode[] {
  const counts: Record<string, number> = {}
  return nodes.map((n) => {
    const arg = ARG.includes(n.type)
    const key = `${arg ? 'a' : 'k'}${COLUMN[n.type]}`
    const i = (counts[key] = (counts[key] ?? -1) + 1)
    const x = 140 + COLUMN[n.type] * 320
    return { ...n, x, y: arg ? 120 + i * 150 : 640 + i * 140 }
  })
}

export const hitNode = (list: GNode[], x: number, y: number, except?: string) =>
  list.find((m) => m.id !== except && Math.abs(m.x - x) < W / 2 && Math.abs(m.y - y) < H / 2)
