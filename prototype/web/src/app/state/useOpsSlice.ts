import { useState } from 'react'
import { TASKS } from '../data/tasks'
import { VERIFICATIONS } from '../data/verifications'
import type { Source, Task, Verification, VerifyState } from '../data/types'
import { stamp } from '../lib/format'
import type { LibrarySlice } from './useLibrarySlice'
import type { UiSlice } from './useUiSlice'

const PROVIDERS = ['OpenAlex', 'Crossref', 'Semantic Scholar'] as const

/** Deterministic, offline stand-in for a provider lookup. */
function simulatedRecord(s: Source, result: VerifyState): Verification {
  const has = !!s.doi
  const st = (ok: Verification['checks'][number]['state']) => (has ? ok : 'Not Checked')
  return {
    sourceId: s.id,
    checks: [
      {
        label: 'DOI Resolution',
        state: st('Found'),
        detail: has ? 'Sample DOI resolved in simulated lookup' : 'No DOI on record',
      },
      {
        label: 'Title Match',
        state: st('Matched'),
        detail: has ? 'Title matched' : 'Needs DOI or manual metadata',
      },
      { label: 'Author Match', state: st('Needs Review'), detail: 'Authors not yet detected from file' },
      { label: 'Publication Year Match', state: st('Matched'), detail: String(s.year) },
      { label: 'Metadata Availability', state: st('Needs Review'), detail: 'Partial metadata' },
      { label: 'Full-text Availability', state: 'Not Checked', detail: 'Not checked in prototype' },
    ],
    providers: PROVIDERS.map((name) => ({
      name,
      title: has ? s.paperTitle : '—',
      year: has ? String(s.year) : '—',
      authors: has ? s.authors : '—',
      state: has ? 'Needs Review' : 'Not Checked',
    })),
    history: [
      {
        at: stamp(),
        result,
        note: has ? 'Simulated lookup — authors need review' : 'No DOI — lookup skipped',
      },
    ],
  }
}

/** Background jobs and citation verification. */
export function useOpsSlice(ui: UiSlice, lib: LibrarySlice) {
  const [tasks, setTasks] = useState<Task[]>(TASKS)
  const [verifications, setVerifications] = useState<Verification[]>(VERIFICATIONS)
  const [verifying, setVerifying] = useState<string | null>(null)

  const runVerification = (sourceId: string) => {
    const s = lib.sources.find((x) => x.id === sourceId)
    if (!s) return
    setVerifying(sourceId)
    setTimeout(() => {
      const existing = verifications.find((v) => v.sourceId === sourceId)
      const result: VerifyState = existing ? s.verify : s.doi ? 'Needs Review' : 'Not Checked'
      const rec = existing
        ? {
            ...existing,
            history: [
              { at: stamp(), result, note: 'Re-ran simulated lookup — no change' },
              ...existing.history,
            ],
          }
        : simulatedRecord(s, result)
      setVerifications((vs) => [...vs.filter((v) => v.sourceId !== sourceId), rec])
      lib.updateSource(sourceId, { verify: result })
      setVerifying(null)
      ui.toast(`Simulated check finished: ${result}`, result === 'Not Checked' ? 'info' : 'success')
      ui.logActivity(`Checked metadata for ${s.title}`, `/verify?source=${sourceId}`)
    }, 1400)
  }

  const markReviewed = (sourceId: string) => {
    setVerifications((vs) =>
      vs.map((v) =>
        v.sourceId !== sourceId
          ? v
          : {
              ...v,
              checks: v.checks.map((c) =>
                c.state === 'Needs Review'
                  ? { ...c, state: 'Matched', detail: `${c.detail} · reviewed manually` }
                  : c,
              ),
              history: [{ at: stamp(), result: 'Matched', note: 'Marked as reviewed by you' }, ...v.history],
            },
      ),
    )
    lib.updateSource(sourceId, { verify: 'Matched' })
    ui.toast('Marked as reviewed')
  }

  return { tasks, setTasks, verifications, verifying, runVerification, markReviewed }
}

export type OpsSlice = ReturnType<typeof useOpsSlice>
