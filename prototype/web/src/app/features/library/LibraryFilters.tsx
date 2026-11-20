import type { Project } from '../../data/types'
import { RESULT_TYPES, type ResultType } from '../../lib/search'
import { Segmented, field } from '../../ui'

export type Sort = 'relevance' | 'date'

type Props = {
  types: ResultType[]
  setTypes: (fn: (t: ResultType[]) => ResultType[]) => void
  counts: Record<ResultType, number>
  scope: string
  setScope: (s: string) => void
  sort: Sort
  setSort: (s: Sort) => void
  projects: Project[]
  filtersOn: boolean
  clearAll: () => void
}

export function LibraryFilters({
  types,
  setTypes,
  counts,
  scope,
  setScope,
  sort,
  setSort,
  projects,
  filtersOn,
  clearAll,
}: Props) {
  const toggle = (t: ResultType) => setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))
  return (
    <aside className="overflow-auto p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted">Content type</span>
        {filtersOn && (
          <button
            onClick={clearAll}
            className="text-[11px] font-medium text-fg underline decoration-signal-ink decoration-2 underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {RESULT_TYPES.map((t) => (
          <label
            key={t}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-[13px] hover:bg-raised"
          >
            <input
              type="checkbox"
              className="accent-[var(--signal-ink)]"
              checked={types.includes(t)}
              onChange={() => toggle(t)}
            />
            <span className="flex-1">{t}</span>
            <span className="font-mono text-[10.5px] text-muted">{counts[t]}</span>
          </label>
        ))}
      </div>
      <div className="mt-5 mb-2 text-[11px] font-medium text-muted">Project scope</div>
      <select
        className={field('h-8 text-[13px]')}
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        aria-label="Project scope"
      >
        <option value="all">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="mt-5 mb-2 text-[11px] font-medium text-muted">Sort</div>
      <Segmented
        full
        label="Sort"
        value={sort}
        onChange={setSort}
        options={[
          { value: 'relevance', label: 'Relevance' },
          { value: 'date', label: 'Date' },
        ]}
      />
      <p className="mt-6 text-[10.5px] leading-relaxed text-muted">
        Only fully processed sources are indexed. Lexical matching in this prototype.
      </p>
    </aside>
  )
}
