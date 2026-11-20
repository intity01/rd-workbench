import { useNavigate } from 'react-router'
import { RefreshCw, Square, X } from 'lucide-react'
import type { Task } from '../../data/types'
import { fmt } from '../../lib/format'
import { useStore } from '../../state/StoreProvider'
import { Button, IconButton, Progress, StatusTag } from '../../ui'
import { taskTone, usage } from './usage'

export function TaskInspector({
  t,
  onClose,
  onCancel,
}: {
  t: Task
  onClose: () => void
  onCancel: () => void
}) {
  const { projects, sources, retryTask } = useStore()
  const nav = useNavigate()
  const u = usage(t)
  const logs =
    t.kind === 'extract' && t.sourceId ? (sources.find((s) => s.id === t.sourceId)?.logs ?? t.logs) : t.logs
  const facts = [
    ['Execution time', fmt(t.elapsed)],
    ['Started', t.added],
    ['Project', projects.find((p) => p.id === t.projectId)?.name ?? '—'],
    ['Source', sources.find((s) => s.id === t.sourceId)?.title ?? '—'],
  ]
  return (
    <aside
      className="m-2 ml-0 flex w-[360px] shrink-0 flex-col overflow-hidden rounded-2xl bg-surface-2"
      aria-label="Task inspector"
    >
      <div className="flex items-start gap-2 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{t.name}</div>
          <div className="font-mono text-[11px] text-muted">
            {t.id} · {t.worker}
          </div>
        </div>
        <IconButton label="Close inspector" icon={X} solid onClick={onClose} />
      </div>
      <div className="flex-1 space-y-4 overflow-auto px-4 pb-4">
        <div className="flex items-center justify-between">
          <StatusTag status={t.status} />
          <span className="font-mono text-xs">{t.progress}%</span>
        </div>
        <Progress value={t.progress} tone={taskTone(t)} />
        <dl className="grid grid-cols-2 gap-2 text-xs">
          {facts.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-raised px-3 py-2">
              <dt className="text-[10.5px] text-muted">{k}</dt>
              <dd className="mt-0.5 truncate">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-3 rounded-xl bg-raised p-3">
          <div className="text-[11px] font-medium text-muted">Resource usage (simulated)</div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span>CPU</span>
              <span className="font-mono">{u.cpu}%</span>
            </div>
            <Progress value={u.cpu} tone={u.cpu > 65 ? 'warning' : 'fg'} />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span>Memory</span>
              <span className="font-mono">{u.mem} MB</span>
            </div>
            <Progress value={(u.mem / 1024) * 100} tone="fg" />
          </div>
        </div>
        {t.error && (
          <div className="rounded-xl bg-danger px-3 py-2.5 text-xs leading-relaxed text-white">{t.error}</div>
        )}
        <pre className="max-h-56 overflow-auto rounded-xl bg-[#0a0a0b] p-3 font-mono text-[11px] leading-relaxed text-[#b8b8c0]">
          {logs.join('\n')}
        </pre>
      </div>
      <div className="flex gap-2 p-3">
        <Button
          className="flex-1"
          icon={RefreshCw}
          disabled={!(t.status === 'Failed' || t.status === 'Cancelled')}
          onClick={() => retryTask(t.id)}
        >
          Retry
        </Button>
        <Button
          className="flex-1"
          variant="danger"
          icon={Square}
          disabled={!(t.status === 'Running' || t.status === 'Queued')}
          onClick={onCancel}
        >
          Cancel
        </Button>
        {t.sourceId && (
          <Button className="flex-1" onClick={() => nav(`/imports?source=${t.sourceId}`)}>
            Source
          </Button>
        )}
      </div>
    </aside>
  )
}
