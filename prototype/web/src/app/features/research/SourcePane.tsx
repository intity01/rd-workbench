import { useState } from 'react'
import { useNavigate } from 'react-router'
import { FileText, Globe, ListTree, Search, Upload } from 'lucide-react'
import { getPages } from '../../data/documents'
import { useStore } from '../../state/StoreProvider'
import { Button, EmptyState, Segmented, StatusTag, Switch, VerifyTag, cn, field } from '../../ui'

const TYPES = ['All', 'PDF', 'Markdown', 'URL'] as const
type TypeFilter = (typeof TYPES)[number]

export function SourcePane({
  width,
  activeId,
  onOpen,
}: {
  width: number
  activeId?: string
  onOpen: (id: string) => void
}) {
  const { sources, currentProjectId } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [type, setType] = useState<TypeFilter>('All')
  const [all, setAll] = useState(false)
  const list = sources.filter(
    (s) =>
      (all || s.projectId === currentProjectId) &&
      (type === 'All' || s.type === type) &&
      s.title.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <aside style={{ width }} className="flex shrink-0 flex-col">
      <div className="flex h-12 items-center justify-between px-3">
        <span className="text-[13px] font-semibold">Sources</span>
        <Button size="sm" icon={Upload} onClick={() => nav('/imports?import=pdf')}>
          Import
        </Button>
      </div>
      <div className="space-y-2 px-3 pb-3">
        <div className="relative">
          <Search size={13} className="absolute top-2.5 left-3 text-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sources"
            className={field('h-8 rounded-full pl-8 text-[13px]')}
            aria-label="Search sources"
          />
        </div>
        <Segmented
          full
          size="sm"
          label="Source type"
          value={type}
          onChange={setType}
          options={TYPES.map((t) => ({ value: t, label: t === 'Markdown' ? 'MD' : t }))}
        />
        <div className="flex items-center justify-between text-[11.5px] text-muted">
          All projects
          <Switch label="Show all projects" checked={all} onChange={setAll} />
        </div>
      </div>
      <div className="flex-1 overflow-auto px-2 pb-2">
        {list.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No sources"
            body={q ? 'No source matches your search.' : 'Import a document to get started.'}
          />
        )}
        {list.map((s) => {
          const Icon = s.type === 'URL' ? Globe : s.type === 'Markdown' ? ListTree : FileText
          const on = s.id === activeId
          return (
            <button
              key={s.id}
              onClick={() => onOpen(s.id)}
              aria-current={on}
              className={cn(
                'mb-0.5 block w-full rounded-xl px-2.5 py-2 text-left',
                on ? 'bg-raised' : 'hover:bg-raised/60',
              )}
            >
              <div className="flex items-center gap-2">
                <Icon size={14} className={on ? 'text-fg' : 'text-muted'} aria-hidden />
                <span className="flex-1 truncate text-[13px]">{s.title}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5 pl-[22px]">
                {s.status !== 'Completed' ? (
                  <StatusTag status={s.status} label={s.status === 'Running' ? `${s.progress}%` : s.status} />
                ) : (
                  <span className="font-mono text-[10px] text-muted">{getPages(s).length} pp</span>
                )}
                {s.verify !== 'Not Checked' && <VerifyTag state={s.verify} short />}
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
