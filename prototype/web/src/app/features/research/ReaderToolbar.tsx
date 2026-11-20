import { useNavigate } from 'react-router'
import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  MessageSquareQuote,
  Search,
  ShieldCheck,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { Source } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { IconButton } from '../../ui'

type ToolbarProps = {
  src?: Source
  page: number
  pageCount: number
  go: (page: number) => void
  zoom: number
  setZoom: (z: number) => void
  findOpen: boolean
  toggleFind: () => void
  hlMode: boolean
  toggleHl: () => void
}

const Sep = () => <span className="mx-1 h-4 w-px bg-line" />

export function ReaderToolbar({
  src,
  page,
  pageCount,
  go,
  zoom,
  setZoom,
  findOpen,
  toggleFind,
  hlMode,
  toggleHl,
}: ToolbarProps) {
  const nav = useNavigate()
  const { setNoteDraft } = useStore()
  const annotate = () =>
    src &&
    setNoteDraft({
      title: `Annotation · ${src.title} p.${page}`,
      body: '',
      projectId: src.projectId,
      sourceId: src.id,
      page,
      tags: ['annotation'],
    })
  return (
    <div className="flex h-12 shrink-0 items-center gap-0.5 px-2">
      <div className="min-w-0 flex-1 truncate px-2 text-[13px] font-semibold">
        {src?.title ?? 'No document'}
      </div>
      <IconButton
        label="Previous page"
        icon={ChevronLeft}
        disabled={!src || page <= 1}
        onClick={() => go(page - 1)}
      />
      <div className="flex items-center gap-1 font-mono text-xs text-muted">
        <input
          aria-label="Page number"
          value={page}
          onChange={(e) => go(Number(e.target.value) || 1)}
          className="h-7 w-9 rounded-lg bg-raised text-center text-fg outline-none"
        />
        / {pageCount || '–'}
      </div>
      <IconButton
        label="Next page"
        icon={ChevronRight}
        disabled={!src || page >= pageCount}
        onClick={() => go(page + 1)}
      />
      <Sep />
      <IconButton label="Zoom out" icon={ZoomOut} disabled={zoom <= 70} onClick={() => setZoom(zoom - 10)} />
      <span className="w-10 text-center font-mono text-[11px] text-muted">{zoom}%</span>
      <IconButton label="Zoom in" icon={ZoomIn} disabled={zoom >= 160} onClick={() => setZoom(zoom + 10)} />
      <Sep />
      <IconButton
        label="Search in document (Ctrl+Shift+F)"
        icon={Search}
        active={findOpen}
        onClick={toggleFind}
      />
      <IconButton
        label={hlMode ? 'Highlight mode on' : 'Highlight mode: select text to highlight'}
        icon={Highlighter}
        active={hlMode}
        onClick={toggleHl}
      />
      <IconButton label="Annotate this page" icon={MessageSquareQuote} disabled={!src} onClick={annotate} />
      <IconButton
        label="Verify source metadata"
        icon={ShieldCheck}
        disabled={!src}
        onClick={() => src && nav(`/verify?source=${src.id}`)}
      />
    </div>
  )
}

type FindProps = {
  inputRef: React.RefObject<HTMLInputElement | null>
  value: string
  onChange: (v: string) => void
  onPage: number
  total: number
  step: (dir: 1 | -1) => void
  onClose: () => void
}

export function FindBar({ inputRef, value, onChange, onPage, total, step, onClose }: FindProps) {
  return (
    <div className="mx-3 mb-2 flex h-9 shrink-0 items-center gap-2 rounded-full bg-raised pr-1 pl-3">
      <Search size={13} className="text-muted" aria-hidden />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') step(e.shiftKey ? -1 : 1)
          if (e.key === 'Escape') onClose()
        }}
        placeholder="Find in document"
        className="h-7 flex-1 bg-transparent text-[13px] outline-none"
        aria-label="Find in document"
      />
      {value.length > 1 && (
        <span className="font-mono text-[11px] text-muted">
          {onPage} on page · {total} total
        </span>
      )}
      <IconButton
        label="Previous match"
        icon={ChevronLeft}
        size={26}
        disabled={!total}
        onClick={() => step(-1)}
      />
      <IconButton
        label="Next match"
        icon={ChevronRight}
        size={26}
        disabled={!total}
        onClick={() => step(1)}
      />
      <IconButton label="Close find" icon={X} size={26} onClick={onClose} />
    </div>
  )
}
