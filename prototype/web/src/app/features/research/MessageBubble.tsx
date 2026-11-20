import type { Message } from '../../data/types'
import { useStore } from '../../state/StoreProvider'

/** One chat turn. Citations render as solid chips that open the cited page. */
export function MessageBubble({
  m,
  onCite,
}: {
  m: Message
  onCite: (sourceId: string, page: number) => void
}) {
  const { sources } = useStore()
  if (m.role === 'system') return <p className="text-center text-[11px] text-muted">{m.text}</p>
  if (m.role === 'user')
    return (
      <div className="ml-8 rounded-2xl rounded-br-md bg-raised px-3.5 py-2.5 text-[13px] leading-relaxed">
        {m.text}
      </div>
    )
  const n = m.citations?.length ?? 0
  return (
    <div className="rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-3">
      <p className="text-[13px] leading-relaxed">
        {m.text}
        {m.citations?.map((_, i) => (
          <sup key={i} className="ml-0.5 font-mono text-[10px] font-semibold text-signal-ink">
            [{i + 1}]
          </sup>
        ))}
      </p>
      {n > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {m.citations!.map((c, i) => (
            <button
              key={i}
              onClick={() => onCite(c.sourceId, c.page)}
              aria-label={`Open citation ${i + 1}`}
              className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full bg-raised pr-3 pl-1 text-[11.5px] hover:bg-hover"
            >
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-signal px-1 font-mono text-[10px] font-semibold text-on-signal">
                {i + 1}
              </span>
              <span className="truncate">
                {sources.find((x) => x.id === c.sourceId)?.title ?? c.sourceId}
              </span>
              <span className="font-mono text-muted">p.{c.page}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-2.5 text-[10.5px] text-muted">
        Evidence scope: {m.scope ?? 'Unknown'} · {n} citation{n === 1 ? '' : 's'}
      </div>
    </div>
  )
}
