import { REL_META } from '../../data/meta'
import type { Edge, GNode } from '../../data/types'
import { connector } from './geometry'

type Props = {
  e: Edge
  a: GNode
  b: GNode
  active: boolean
  selected: boolean
  dim: boolean
  showLabel: boolean
  onSelect: () => void
}

/** Orthogonal connector. Neutral by default; emphasised when attached to the selection. */
export function MapEdge({ e, a, b, active, selected, dim, showLabel, onSelect }: Props) {
  const m = REL_META[e.rel]
  const c = connector(a, b)
  const stroke = m.warn ? 'var(--danger)' : active || selected ? 'var(--text)' : 'var(--edge)'
  const w = m.label.length * 6.2 + 16
  return (
    <g
      opacity={dim ? 0.15 : 1}
      onPointerDown={(ev) => {
        ev.stopPropagation()
        onSelect()
      }}
      className="cursor-pointer"
    >
      <path d={c.d} fill="none" stroke="transparent" strokeWidth={14} />
      <path
        d={c.d}
        fill="none"
        stroke={stroke}
        strokeWidth={selected ? 2.5 : active ? 2 : 1.5}
        strokeDasharray={m.dash}
        markerEnd={`url(#arrow-${m.warn ? 'warn' : active || selected ? 'on' : 'off'})`}
      />
      {showLabel && (
        <g transform={`translate(${c.lx} ${c.ly})`}>
          <rect
            x={-w / 2}
            y={-10}
            width={w}
            height={20}
            rx={10}
            fill={selected ? 'var(--text)' : 'var(--raised)'}
          />
          <text
            textAnchor="middle"
            y={4}
            fontSize={10.5}
            fontWeight={500}
            fill={selected ? 'var(--bg)' : m.warn ? 'var(--danger)' : 'var(--text2)'}
          >
            {m.label}
          </text>
        </g>
      )}
    </g>
  )
}

export function ArrowDefs() {
  const arrows = [
    ['off', 'var(--edge)'],
    ['on', 'var(--text)'],
    ['warn', 'var(--danger)'],
  ]
  return (
    <defs>
      {arrows.map(([id, fill]) => (
        <marker
          key={id}
          id={`arrow-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={fill} />
        </marker>
      ))}
    </defs>
  )
}
