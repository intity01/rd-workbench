import { useState } from 'react'
import { NODE_META, REL_META } from '../../data/meta'
import type { NodeType, Rel } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, Dot, Field, Modal, cn, inputCls, textareaCls } from '../../ui'
import { ALL, RELS } from './geometry'

export type NewNode = {
  type: NodeType
  label: string
  desc: string
  sourceId?: string
  page?: number
  noteId?: string
}

export function AddNodeDialog({
  defaultType,
  onClose,
  onAdd,
}: {
  defaultType: NodeType
  onClose: () => void
  onAdd: (d: NewNode) => void
}) {
  const { sources, notes } = useStore()
  const [d, setD] = useState<NewNode>({ type: defaultType, label: '', desc: '' })
  const [err, setErr] = useState('')
  const submit = () => {
    if (!d.label.trim()) return setErr('Label is required')
    if (d.type === 'evidence' && !d.sourceId && !d.noteId)
      return setErr('Evidence must link to a source or note')
    onAdd({ ...d, label: d.label.trim() })
  }
  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={submit}>
        Add Node
      </Button>
    </>
  )
  return (
    <Modal open onClose={onClose} title="New Knowledge Node" width={500} footer={footer}>
      <div className="space-y-3">
        <Field label="Type">
          <div className="flex flex-wrap gap-1.5">
            {ALL.map((t) => (
              <button
                key={t}
                onClick={() => setD({ ...d, type: t })}
                aria-pressed={d.type === t}
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium',
                  d.type === t ? 'bg-fg text-app' : 'bg-raised hover:bg-hover',
                )}
              >
                <Dot color={NODE_META[t].color} />
                {NODE_META[t].label}
              </button>
            ))}
          </div>
        </Field>
        <p className="-mt-1 text-[11.5px] text-muted">{NODE_META[d.type].hint}</p>
        <Field label="Label" required>
          <input
            autoFocus
            className={inputCls}
            value={d.label}
            onChange={(e) => setD({ ...d, label: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={2}
            className={textareaCls}
            value={d.desc}
            onChange={(e) => setD({ ...d, desc: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Linked source">
            <select
              className={inputCls}
              value={d.sourceId ?? ''}
              onChange={(e) => setD({ ...d, sourceId: e.target.value || undefined })}
            >
              <option value="">None</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Linked note">
            <select
              className={inputCls}
              value={d.noteId ?? ''}
              onChange={(e) => setD({ ...d, noteId: e.target.value || undefined })}
            >
              <option value="">None</option>
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {err && <p className="text-xs text-danger">{err}</p>}
      </div>
    </Modal>
  )
}

export function ConnectDialog({
  from,
  to,
  onClose,
  onPick,
}: {
  from?: string
  to?: string
  onClose: () => void
  onPick: (r: Rel) => void
}) {
  return (
    <Modal open onClose={onClose} title="Connect nodes" subtitle={`${from} → ${to}`} width={420}>
      <div className="grid gap-1.5">
        {RELS.map((r) => (
          <button
            key={r}
            onClick={() => onPick(r)}
            className="flex items-center gap-3 rounded-xl bg-raised px-3.5 py-2.5 text-left text-[13px] hover:bg-hover"
          >
            <svg width="30" height="8" aria-hidden>
              <line
                x1="0"
                y1="4"
                x2="30"
                y2="4"
                stroke={REL_META[r].warn ? 'var(--danger)' : 'var(--text)'}
                strokeWidth="2"
                strokeDasharray={REL_META[r].dash}
              />
            </svg>
            {REL_META[r].label}
          </button>
        ))}
      </div>
    </Modal>
  )
}
