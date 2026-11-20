import { useEffect, useRef } from 'react'
import { STAGES, stageOf } from '../data/meta'
import type { Source, Task } from '../data/types'
import { fmt } from '../lib/format'
import type { LibrarySlice } from './useLibrarySlice'
import type { OpsSlice } from './useOpsSlice'
import type { UiSlice } from './useUiSlice'

const TICK_MS = 1000

function advanceSources(list: Source[]) {
  const completed: Source[] = []
  let next = list.map((s) => {
    if (s.status !== 'Running') return s
    const progress = Math.min(100, s.progress + (s.type === 'PDF' ? 4 : 10))
    const stage = stageOf(progress)
    const changed = stage !== stageOf(s.progress) && progress < 100
    const logs = changed ? [...s.logs, `[${fmt(s.elapsed)}] ${STAGES[stage]} started`] : s.logs
    if (progress < 100) return { ...s, progress, elapsed: s.elapsed + 1, logs }
    const done: Source = {
      ...s,
      progress: 100,
      status: 'Completed',
      elapsed: s.elapsed + 1,
      logs: [...logs, `[${fmt(s.elapsed)}] Indexed — ready to read`],
    }
    completed.push(done)
    return done
  })
  // One extraction worker: start the next queued source when idle.
  if (!next.some((s) => s.status === 'Running')) {
    const q = next.find((s) => s.status === 'Queued')
    if (q)
      next = next.map((s) =>
        s.id === q.id
          ? {
              ...s,
              status: 'Running',
              logs: [...s.logs, '[00:00] Worker assigned — File Validation started'],
            }
          : s,
      )
  }
  return { next, completed }
}

function advanceTasks(list: Task[], sources: Source[]) {
  let next = list.map((t): Task => {
    // Extraction jobs mirror their source; other jobs progress on their own.
    if (t.kind === 'extract' && t.sourceId) {
      const s = sources.find((x) => x.id === t.sourceId)
      if (!s || (t.status === 'Cancelled' && s.status === 'Cancelled')) return t
      return { ...t, status: s.status, progress: s.progress, elapsed: s.elapsed, error: s.error }
    }
    if (t.status !== 'Running') return t
    const progress = Math.min(100, t.progress + 3)
    if (progress < 100) return { ...t, progress, elapsed: t.elapsed + 1 }
    return { ...t, progress, status: 'Completed', elapsed: t.elapsed + 1, logs: [...t.logs, 'Job completed'] }
  })
  if (!next.some((t) => t.kind === 'job' && t.status === 'Running')) {
    const q = next.find((t) => t.kind === 'job' && t.status === 'Queued')
    if (q)
      next = next.map((t) =>
        t.id === q.id ? { ...t, status: 'Running', logs: [...t.logs, 'Worker slot acquired'] } : t,
      )
  }
  return next
}

/** Deterministic simulation of the document worker pipeline (no real processing). */
export function useProcessingSim(ui: UiSlice, lib: LibrarySlice, ops: OpsSlice) {
  const live = useRef({ sources: lib.sources, tasks: ops.tasks })
  live.current = { sources: lib.sources, tasks: ops.tasks }
  const { setSources } = lib
  const { setTasks } = ops
  const { notify, logActivity } = ui

  useEffect(() => {
    const iv = setInterval(() => {
      const { next, completed } = advanceSources(live.current.sources)
      setSources(next)
      setTasks(advanceTasks(live.current.tasks, next))
      completed.forEach((s) => {
        notify(`${s.title} is processed and indexed`, `/research?source=${s.id}`, 'success')
        logActivity(
          `Processed ${s.title}`,
          `/research?source=${s.id}`,
          'All 7 processing stages completed (simulated).',
        )
      })
    }, TICK_MS)
    return () => clearInterval(iv)
  }, [setSources, setTasks, notify, logActivity])
}
