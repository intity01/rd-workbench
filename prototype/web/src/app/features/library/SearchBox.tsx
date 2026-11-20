import { useState } from 'react'
import { Clock, Search, X } from 'lucide-react'
import { field } from '../../ui'

const SUGGESTIONS = [
  'zero-copy IPC for Python and Rust',
  'process isolation',
  'scanned mathematical documents',
  'adaptive extraction strategy',
  'สมการ OCR',
  'alignment metrics',
]

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: (v: string) => void
  recent: string[]
  inputRef: React.RefObject<HTMLInputElement | null>
}

export function SearchBox({ value, onChange, onSubmit, recent, inputRef }: Props) {
  const [focus, setFocus] = useState(false)
  const pick = (v: string) => {
    setFocus(false)
    onSubmit(v)
  }
  const suggestions = SUGGESTIONS.filter(
    (s) => !value || s.toLowerCase().includes(value.toLowerCase().slice(0, 3)),
  )
  return (
    <div className="relative max-w-3xl">
      <Search size={16} className="absolute top-3.5 left-4 text-muted" aria-hidden />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        onKeyDown={(e) => e.key === 'Enter' && pick(value)}
        className={field('h-11 rounded-full pr-10 pl-11 text-[15px]')}
        placeholder="Search your knowledge…"
        aria-label="Search the knowledge library"
      />
      {value && (
        <button
          className="absolute top-3.5 right-4 text-muted hover:text-fg"
          aria-label="Clear search"
          onClick={() => pick('')}
        >
          <X size={16} />
        </button>
      )}
      {focus && (
        <div className="absolute top-[calc(100%+8px)] z-30 w-full rounded-2xl bg-card p-1.5 shadow-pop">
          {recent.length > 0 && <div className="px-2.5 py-1 text-[10.5px] text-muted">Recent</div>}
          {recent.map((s) => (
            <button
              key={`r${s}`}
              onMouseDown={() => pick(s)}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[13px] hover:bg-raised"
            >
              <Clock size={13} className="text-muted" />
              {s}
            </button>
          ))}
          <div className="px-2.5 pt-2 pb-1 text-[10.5px] text-muted">Suggestions</div>
          {suggestions.map((s) => (
            <button
              key={s}
              onMouseDown={() => pick(s)}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[13px] hover:bg-raised"
            >
              <Search size={13} className="text-muted" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
