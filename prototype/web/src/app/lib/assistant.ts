import { getPages } from '../data/documents'
import type { Message, Source } from '../data/types'

export type Answer = Omit<Message, 'id'>

/** Deterministic mock answers keyed on the question. Not a real model. */
export function mockAnswer(q: string, src: Source | undefined, page: number, scope: string): Answer {
  const l = q.toLowerCase()
  const a = (text: string, sourceId: string, p: number): Answer => ({
    role: 'assistant',
    text,
    citations: [{ sourceId, page: p }],
    scope,
  })
  if (/separat|rust core|worker|responsive/.test(l))
    return a(
      'Process separation helps keep the desktop interface responsive while computationally intensive document extraction runs independently. It also makes it possible to restart or replace document workers without restarting the entire application.',
      'SRC-001',
      4,
    )
  if (/zero-copy|ipc|shared memory|transfer/.test(l))
    return a(
      'The source describes zero-copy IPC as letting the Python worker write extracted buffers into shared memory that the Rust core reads directly, so large page rasters are not serialised twice. Equation (1) frames transfer cost as latency plus payload over bandwidth; the paper gives no measured numbers.',
      'SRC-001',
      3,
    )
  if (/ocr|scan|equation|math|adaptive/.test(l))
    return a(
      'The discussion notes that scanned mathematical documents remain difficult and suggests adaptive processing: choose OCR and equation passes per page instead of applying them to every document.',
      'SRC-001',
      5,
    )
  const pages = src ? getPages(src) : []
  const first = pages[Math.min(page, pages.length) - 1]?.find((b) => b.k === 'p')
  if (!src || !first || first.k !== 'p')
    return {
      role: 'assistant',
      text: 'I could not find relevant passages in the selected scope. Try widening the research scope to all project sources.',
      citations: [],
      scope,
    }
  const excerpt = first.text.length > 180 ? `${first.text.slice(0, 180)}…` : first.text
  return a(
    `Within the selected scope, the closest passage is on page ${page}: “${excerpt}” The sources do not directly answer more than this; consider importing additional material.`,
    src.id,
    page,
  )
}

export type SelectionAction = 'Explain' | 'Summarize' | 'Compare' | 'Support' | 'Contradict'

export const SELECTION_LABELS: Record<SelectionAction, string> = {
  Explain: 'Explain selection',
  Summarize: 'Summarize',
  Compare: 'Compare with other sources',
  Support: 'Find supporting evidence',
  Contradict: 'Find contradictions',
}

/** Mock responses for the reader's selection menu. */
export function selectionAnswer(
  kind: SelectionAction,
  quote: string,
  sourceId: string,
  page: number,
  scope: string,
): Answer {
  const cite = [{ sourceId, page }]
  switch (kind) {
    case 'Explain':
      return {
        role: 'assistant',
        text: `In plain terms: the passage “${quote}” argues for a clear boundary between the interactive part of the application and heavy background processing, so that one cannot stall the other.`,
        citations: cite,
        scope,
      }
    case 'Summarize':
      return {
        role: 'assistant',
        text: `Summary: ${quote.split(/[.,;]/)[0]}. The surrounding section ties this to responsiveness and recoverability.`,
        citations: cite,
        scope,
      }
    case 'Compare':
      return {
        role: 'assistant',
        text: 'Compared with Local-AI-Research.pdf, both sources favour keeping heavy computation out of the interactive process; the local AI source focuses on model privacy rather than UI responsiveness.',
        citations: [...cite, { sourceId: 'SRC-002', page: 2 }],
        scope: 'Project sources · 2 compared',
      }
    case 'Support':
      return {
        role: 'assistant',
        text: 'Supporting evidence found in one other processed source: the forced alignment survey also recommends adaptive, per-segment processing. No further support was found in the current scope.',
        citations: [...cite, { sourceId: 'SRC-006', page: 2 }],
        scope: 'Project sources',
      }
    case 'Contradict':
      return {
        role: 'assistant',
        text: 'Potential tension: the Discussion section notes that separation adds operational complexity (supervision, versioning, resource limits). No direct contradiction was found in other processed sources.',
        citations: [{ sourceId: 'SRC-001', page: 5 }],
        scope: 'Project sources',
      }
  }
}
