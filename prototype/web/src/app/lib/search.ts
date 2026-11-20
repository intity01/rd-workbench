import { getPages, type Block } from '../data/documents'
import type { Citation, Experiment, GNode, Note, Project, Source } from '../data/types'

/** Everything the index needs; the app store satisfies this structurally. */
export interface IndexInput {
  projects: Project[]
  sources: Source[]
  notes: Note[]
  nodes: GNode[]
  citations: Citation[]
  experiments: Experiment[]
}

export type ResultType =
  | 'Project'
  | 'Document'
  | 'Note'
  | 'Claim'
  | 'Evidence'
  | 'Question'
  | 'Citation'
  | 'Experiment'
export const RESULT_TYPES: ResultType[] = [
  'Project',
  'Document',
  'Note',
  'Claim',
  'Evidence',
  'Question',
  'Citation',
  'Experiment',
]

export interface Item {
  key: string
  type: ResultType
  title: string
  text: string
  projectId: string
  date: string
  page?: number
  to: string
  refId: string
}

const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'how', 'are', 'into'])
export const tokenize = (q: string) =>
  q
    .toLowerCase()
    .split(/[^\p{L}\p{N}-]+/u)
    .filter((t) => t.length > 1 && !STOP.has(t))

const blockText = (b: Block) =>
  b.k === 'p' || b.k === 'h'
    ? b.text
    : b.k === 'eq'
      ? b.text
      : b.k === 'table'
        ? `${b.caption} ${b.rows.flat().join(' ')}`
        : b.k === 'refs'
          ? b.items.join(' ')
          : b.k === 'title'
            ? `${b.text} ${b.sub}`
            : ''

export function buildIndex(s: IndexInput): Item[] {
  const items: Item[] = []
  s.projects.forEach((p) =>
    items.push({
      key: p.id,
      type: 'Project',
      title: p.name,
      text: `${p.description} ${p.question} ${p.tags.join(' ')}`,
      projectId: p.id,
      date: p.updated,
      to: `/projects/${p.id}`,
      refId: p.id,
    }),
  )
  s.sources.forEach((src) => {
    if (src.status !== 'Completed') return // only processed sources are indexed
    getPages(src).forEach((blocks, i) =>
      blocks.forEach((b, j) => {
        const text = blockText(b)
        if (text.length < 20) return
        items.push({
          key: `${src.id}-${i}-${j}`,
          type: 'Document',
          title: src.title,
          text,
          projectId: src.projectId,
          date: src.added,
          page: i + 1,
          to: `/research?source=${src.id}&page=${i + 1}`,
          refId: src.id,
        })
      }),
    )
  })
  s.notes.forEach((n) =>
    items.push({
      key: n.id,
      type: 'Note',
      title: n.title,
      text: `${n.body} ${n.tags.join(' ')}`,
      projectId: n.projectId,
      date: n.updated,
      page: n.page,
      to: `/library?note=${n.id}`,
      refId: n.id,
    }),
  )
  s.nodes.forEach((n) => {
    const type: ResultType | null =
      n.type === 'claim' || n.type === 'decision'
        ? 'Claim'
        : n.type === 'evidence' || n.type === 'counter'
          ? 'Evidence'
          : n.type === 'question'
            ? 'Question'
            : null
    if (type)
      items.push({
        key: n.id,
        type,
        title: n.label,
        text: n.desc,
        projectId: n.projectId,
        date: '2025-06-12',
        page: n.page,
        to: `/map?node=${n.id}`,
        refId: n.id,
      })
  })
  s.citations.forEach((c) => {
    const src = s.sources.find((x) => x.id === c.sourceId)
    if (src)
      items.push({
        key: c.id,
        type: 'Citation',
        title: `${src.paperTitle}`,
        text: `${c.quote} ${src.authors} ${src.doi}`,
        projectId: src.projectId,
        date: src.added,
        page: c.page,
        to: `/verify?source=${src.id}`,
        refId: c.id,
      })
  })
  s.experiments.forEach((x) =>
    items.push({
      key: x.id,
      type: 'Experiment',
      title: x.title,
      text: x.body,
      projectId: x.projectId,
      date: x.date,
      to: `/library?exp=${x.id}`,
      refId: x.id,
    }),
  )
  return items
}

export function search(items: Item[], q: string) {
  const toks = tokenize(q)
  if (!toks.length) return [] as { item: Item; score: number; snippet: string }[]
  const out: { item: Item; score: number; snippet: string }[] = []
  for (const item of items) {
    const t = item.title.toLowerCase()
    const x = item.text.toLowerCase()
    let score = 0
    for (const k of toks) {
      if (t.includes(k)) score += 3
      if (x.includes(k)) score += 2
    }
    if (x.includes(q.toLowerCase())) score += 6
    if (score < Math.min(4, toks.length * 2)) continue
    out.push({ item, score, snippet: snippet(item.text, toks) })
  }
  return out.sort((a, b) => b.score - a.score)
}

function snippet(text: string, toks: string[]) {
  const lower = text.toLowerCase()
  const idx = Math.min(...toks.map((k) => lower.indexOf(k)).filter((i) => i >= 0), Infinity)
  if (!isFinite(idx) || text.length <= 180) return text
  const start = Math.max(0, idx - 60)
  return `${start > 0 ? '…' : ''}${text.slice(start, start + 180)}${start + 180 < text.length ? '…' : ''}`
}
