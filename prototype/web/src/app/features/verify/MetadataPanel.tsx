import { useNavigate } from 'react-router'
import { BookOpenText, ExternalLink } from 'lucide-react'
import type { Source } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, Tag, VerifyTag, cn } from '../../ui'

const FIELDS = [
  ['Authors', 'authors'],
  ['Journal', 'journal'],
  ['Publication year', 'year'],
  ['DOI', 'doi'],
  ['Publisher', 'publisher'],
  ['Source URL', 'url'],
] as const

export function MetadataPanel({ src }: { src: Source }) {
  const { citations, updateSource, toast } = useStore()
  const nav = useNavigate()
  const cites = citations.filter((c) => c.sourceId === src.id)
  const commit = (key: (typeof FIELDS)[number][1], label: string, value: string) => {
    if (value === String(src[key])) return
    updateSource(src.id, { [key]: key === 'year' ? Number(value) || src.year : value })
    toast(`${label} updated — re-run check to compare`, 'info')
  }

  return (
    <div className="overflow-auto px-6 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] text-muted">
            {src.id} · {src.title}
          </div>
          <h2 className="mt-1 text-[19px] leading-snug font-semibold">{src.paperTitle}</h2>
        </div>
        <VerifyTag state={src.verify} />
      </div>
      <dl className="mt-5 overflow-hidden rounded-2xl bg-surface-2">
        {FIELDS.map(([label, key]) => (
          <div key={key} className="grid grid-cols-[150px_1fr] items-center gap-3 px-4 py-1.5 text-[13px]">
            <dt className="text-muted">{label}</dt>
            <dd className="flex items-center gap-2">
              <input
                key={src.id + key}
                className={cn(
                  'min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 outline-none hover:bg-raised focus:bg-raised focus:ring-2 focus:ring-signal-ink',
                  (key === 'doi' || key === 'url') && 'font-mono text-xs',
                )}
                defaultValue={String(src[key] ?? '')}
                placeholder="—"
                onBlur={(e) => commit(key, label, e.target.value)}
                aria-label={label}
              />
              {key === 'doi' && src.doi && <Tag mono>sample · not resolvable</Tag>}
            </dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-6 mb-2 text-[13px] font-semibold">Abstract</h3>
      <p className="text-[13px] leading-relaxed text-muted">{src.abstract || 'No abstract available.'}</p>
      {cites.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 text-[13px] font-semibold">Citation records</h3>
          <div className="space-y-1.5">
            {cites.map((c) => (
              <button
                key={c.id}
                onClick={() => nav(`/research?source=${src.id}&page=${c.page}`)}
                className="flex w-full items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-left text-[13px] hover:bg-raised"
              >
                <Tag mono>{c.id}</Tag>
                <span className="flex-1 truncate">“{c.quote}”</span>
                <span className="font-mono text-[11px] text-muted">p.{c.page}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="mt-6 flex gap-2">
        <Button
          icon={BookOpenText}
          disabled={src.status !== 'Completed'}
          onClick={() => nav(`/research?source=${src.id}`)}
        >
          Open in reader
        </Button>
        <Button icon={ExternalLink} disabled>
          Open source URL (unavailable)
        </Button>
      </div>
    </div>
  )
}
