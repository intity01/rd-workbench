import { useNavigate } from 'react-router'
import { BookOpenText, RefreshCw, Square, X } from 'lucide-react'
import { STAGES, stageOf } from '../../data/meta'
import type { Source } from '../../data/types'
import { fmt } from '../../lib/format'
import { useStore } from '../../state/StoreProvider'
import { Button, IconButton, Progress, StatusGlyph, StatusTag, cn, type GlyphKind } from '../../ui'

function stageState(s: Source, i: number): [GlyphKind, string] {
  const cur = stageOf(s.progress)
  if (s.status === 'Completed' || i < cur) return ['ok', 'Done']
  if (i > cur) return ['idle', 'Pending']
  if (s.status === 'Failed') return ['fail', 'Failed']
  if (s.status === 'Running') return ['busy', 'Running']
  return [s.status === 'Cancelled' ? 'stopped' : 'idle', s.status]
}

export function ProcessingDrawer({ s, onClose }: { s: Source; onClose: () => void }) {
  const { retrySource, cancelSource, confirm } = useStore()
  const nav = useNavigate()
  const stopped = s.status === 'Failed' || s.status === 'Cancelled'
  const active = s.status === 'Running' || s.status === 'Queued'
  const rate = s.type === 'PDF' ? 4 : 10
  const facts = [
    ['Current stage', s.status === 'Completed' ? 'Done' : STAGES[stageOf(s.progress)]],
    ['Elapsed', fmt(s.elapsed)],
    ['Worker', s.worker],
    ['Est. remaining', s.status === 'Running' ? `~${fmt(Math.ceil((100 - s.progress) / rate))} (mock)` : '—'],
  ]
  const cancel = () =>
    confirm({
      title: 'Cancel processing?',
      body: 'The worker will stop after the current stage.',
      confirmLabel: 'Cancel processing',
      onConfirm: () => cancelSource(s.id),
    })

  return (
    <aside
      className="m-2 ml-0 flex w-[360px] shrink-0 flex-col overflow-hidden rounded-2xl bg-surface-2"
      aria-label="Processing details"
    >
      <div className="flex items-start gap-2 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold">{s.title}</div>
          <div className="font-mono text-[11px] text-muted">
            {s.id} · {s.type}
          </div>
        </div>
        <IconButton label="Close details" icon={X} solid onClick={onClose} />
      </div>
      <div className="flex-1 space-y-4 overflow-auto px-4 pb-4">
        <div>
          <div className="flex items-center justify-between">
            <StatusTag status={s.status} />
            <span className="font-mono text-xs">{s.progress}%</span>
          </div>
          <Progress
            value={s.progress}
            className="mt-2"
            tone={s.status === 'Failed' ? 'danger' : s.status === 'Completed' ? 'success' : 'signal'}
          />
        </div>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          {facts.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-raised px-3 py-2">
              <dt className="text-[10.5px] text-muted">{k}</dt>
              <dd className="mt-0.5 truncate font-mono">{v}</dd>
            </div>
          ))}
        </dl>
        {s.error && (
          <div className="rounded-xl bg-danger px-3 py-2.5 text-xs leading-relaxed text-white">{s.error}</div>
        )}
        <ol className="space-y-0.5">
          {STAGES.map((st, i) => {
            const [kind, label] = stageState(s, i)
            return (
              <li
                key={st}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px]',
                  i === stageOf(s.progress) && s.status !== 'Completed' && 'bg-raised',
                )}
              >
                <StatusGlyph kind={kind} size={16} />
                <span className={cn('flex-1', kind === 'idle' && 'text-muted')}>{st}</span>
                <span className="text-[10.5px] text-muted">{label}</span>
              </li>
            )
          })}
        </ol>
        <pre className="max-h-48 overflow-auto rounded-xl bg-[#0a0a0b] p-3 font-mono text-[11px] leading-relaxed text-[#b8b8c0]">
          {s.logs.join('\n')}
        </pre>
      </div>
      <div className="flex gap-2 p-3">
        <Button className="flex-1" icon={RefreshCw} disabled={!stopped} onClick={() => retrySource(s.id)}>
          Retry
        </Button>
        <Button className="flex-1" variant="danger" icon={Square} disabled={!active} onClick={cancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          variant="primary"
          icon={BookOpenText}
          disabled={s.status !== 'Completed'}
          onClick={() => nav(`/research?source=${s.id}`)}
        >
          Open
        </Button>
      </div>
    </aside>
  )
}
