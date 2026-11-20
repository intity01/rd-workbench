import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { FileSearch, SearchX } from 'lucide-react'
import { RESULT_TYPES, buildIndex, search, tokenize, type ResultType } from '../../lib/search'
import { useStore } from '../../state/StoreProvider'
import { Button, EmptyState, Mark, Tag, cn } from '../../ui'
import { LibraryFilters, type Sort } from './LibraryFilters'
import { ResultPreview } from './ResultPreview'
import { SearchBox } from './SearchBox'

const EXAMPLE = 'zero-copy IPC for Python and Rust'

export function LibraryPage() {
  const store = useStore()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const direct = params.get('note') || params.get('exp')
  const [q, setQ] = useState(params.get('q') ?? (direct ? '' : EXAMPLE))
  const [types, setTypes] = useState<ResultType[]>([])
  const [scope, setScope] = useState(params.get('scope') ?? 'all')
  const [sort, setSort] = useState<Sort>('relevance')
  const [sel, setSel] = useState<string | null>(null)
  const [recent, setRecent] = useState<string[]>(['process isolation'])
  const inputRef = useRef<HTMLInputElement>(null)
  const index = useMemo(() => buildIndex(store), [store])

  useEffect(() => {
    const s = params.get('scope')
    if (!s) return
    setScope(s)
    inputRef.current?.focus()
  }, [params])

  // One hit per document page, then project scope, then type filters.
  const scoped = useMemo(() => {
    const seen = new Set<string>()
    return search(index, q).filter((r) => {
      const k = r.item.type === 'Document' ? `${r.item.refId}-${r.item.page}` : r.item.key
      if (seen.has(k) || (scope !== 'all' && r.item.projectId !== scope)) return false
      seen.add(k)
      return true
    })
  }, [index, q, scope])
  const counts = Object.fromEntries(
    RESULT_TYPES.map((t) => [t, scoped.filter((r) => r.item.type === t).length]),
  ) as Record<ResultType, number>
  const results = scoped
    .filter((r) => !types.length || types.includes(r.item.type))
    .sort((a, b) => (sort === 'date' ? b.item.date.localeCompare(a.item.date) : b.score - a.score))
  const toks = tokenize(q)
  const directItem = direct ? index.find((i) => i.refId === direct) : undefined
  const active =
    (sel ? results.find((r) => r.item.key === sel)?.item : undefined) ?? directItem ?? results[0]?.item
  const filtersOn = types.length > 0 || scope !== 'all' || sort !== 'relevance'
  const clearAll = () => {
    setTypes([])
    setScope('all')
    setSort('relevance')
  }
  const submit = (v: string) => {
    setQ(v)
    setSel(null)
    if (v.trim()) setRecent((r) => [v, ...r.filter((x) => x !== v)].slice(0, 5))
    setParams(v ? { q: v } : {}, { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-[24px] font-semibold tracking-tight">Knowledge Library</h1>
        <p className="mt-1 mb-4 text-[13px] text-muted">
          Search projects, documents, notes, claims, evidence, questions, citations and experiments.
        </p>
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v)
            setSel(null)
          }}
          onSubmit={submit}
          recent={recent}
          inputRef={inputRef}
        />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_380px] gap-2 px-2 pb-2">
        <LibraryFilters
          types={types}
          setTypes={setTypes}
          counts={counts}
          scope={scope}
          setScope={setScope}
          sort={sort}
          setSort={setSort}
          projects={store.projects}
          filtersOn={filtersOn}
          clearAll={clearAll}
        />
        <section className="overflow-auto rounded-2xl bg-surface-2">
          <div className="flex h-10 items-center px-5 text-xs text-muted">
            {q.trim() ? (
              <>
                {results.length} result{results.length === 1 ? '' : 's'} for{' '}
                <span className="ml-1 font-medium text-fg">“{q}”</span>
              </>
            ) : (
              'Type a query or choose a suggestion'
            )}
          </div>
          {!q.trim() && !directItem ? (
            <EmptyState
              icon={FileSearch}
              title="Search your research"
              body={`Try “${EXAMPLE}”.`}
              action={<Button onClick={() => submit(EXAMPLE)}>Run example query</Button>}
            />
          ) : q.trim() && results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No results"
              body={
                filtersOn
                  ? 'Filters may be hiding results.'
                  : 'Try fewer or different words. Queued and failed sources are not searchable.'
              }
              action={filtersOn ? <Button onClick={clearAll}>Clear all filters</Button> : undefined}
            />
          ) : (
            <ul className="px-2 pb-2">
              {results.map((r) => (
                <li key={r.item.key}>
                  <button
                    onClick={() => setSel(r.item.key)}
                    onDoubleClick={() => nav(r.item.to)}
                    className={cn(
                      'block w-full rounded-xl px-3 py-3 text-left',
                      active?.key === r.item.key ? 'bg-raised' : 'hover:bg-raised/60',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Tag mono>{r.item.type}</Tag>
                      <span className="truncate text-[13px] font-semibold">
                        <Mark text={r.item.title} terms={toks} />
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                      <Mark text={r.snippet} terms={toks} />
                    </p>
                    <div className="mt-1.5 flex gap-3 font-mono text-[10.5px] text-muted">
                      {r.item.page && <span>p.{r.item.page}</span>}
                      <span>{store.projects.find((p) => p.id === r.item.projectId)?.name}</span>
                      <span>{r.item.date}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="overflow-auto rounded-2xl bg-surface-2">
          <ResultPreview item={active} terms={toks} onDeleted={() => setParams({})} />
        </aside>
      </div>
    </div>
  )
}
