import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { LayoutGrid, PanelRightClose, PanelRightOpen, Plus, Redo2, Undo2 } from 'lucide-react'
import { NODE_META } from '../../data/meta'
import type { NodeType } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, IconButton } from '../../ui'
import { ALL, ARG, autoLayout } from './geometry'
import { MapCanvas, type Layers, type Sel } from './MapCanvas'
import { AddNodeDialog, ConnectDialog, type NewNode } from './MapDialogs'
import { MapInspector } from './MapInspector'
import { MapSidebar, type MapView } from './MapSidebar'
import { useViewport } from './useViewport'

export function KnowledgeMapPage() {
  const {
    nodes,
    edges,
    currentProjectId,
    addNode,
    deleteNode,
    deleteEdge,
    addEdge,
    graphCommit,
    undo,
    redo,
    past,
    future,
    confirm,
    toast,
  } = useStore()
  const [params, setParams] = useSearchParams()
  const vp = useViewport()
  const [view, setView] = useState<MapView>('argument')
  const [types, setTypes] = useState<NodeType[]>(ALL)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Sel>(null)
  const [layers, setLayers] = useState<Layers>({ labels: true, links: true, focus: true, grouping: 'none' })
  const [picker, setPicker] = useState<{ from: string; to: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [panel, setPanel] = useState(true)

  const inView = (v: MapView, t: NodeType[]) =>
    nodes.filter((n) => t.includes(n.type) && (v === 'knowledge' || ARG.includes(n.type)))
  const visible = useMemo(() => inView(view, types), [nodes, view, types]) // eslint-disable-line react-hooks/exhaustive-deps
  const ids = new Set(visible.map((n) => n.id))
  const visEdges = edges.filter((e) => ids.has(e.from) && ids.has(e.to))
  const matches = q.trim()
    ? new Set(
        visible
          .filter((n) => `${n.label} ${n.desc}`.toLowerCase().includes(q.toLowerCase()))
          .map((n) => n.id),
      )
    : null
  const byId = (id: string) => nodes.find((n) => n.id === id)
  const focusNode = (id: string) => {
    const n = byId(id)
    if (!n) return
    if (!ARG.includes(n.type)) setView('knowledge')
    setSel({ kind: 'node', id })
    vp.centerOn(n.x, n.y)
  }

  // Wait for a measured canvas, then fit or centre on ?node=. ?add= / ?undo= do not need a size.
  const fitted = useRef(false)
  const ready = vp.size.w > 100
  useEffect(() => {
    if (fitted.current || !ready) return
    fitted.current = true
    if (!params.get('node')) vp.fit(visible)
  }, [vp, visible, params])
  useEffect(() => {
    const id = params.get('node')
    if (id && ready) focusNode(id)
  }, [params, ready]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (params.get('add')) setAdding(true)
    if (params.get('undo')) {
      undo()
      setParams({}, { replace: true })
    }
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeSelected = () => {
    if (sel?.kind === 'edge') {
      deleteEdge(sel.id)
      return setSel(null)
    }
    const n = sel && byId(sel.id)
    if (!n) return
    const count = edges.filter((e) => e.from === n.id || e.to === n.id).length
    confirm({
      title: 'Delete node?',
      body: `“${n.label}” and its ${count} connections will be removed. You can undo this.`,
      onConfirm: () => {
        deleteNode(n.id)
        setSel(null)
        toast('Node deleted', 'success', { label: 'Undo', to: '/map?undo=1' })
      },
    })
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault()
        removeSelected()
      } else if (e.key === 'Escape') {
        setPicker(null)
        setSel(null)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const changeView = (v: MapView) => {
    setView(v)
    setTimeout(() => vp.fit(inView(v, types)), 0)
  }
  const applyLayout = () => {
    const next = autoLayout(nodes)
    graphCommit(next, edges)
    setTimeout(() => vp.fit(next.filter((n) => ids.has(n.id))), 0)
    toast('Auto layout applied — undo to revert', 'info')
  }
  const onAdd = (d: NewNode) => {
    const x = Math.round((vp.size.w / 2 - vp.pan.x) / vp.zoom)
    const y = Math.round((vp.size.h / 2 - vp.pan.y) / vp.zoom)
    const id = addNode({ ...d, x, y, projectId: currentProjectId || 'P-001' })
    if (!types.includes(d.type)) setTypes((t) => [...t, d.type])
    if (!ARG.includes(d.type)) setView('knowledge')
    setSel({ kind: 'node', id })
    closeAdd()
    toast(`${NODE_META[d.type].label} added`)
  }
  const closeAdd = () => {
    setAdding(false)
    if (params.get('add')) setParams({}, { replace: true })
  }
  const caption = `${view === 'argument' ? 'Argument Map' : 'Knowledge Map'} · ${visible.length} nodes · ${visEdges.length} links`

  return (
    <div className="flex h-full">
      <MapSidebar
        view={view}
        setView={changeView}
        q={q}
        setQ={setQ}
        matchCount={matches ? matches.size : null}
        onGoFirst={() => matches && focusNode([...matches][0])}
        types={types}
        setTypes={setTypes}
        nodes={nodes}
      />
      <section className="flex min-w-0 flex-1 flex-col py-2">
        <div className="flex h-11 shrink-0 items-center gap-1 pb-2">
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setAdding(true)}>
            Add Node
          </Button>
          <span className="mx-1 h-4 w-px bg-line" />
          <IconButton label="Undo (Ctrl+Z)" icon={Undo2} disabled={!past.length} onClick={undo} />
          <IconButton label="Redo (Ctrl+Shift+Z)" icon={Redo2} disabled={!future.length} onClick={redo} />
          <IconButton label="Auto layout" icon={LayoutGrid} onClick={applyLayout} />
          <div className="flex-1" />
          <IconButton
            label={panel ? 'Hide inspector' : 'Show inspector'}
            icon={panel ? PanelRightClose : PanelRightOpen}
            onClick={() => setPanel(!panel)}
          />
        </div>
        <MapCanvas
          vp={vp}
          nodes={visible}
          edges={visEdges}
          sel={sel}
          setSel={setSel}
          matches={matches}
          layers={layers}
          onConnect={(from, to) => setPicker({ from, to })}
          caption={caption}
        />
      </section>
      {panel ? (
        <MapInspector
          sel={sel}
          setSel={setSel}
          onSelectNode={focusNode}
          onDelete={removeSelected}
          layers={layers}
          setLayers={setLayers}
          view={view}
        />
      ) : (
        <div className="w-2 shrink-0" />
      )}
      {picker && (
        <ConnectDialog
          from={byId(picker.from)?.label}
          to={byId(picker.to)?.label}
          onClose={() => setPicker(null)}
          onPick={(r) => {
            addEdge(picker.from, picker.to, r)
            setPicker(null)
          }}
        />
      )}
      {adding && (
        <AddNodeDialog
          defaultType={view === 'argument' ? 'claim' : 'concept'}
          onClose={closeAdd}
          onAdd={onAdd}
        />
      )}
    </div>
  )
}
