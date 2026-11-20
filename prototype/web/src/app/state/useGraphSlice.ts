import { useState } from 'react'
import { EDGES, NODES } from '../data/knowledge'
import type { Edge, GNode } from '../data/types'
import { nextId } from '../lib/format'
import type { UiSlice } from './useUiSlice'

type Snapshot = { nodes: GNode[]; edges: Edge[] }
const HISTORY_LIMIT = 50

/** Knowledge graph with snapshot-based undo/redo. Every mutation goes through `commit`. */
export function useGraphSlice(ui: UiSlice) {
  const [nodes, setNodes] = useState<GNode[]>(NODES)
  const [edges, setEdges] = useState<Edge[]>(EDGES)
  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])

  const snapshot = () => {
    setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), { nodes, edges }])
    setFuture([])
  }
  const graphCommit = (n: GNode[], e: Edge[]) => {
    snapshot()
    setNodes(n)
    setEdges(e)
  }
  const restore = (s: Snapshot) => {
    setNodes(s.nodes)
    setEdges(s.edges)
  }
  const undo = () => {
    const last = past[past.length - 1]
    if (!last) return
    setFuture((f) => [{ nodes, edges }, ...f])
    setPast((p) => p.slice(0, -1))
    restore(last)
    ui.toast('Undone', 'info')
  }
  const redo = () => {
    const nxt = future[0]
    if (!nxt) return
    setPast((p) => [...p, { nodes, edges }])
    setFuture((f) => f.slice(1))
    restore(nxt)
    ui.toast('Redone', 'info')
  }

  const addNode = (n: Omit<GNode, 'id'>) => {
    const id = nextId('K')
    graphCommit([...nodes, { ...n, id }], edges)
    ui.logActivity(`Added ${n.type} “${n.label}”`, `/map?node=${id}`)
    return id
  }
  const updateNode = (id: string, patch: Partial<GNode>) =>
    graphCommit(
      nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      edges,
    )
  const deleteNode = (id: string) =>
    graphCommit(
      nodes.filter((n) => n.id !== id),
      edges.filter((e) => e.from !== id && e.to !== id),
    )
  const addEdge = (from: string, to: string, rel: Edge['rel']) => {
    if (from === to || edges.some((e) => e.from === from && e.to === to)) {
      ui.toast('Those nodes are already connected', 'error')
      return
    }
    graphCommit(nodes, [...edges, { id: nextId('E'), from, to, rel }])
    ui.toast('Nodes connected')
  }
  const updateEdge = (id: string, rel: Edge['rel']) =>
    graphCommit(
      nodes,
      edges.map((e) => (e.id === id ? { ...e, rel } : e)),
    )
  const deleteEdge = (id: string) => {
    graphCommit(
      nodes,
      edges.filter((e) => e.id !== id),
    )
    ui.toast('Connection removed')
  }
  /** Live position updates while dragging; call `snapshot()` once at drag start. */
  const moveNodeLive = (id: string, x: number, y: number) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, x, y } : n)))

  return {
    nodes,
    edges,
    past,
    future,
    setNodes,
    snapshot,
    graphCommit,
    undo,
    redo,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    moveNodeLive,
  }
}

export type GraphSlice = ReturnType<typeof useGraphSlice>
