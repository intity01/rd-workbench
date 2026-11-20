import { useNavigate } from 'react-router'
import { BookOpenText, RefreshCw, ShieldCheck, Square, Trash2 } from 'lucide-react'
import { STAGES, stageOf } from '../../data/meta'
import type { Source } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { IconButton, Progress, StatusTag, cn } from '../../ui'

const stageLabel = (s: Source) =>
  s.status === 'Completed' ? 'Indexed' : s.status === 'Queued' ? 'Waiting' : STAGES[stageOf(s.progress)]
const tone = (s: Source) =>
  s.status === 'Failed'
    ? 'danger'
    : s.status === 'Completed'
      ? 'success'
      : s.status === 'Cancelled'
        ? 'warning'
        : 'signal'

export function QueueTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: Source[]
  selectedId?: string
  onSelect: (id: string | null) => void
}) {
  const { projects, retrySource, cancelSource, deleteSource, confirm } = useStore()
  const nav = useNavigate()
  const cancel = (s: Source) =>
    confirm({
      title: 'Cancel processing?',
      body: `${s.title} will stop at ${STAGES[stageOf(s.progress)]}. You can retry later.`,
      confirmLabel: 'Cancel processing',
      onConfirm: () => cancelSource(s.id),
    })
  const remove = (s: Source) =>
    confirm({
      title: 'Remove source?',
      body: `${s.title} will be removed from the project and search index in this session.`,
      confirmLabel: 'Remove',
      onConfirm: () => {
        deleteSource(s.id)
        onSelect(null)
      },
    })

  return (
    <table className="w-full text-[13px]">
      <thead className="text-left text-[11px] text-muted">
        <tr>
          <th className="px-4 py-2.5 font-medium">Source</th>
          <th className="font-medium">Type</th>
          <th className="font-medium">Date Added</th>
          <th className="font-medium">Processing Stage</th>
          <th className="w-32 font-medium">Progress</th>
          <th className="font-medium">Status</th>
          <th className="pr-4 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              'cursor-pointer border-t border-line',
              selectedId === s.id ? 'bg-raised' : 'hover:bg-raised/60',
            )}
          >
            <td className="px-4 py-2.5">
              <div className="font-medium">{s.title}</div>
              <div className="font-mono text-[11px] text-muted">
                {s.id} · {projects.find((p) => p.id === s.projectId)?.name}
              </div>
            </td>
            <td className="text-muted">{s.type}</td>
            <td className="font-mono text-xs text-muted">{s.added}</td>
            <td className="text-xs">{stageLabel(s)}</td>
            <td className="pr-4">
              <Progress value={s.progress} tone={tone(s)} />
              <span className="font-mono text-[10px] text-muted">{s.progress}%</span>
            </td>
            <td>
              <StatusTag status={s.status} />
            </td>
            <td className="pr-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
              {s.status === 'Completed' && (
                <IconButton
                  label="Open in reader"
                  icon={BookOpenText}
                  onClick={() => nav(`/research?source=${s.id}`)}
                />
              )}
              {(s.status === 'Failed' || s.status === 'Cancelled') && (
                <IconButton label="Retry" icon={RefreshCw} onClick={() => retrySource(s.id)} />
              )}
              {(s.status === 'Running' || s.status === 'Queued') && (
                <IconButton label="Cancel" icon={Square} onClick={() => cancel(s)} />
              )}
              <IconButton
                label="Verify metadata"
                icon={ShieldCheck}
                onClick={() => nav(`/verify?source=${s.id}`)}
              />
              <IconButton label="Remove source" icon={Trash2} onClick={() => remove(s)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
