import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { CircleDashed, Upload } from 'lucide-react'
import type { Source } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { EmptyState, IconTile, PageHeader, Segmented, cn } from '../../ui'
import { ImportDialog } from './ImportDialog'
import { METHODS, type Method } from './methods'
import { ProcessingDrawer } from './ProcessingDrawer'
import { QueueTable } from './QueueTable'

type Filter = 'All' | 'Active' | 'Completed' | 'Failed'
const FILTERS: Record<Filter, (s: Source) => boolean> = {
  All: () => true,
  Active: (s) => s.status === 'Running' || s.status === 'Queued',
  Completed: (s) => s.status === 'Completed',
  Failed: (s) => s.status === 'Failed' || s.status === 'Cancelled',
}

export function ImportsPage() {
  const { sources, projects, currentProjectId, addSource, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('All')
  const [dragOver, setDragOver] = useState(false)
  const method = params.get('import') as Method | null
  const selected = sources.find((s) => s.id === params.get('source'))
  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p)
  }
  const rows = sources.filter(FILTERS[filter])

  const onDrop = (files: FileList) => {
    const pid = currentProjectId || projects[0]?.id
    if (!pid) return toast('Create a project first', 'error')
    Array.from(files).forEach((f) =>
      addSource({
        title: f.name,
        type: f.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document',
        projectId: pid,
      }),
    )
    toast(
      `${files.length} file${files.length > 1 ? 's' : ''} queued — names only; contents are not read in this prototype`,
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <PageHeader
          title="Import & Processing"
          subtitle="Add sources, then follow each one through validation, extraction and indexing."
        />
        <div className="grid grid-cols-[repeat(5,1fr)_1.3fr] gap-3 px-6">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setParam('import', m.id)}
              className="flex flex-col items-start rounded-2xl bg-surface-2 p-3.5 text-left hover:bg-raised"
            >
              <IconTile icon={m.icon} color={m.color} size={32} />
              <span className="mt-3 text-[13px] font-semibold">{m.label}</span>
              <span className="text-[11px] text-muted">{m.hint}</span>
            </button>
          ))}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              onDrop(e.dataTransfer.files)
            }}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl p-3 text-center text-[12px] transition-colors',
              dragOver ? 'bg-signal text-on-signal' : 'bg-raised text-muted',
            )}
          >
            <Upload size={18} aria-hidden />
            <span className="mt-1.5 font-medium">Drop files here</span>
            <span className="text-[10.5px]">
              into {projects.find((p) => p.id === currentProjectId)?.name ?? 'current project'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 pt-7 pb-3">
          <h2 className="text-[15px] font-semibold">Processing Queue</h2>
          <Segmented
            label="Filter"
            value={filter}
            onChange={setFilter}
            options={(Object.keys(FILTERS) as Filter[]).map((v) => ({ value: v, label: v }))}
          />
        </div>
        <div className="mx-6 mb-6 overflow-hidden rounded-2xl bg-surface-2">
          {rows.length === 0 ? (
            <EmptyState icon={CircleDashed} title="Nothing here" body="No sources match this filter." />
          ) : (
            <QueueTable rows={rows} selectedId={selected?.id} onSelect={(id) => setParam('source', id)} />
          )}
        </div>
      </div>
      {selected && <ProcessingDrawer s={selected} onClose={() => setParam('source', null)} />}
      {method && (
        <ImportDialog
          method={method}
          onClose={() => setParam('import', null)}
          onAdded={(id) => setParams({ source: id })}
        />
      )}
    </div>
  )
}
