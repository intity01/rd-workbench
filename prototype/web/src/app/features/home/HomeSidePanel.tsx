import { useState } from 'react'
import { useNavigate } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { STAGES, stageOf } from '../../data/meta'
import { useStore } from '../../state/StoreProvider'
import type { Activity } from '../../state/types'
import { Button, Modal, Progress, SectionTitle, StatusGlyph, StatusTag } from '../../ui'

const SERVICES = [
  ['Rust Core', 'Running'],
  ['Python Worker', 'Running'],
  ['Search Index', 'Up to date'],
]

function SystemStatus() {
  const { toast } = useStore()
  const [aiDown, setAiDown] = useState(true)
  const [checking, setChecking] = useState(false)
  const retry = () => {
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      setAiDown(false)
      toast('Local AI ready (simulated)')
    }, 1100)
  }
  return (
    <div className="mx-4 mb-5 overflow-hidden rounded-2xl bg-surface-2 text-xs">
      {SERVICES.map(([n, s]) => (
        <div key={n} className="flex items-center justify-between px-3 py-2.5">
          <span>{n}</span>
          <span className="flex items-center gap-1.5 text-muted">
            <StatusGlyph kind="ok" size={12} />
            {s}
          </span>
        </div>
      ))}
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span>Local AI</span>
          <span className="flex items-center gap-1.5 text-muted">
            <StatusGlyph kind={aiDown ? 'fail' : 'ok'} size={12} />
            {aiDown ? 'Unavailable' : 'Ready'}
          </span>
        </div>
        {aiDown && (
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
            <span>Sample error: model not loaded</span>
            <Button size="sm" icon={RefreshCw} disabled={checking} onClick={retry}>
              {checking ? 'Loading…' : 'Retry'}
            </Button>
          </div>
        )}
      </div>
      <p className="px-3 pb-2.5 text-[10.5px] text-muted">Status values are simulated.</p>
    </div>
  )
}

export function HomeSidePanel() {
  const { sources, activity } = useStore()
  const nav = useNavigate()
  const [detail, setDetail] = useState<Activity | null>(null)
  const queue = sources.filter((s) => s.status !== 'Completed').slice(0, 5)
  const open = () => {
    const to = detail!.to
    setDetail(null)
    nav(to)
  }
  return (
    <aside className="w-[300px] shrink-0 overflow-auto bg-surface-2/50">
      <SectionTitle
        count={queue.length}
        action={
          <Button variant="ghost" size="sm" onClick={() => nav('/tasks')}>
            Tasks
          </Button>
        }
      >
        Processing Queue
      </SectionTitle>
      <div className="space-y-2 px-4 pb-4">
        {queue.length === 0 && (
          <p className="rounded-2xl bg-surface-2 px-3 py-4 text-center text-xs text-muted">Queue is empty</p>
        )}
        {queue.map((s) => (
          <button
            key={s.id}
            onClick={() => nav(`/imports?source=${s.id}`)}
            className="block w-full rounded-2xl bg-surface-2 p-3 text-left hover:bg-raised"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium">{s.title}</span>
              <StatusTag status={s.status} />
            </div>
            <div className="mt-1.5 text-[11px] text-muted">
              {s.status === 'Failed' ? 'Failed at ' : ''}
              {STAGES[stageOf(s.progress)]} · {s.progress}%
            </div>
            <Progress
              value={s.progress}
              className="mt-2"
              tone={s.status === 'Failed' ? 'danger' : 'signal'}
            />
          </button>
        ))}
      </div>
      <SectionTitle>Recent Activity</SectionTitle>
      <ul className="px-2 pb-4">
        {activity.slice(0, 6).map((a) => (
          <li key={a.id}>
            <button
              onClick={() => setDetail(a)}
              className="w-full rounded-xl px-2.5 py-2 text-left hover:bg-raised"
            >
              <span className="block text-xs leading-snug">{a.text}</span>
              <span className="font-mono text-[10.5px] text-muted">{a.at}</span>
            </button>
          </li>
        ))}
      </ul>
      <SectionTitle>System Status</SectionTitle>
      <SystemStatus />
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Activity detail"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
            <Button variant="primary" onClick={open}>
              Open
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-2 text-[13px]">
            <p className="font-medium">{detail.text}</p>
            <p className="text-muted">{detail.detail}</p>
            <p className="font-mono text-[11px] text-muted">
              {detail.at} · {detail.to}
            </p>
          </div>
        )}
      </Modal>
    </aside>
  )
}
