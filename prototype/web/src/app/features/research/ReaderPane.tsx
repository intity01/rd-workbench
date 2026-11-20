import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpenText } from 'lucide-react'
import type { Block } from '../../data/documents'
import type { Source } from '../../data/types'
import { useFindShortcut } from '../../shell/events'
import { useStore } from '../../state/StoreProvider'
import { EmptyState, esc } from '../../ui'
import { BlockView, blockText, marked } from './DocumentBlocks'
import { ProcessingState } from './ProcessingState'
import { FindBar, ReaderToolbar } from './ReaderToolbar'
import type { Selection } from './SelectionMenu'

type Props = {
  src?: Source
  pages: Block[][]
  page: number
  flash: string
  go: (page: number) => void
  onSelection: (sel: Selection | null) => void
  addHighlight: (text: string) => void
}

export function ReaderPane({ src, pages, page, flash, go, onSelection, addHighlight }: Props) {
  const { highlights } = useStore()
  const [zoom, setZoom] = useState(100)
  const [findOpen, setFindOpen] = useState(false)
  const [find, setFind] = useState('')
  const [hlMode, setHlMode] = useState(false)
  const findRef = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  const openFind = () => {
    setFindOpen(true)
    setTimeout(() => findRef.current?.focus(), 0)
  }
  useFindShortcut(openFind)
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [src?.id, page])

  const perPage = useMemo(() => {
    if (find.length < 2) return [] as number[]
    const re = new RegExp(esc(find), 'gi')
    return pages.map((bl) => bl.reduce((n, b) => n + (blockText(b).match(re)?.length ?? 0), 0))
  }, [find, pages])
  const total = perPage.reduce((a, b) => a + b, 0)
  const step = (dir: 1 | -1) => {
    for (let i = 1; total && i <= pages.length; i++) {
      const p = ((page - 1 + dir * i + pages.length * 2) % pages.length) + 1
      if (perPage[p - 1]) return go(p)
    }
  }

  const onMouseUp = () => {
    const s = window.getSelection()
    const text = s?.toString().trim() ?? ''
    if (!s || text.length < 4 || !scroller.current?.contains(s.anchorNode)) return onSelection(null)
    if (hlMode) {
      addHighlight(text)
      return s.removeAllRanges()
    }
    const r = s.getRangeAt(0).getBoundingClientRect()
    onSelection({
      text,
      x: Math.min(window.innerWidth - 280, Math.max(12, r.left + r.width / 2 - 130)),
      y: Math.max(64, r.top - 8),
    })
  }

  const pageHl = highlights.filter((h) => h.sourceId === src?.id && h.page === page)
  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-canvas">
      <ReaderToolbar
        src={src}
        page={page}
        pageCount={pages.length}
        go={go}
        zoom={zoom}
        setZoom={setZoom}
        findOpen={findOpen}
        toggleFind={() => (findOpen ? setFindOpen(false) : openFind())}
        hlMode={hlMode}
        toggleHl={() => setHlMode(!hlMode)}
      />
      {findOpen && (
        <FindBar
          inputRef={findRef}
          value={find}
          onChange={setFind}
          onPage={perPage[page - 1] ?? 0}
          total={total}
          step={step}
          onClose={() => {
            setFindOpen(false)
            setFind('')
          }}
        />
      )}
      <div ref={scroller} onMouseUp={onMouseUp} className="relative flex-1 overflow-auto">
        {!src ? (
          <EmptyState
            icon={BookOpenText}
            title="No document selected"
            body="Choose a source from the library or import one."
          />
        ) : src.status !== 'Completed' ? (
          <ProcessingState src={src} />
        ) : (
          <div className="px-4 pt-2 pb-10">
            <article
              className="mx-auto rounded-xl bg-card px-14 py-12 shadow-sm"
              style={{ width: `${(680 * zoom) / 100}px`, fontSize: `${(15 * zoom) / 100}px` }}
              lang="en"
            >
              {pages[page - 1]?.map((b, i) => (
                <BlockView key={i} b={b} render={(t) => marked(t, pageHl, find, flash)} />
              ))}
              <div className="mt-10 flex items-center justify-between border-t border-line pt-3 font-mono text-[10px] text-muted">
                <span>
                  {src.id} · fictional sample text
                  {src.id > 'SRC-008' ? ' (generated — not extracted from your file)' : ''}
                </span>
                <span>
                  {page} / {pages.length}
                </span>
              </div>
            </article>
          </div>
        )}
      </div>
    </section>
  )
}
