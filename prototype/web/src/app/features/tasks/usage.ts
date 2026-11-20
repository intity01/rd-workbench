import type { Task } from '../../data/types'

/** Deterministic pseudo resource usage — illustrative only, never read from hardware. */
export function usage(t: Task) {
  const seed = t.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  if (t.status !== 'Running') return { cpu: 0, mem: t.status === 'Completed' ? 0 : 64 + (seed % 40) }
  return { cpu: 30 + ((seed + t.elapsed * 7) % 45), mem: 280 + ((seed * 3 + t.elapsed * 11) % 220) }
}

export type TaskTab = 'Active' | 'Queued' | 'Completed' | 'Failed'
export const TASK_TABS: TaskTab[] = ['Active', 'Queued', 'Completed', 'Failed']

export const inTab = (t: Task, tab: TaskTab) =>
  tab === 'Active'
    ? t.status === 'Running'
    : tab === 'Queued'
      ? t.status === 'Queued'
      : tab === 'Completed'
        ? t.status === 'Completed'
        : t.status === 'Failed' || t.status === 'Cancelled'

export const taskTone = (t: Task) =>
  t.status === 'Failed' ? 'danger' : t.status === 'Completed' ? 'success' : 'signal'
