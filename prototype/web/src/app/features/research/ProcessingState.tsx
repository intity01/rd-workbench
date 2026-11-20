import { useNavigate } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { STAGES, stageOf } from '../../data/meta'
import type { Source } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, Progress, StatusGlyph } from '../../ui'

/** Shown in the reader while a source is queued, running, failed or cancelled. */
export function ProcessingState({ src }: { src: Source }) {
  const { retrySource } = useStore()
  const nav = useNavigate()
  const stopped = src.status === 'Failed' || src.status === 'Cancelled'
  return (
    <div className="mx-auto mt-16 max-w-md rounded-3xl bg-card p-6">
      <div className="flex items-center gap-2.5 text-[15px] font-semibold">
        <StatusGlyph kind={stopped ? 'fail' : src.status === 'Running' ? 'busy' : 'idle'} size={18} />
        {stopped
          ? src.status === 'Failed'
            ? 'Processing failed'
            : 'Processing cancelled'
          : src.status === 'Running'
            ? `${STAGES[stageOf(src.progress)]}…`
            : 'Waiting in queue'}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {stopped
          ? (src.error ?? 'Content is unavailable until the source is processed.')
          : 'The reader opens automatically once text extraction and indexing finish.'}
      </p>
      {!stopped && (
        <>
          <Progress value={src.progress} className="mt-4" tone="signal" />
          <div className="mt-2 flex justify-between font-mono text-[11px] text-muted">
            <span>{src.progress}%</span>
            <span>{src.worker}</span>
          </div>
        </>
      )}
      <div className="mt-5 flex gap-2">
        <Button size="sm" onClick={() => nav(`/imports?source=${src.id}`)}>
          {stopped ? 'View logs' : 'Processing details'}
        </Button>
        {stopped && (
          <Button size="sm" variant="primary" icon={RefreshCw} onClick={() => retrySource(src.id)}>
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
