import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getPages } from '../../data/documents'
import { SELECTION_LABELS, selectionAnswer, type SelectionAction } from '../../lib/assistant'
import { useStore } from '../../state/StoreProvider'
import { AssistantPane, type Scope } from './AssistantPane'
import { ReaderPane } from './ReaderPane'
import { SelectionMenu, type Selection, type SelectionKind } from './SelectionMenu'
import { SourcePane } from './SourcePane'
import { useAssistant } from './useAssistant'
import { ResizeHandle, useResizable } from './useResizable'

const ASK_KINDS: SelectionAction[] = ['Explain', 'Summarize', 'Compare', 'Support', 'Contradict']

/** Three-pane research workspace. URL (?source, ?page, ?flash) is the source of truth for location. */
export function WorkspacePage() {
  const store = useStore()
  const { sources, currentProjectId, setCurrentProjectId, setHighlights, nextId, toast } = store
  const [params, setParams] = useSearchParams()
  const [sel, setSel] = useState<Selection | null>(null)
  const [flash, setFlash] = useState('')
  const [scope, setScope] = useState<Scope>('document')
  const left = useResizable(256, 200, 380, 1)
  const right = useResizable(360, 300, 520, -1)

  const fallback =
    sources.find((s) => s.projectId === currentProjectId && s.status === 'Completed')?.id ?? sources[0]?.id
  const src = sources.find((s) => s.id === (params.get('source') ?? fallback))
  const pages = src ? getPages(src) : []
  const page = Math.min(Math.max(1, Number(params.get('page') ?? 1)), Math.max(1, pages.length))

  useEffect(() => {
    if (src && src.projectId !== currentProjectId) setCurrentProjectId(src.projectId)
  }, [src, currentProjectId, setCurrentProjectId])
  useEffect(() => {
    const f = params.get('flash')
    if (!f) return
    setFlash(f)
    const t = setTimeout(() => setFlash(''), 1800)
    return () => clearTimeout(t)
  }, [params])

  const openSource = (id: string, p = 1, flashText?: string) => {
    setParams({ source: id, page: String(p), ...(flashText ? { flash: flashText } : {}) })
    setSel(null)
  }
  const projectSources = sources.filter((s) => s.projectId === currentProjectId && s.status === 'Completed')
  const scopeSources = scope === 'document' ? (src ? [src] : []) : projectSources
  const scopeLabel =
    scope === 'document'
      ? `Current document · ${src?.title ?? 'none'}`
      : `Project sources · ${projectSources.length} processed`
  const assistant = useAssistant(src, page, scopeLabel)

  const addHighlight = (text: string) => {
    if (!src) return
    setHighlights((h) => [...h, { id: nextId('H'), sourceId: src.id, page, text }])
    toast('Passage highlighted')
    setSel(null)
  }

  const onPick = (kind: SelectionKind) => {
    if (!sel || !src) return
    const q = sel.text.length > 140 ? `${sel.text.slice(0, 140)}…` : sel.text
    if ((ASK_KINDS as string[]).includes(kind)) {
      const k = kind as SelectionAction
      assistant.ask(`${SELECTION_LABELS[k]}: “${q}”`, selectionAnswer(k, q, src.id, page, scopeLabel))
    }
    if (kind === 'Note')
      store.setNoteDraft({
        title: `Note from ${src.title} p.${page}`,
        body: `“${sel.text}”\n\n`,
        projectId: src.projectId,
        sourceId: src.id,
        page,
        tags: ['excerpt'],
      })
    if (kind === 'Graph') {
      const label = q.length > 70 ? `${q.slice(0, 70)}…` : q
      const id = store.addNode({
        type: 'evidence',
        label,
        desc: `Excerpt from ${src.title}, page ${page}.`,
        x: 300 + Math.round(Math.random() * 300),
        y: 820,
        projectId: src.projectId,
        sourceId: src.id,
        page,
      })
      toast('Evidence node added to Knowledge Map', 'success', { label: 'Open', to: `/map?node=${id}` })
    }
    if (kind === 'Highlight') addHighlight(sel.text)
    setSel(null)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <div
      className="flex h-full gap-0 p-2"
      onMouseDown={(e) => !(e.target as HTMLElement).closest('[data-selmenu]') && setSel(null)}
    >
      <SourcePane width={left.width} activeId={src?.id} onOpen={(id) => openSource(id)} />
      <ResizeHandle onPointerDown={left.onPointerDown} label="Resize source pane" />
      <ReaderPane
        src={src}
        pages={pages}
        page={page}
        flash={flash}
        go={(p) => src && openSource(src.id, p)}
        onSelection={setSel}
        addHighlight={addHighlight}
      />
      <ResizeHandle onPointerDown={right.onPointerDown} label="Resize assistant pane" />
      <AssistantPane
        width={right.width}
        src={src}
        scope={scope}
        setScope={setScope}
        scopeSources={scopeSources}
        assistant={assistant}
        openSource={openSource}
      />
      {sel && <SelectionMenu sel={sel} onPick={onPick} />}
    </div>
  )
}
