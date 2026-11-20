import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { ListChecks, RefreshCw, Square } from 'lucide-react'
import type { Task } from '../../data/types'
import { fmt } from '../../lib/format'
import { useStore } from '../../state/StoreProvider'
import { EmptyState, IconButton, PageHeader, Progress, Segmented, StatusTag, cn } from '../../ui'
import { TaskInspector } from './TaskInspector'
import { TASK_TABS, inTab, taskTone, usage, type TaskTab } from './usage'

export function TasksPage() {
  const { tasks, sources, retryTask, cancelTask, confirm } = useStore()
  const [params, setParams] = useSearchParams()
  const sel = tasks.find((t) => t.id === params.get('task'))
  const [tab, setTab] = useState<TaskTab>(() =>
    sel ? (TASK_TABS.find((x) => inTab(sel, x)) ?? 'Active') : 'Active',
  )
  const rows = tasks.filter((t) => inTab(t, tab))
  const cancel = (t: Task) =>
    confirm({
      title: 'Cancel job?',
      body: `${t.name} (${t.worker}) will be stopped.`,
      confirmLabel: 'Cancel job',
      onConfirm: () => cancelTask(t.id),
    })

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          title="Tasks & Workflows"
          subtitle="Background jobs across the Rust Core, Python workers, local AI and exporters."
        />
        <div className="flex items-center justify-between px-6 pb-3">
          <Segmented
            label="Task status"
            value={tab}
            onChange={setTab}
            options={TASK_TABS.map((x) => ({
              value: x,
              label: `${x} · ${tasks.filter((t) => inTab(t, x)).length}`,
            }))}
          />
          <span className="text-[11px] text-muted">
            Resource figures are simulated, not hardware readings.
          </span>
        </div>
        <div className="flex-1 overflow-auto px-6 pb-6">
          {rows.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title={`No ${tab.toLowerCase()} jobs`}
              body="Jobs appear here as sources are imported and processed."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl bg-surface-2">
              <table className="w-full text-[13px]">
                <thead className="text-left text-[11px] text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Job</th>
                    <th className="font-medium">Worker</th>
                    <th className="font-medium">Status</th>
                    <th className="w-32 font-medium">Progress</th>
                    <th className="font-medium">Time</th>
                    <th className="font-medium">CPU / Mem</th>
                    <th className="pr-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const u = usage(t)
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setParams({ task: t.id })}
                        className={cn(
                          'cursor-pointer border-t border-line',
                          sel?.id === t.id ? 'bg-raised' : 'hover:bg-raised/60',
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{t.name}</div>
                          <div className="font-mono text-[11px] text-muted">
                            {t.id}
                            {t.sourceId
                              ? ` · ${sources.find((s) => s.id === t.sourceId)?.title ?? t.sourceId}`
                              : ''}
                          </div>
                        </td>
                        <td className="text-muted">{t.worker}</td>
                        <td>
                          <StatusTag status={t.status} />
                        </td>
                        <td className="pr-4">
                          <Progress value={t.progress} tone={taskTone(t)} />
                        </td>
                        <td className="font-mono text-xs">{fmt(t.elapsed)}</td>
                        <td className="font-mono text-xs text-muted">
                          {u.cpu}% · {u.mem} MB
                        </td>
                        <td className="pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {(t.status === 'Failed' || t.status === 'Cancelled') && (
                            <IconButton label="Retry job" icon={RefreshCw} onClick={() => retryTask(t.id)} />
                          )}
                          {(t.status === 'Running' || t.status === 'Queued') && (
                            <IconButton label="Cancel job" icon={Square} onClick={() => cancel(t)} />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {sel && <TaskInspector t={sel} onClose={() => setParams({})} onCancel={() => cancel(sel)} />}
    </div>
  )
}
