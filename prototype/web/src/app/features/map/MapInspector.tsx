import { useState } from 'react'
import { Unlink } from 'lucide-react'
import { NODE_META, REL_META } from '../../data/meta'
import type { Rel } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, Dot, Segmented, Switch, field } from '../../ui'
import { ARG, ALL, RELS } from './geometry'
import type { Layers, Sel } from './MapCanvas'
import type { MapView } from './MapSidebar'
import { NodeInspector } from './NodeInspector'

type Props = {
  sel: Sel
  setSel: (s: Sel) => void
  onSelectNode: (id: string) => void
  onDelete: () => void
  layers: Layers
  setLayers: (l: Layers) => void
  view: MapView
}

function EdgePanel({ id, setSel }: { id: string; setSel: (s: Sel) => void }) {
  const { edges, nodes, updateEdge, deleteEdge } = useStore()
  const e = edges.find((x) => x.id === id)
  if (!e) return null
  const label = (nid: string) => nodes.find((n) => n.id === nid)?.label
  return (
    <div className="space-y-3 px-4">
      <div className="space-y-1.5 rounded-2xl bg-surface-2 p-3 text-[13px]">
        <button
          className="block text-left font-medium hover:underline"
          onClick={() => setSel({ kind: 'node', id: e.from })}
        >
          {label(e.from)}
        </button>
        <div className="text-[11px] text-muted">↓ {REL_META[e.rel].label}</div>
        <button
          className="block text-left font-medium hover:underline"
          onClick={() => setSel({ kind: 'node', id: e.to })}
        >
          {label(e.to)}
        </button>
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-muted">Relationship</span>
        <select
          className={field('h-8 w-36 rounded-full text-[12.5px]')}
          value={e.rel}
          onChange={(ev) => updateEdge(e.id, ev.target.value as Rel)}
        >
          {RELS.map((r) => (
            <option key={r} value={r}>
              {REL_META[r].label}
            </option>
          ))}
        </select>
      </div>
      <Button
        className="w-full"
        variant="danger"
        icon={Unlink}
        onClick={() => {
          deleteEdge(e.id)
          setSel(null)
        }}
      >
        Disconnect
      </Button>
    </div>
  )
}

function LayersPanel({ layers, setLayers }: { layers: Layers; setLayers: (l: Layers) => void }) {
  const rows: [keyof Omit<Layers, 'grouping'>, string][] = [
    ['labels', 'Relation labels'],
    ['links', 'Source & note links'],
    ['focus', 'Focus on selection'],
  ]
  return (
    <div className="px-4">
      <div className="overflow-hidden rounded-2xl bg-surface-2">
        {rows.map(([k, l]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]">
            <span className="truncate">{l}</span>
            <Switch label={l} checked={layers[k]} onChange={(v) => setLayers({ ...layers, [k]: v })} />
          </div>
        ))}
      </div>
      <div className="mt-4 mb-2 flex items-center justify-between text-[13px]">
        <span className="text-muted">Grouping</span>
        <Segmented
          size="sm"
          label="Grouping"
          value={layers.grouping}
          onChange={(g) => setLayers({ ...layers, grouping: g })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'type', label: 'By type' },
          ]}
        />
      </div>
      <h4 className="mt-5 mb-2 text-[13px] font-semibold">Relationships</h4>
      <ul className="space-y-1.5 text-[12px]">
        {RELS.map((r) => (
          <li key={r} className="flex items-center gap-2.5">
            <svg width="26" height="8" aria-hidden>
              <line
                x1="0"
                y1="4"
                x2="26"
                y2="4"
                stroke={REL_META[r].warn ? 'var(--danger)' : 'var(--text2)'}
                strokeWidth="2"
                strokeDasharray={REL_META[r].dash}
              />
            </svg>
            {REL_META[r].label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function MapInspector({ sel, setSel, onSelectNode, onDelete, layers, setLayers, view }: Props) {
  const { nodes, edges } = useStore()
  const [tab, setTab] = useState<'inspect' | 'layers'>('inspect')
  const node = sel?.kind === 'node' ? nodes.find((n) => n.id === sel.id) : undefined
  return (
    <aside className="w-[300px] shrink-0 overflow-auto" aria-label="Inspector">
      <div className="p-3">
        <Segmented
          full
          label="Panel"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'inspect', label: 'Inspector' },
            { value: 'layers', label: 'Layers' },
          ]}
        />
      </div>
      {tab === 'layers' ? (
        <LayersPanel layers={layers} setLayers={setLayers} />
      ) : node ? (
        <NodeInspector
          key={`${node.id}-${node.label}-${node.desc}`}
          n={node}
          onSelect={onSelectNode}
          onDelete={onDelete}
        />
      ) : sel?.kind === 'edge' ? (
        <EdgePanel id={sel.id} setSel={setSel} />
      ) : (
        <div className="px-4">
          <p className="text-[13px] text-muted">
            Select a node or connection to edit it. Drag the right-hand port of a node onto another node to
            connect them.
          </p>
          <ul className="mt-4 space-y-2">
            {(view === 'argument' ? ARG : ALL).map((t) => (
              <li key={t} className="flex gap-2.5 text-[12px]">
                <span className="mt-1">
                  <Dot color={NODE_META[t].color} />
                </span>
                <span>
                  <span className="font-medium">{NODE_META[t].label}</span>
                  <span className="block text-muted">{NODE_META[t].hint}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 font-mono text-[11px] text-muted">
            {nodes.length} nodes · {edges.length} connections
          </p>
        </div>
      )}
    </aside>
  )
}
