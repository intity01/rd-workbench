import { useEffect, useState } from 'react'
import { useStore } from '../state/StoreProvider'
import type { NoteDraft } from '../state/types'
import { Button, Field, Modal, inputCls, textareaCls } from '../ui'

/** Global create/edit note dialog driven by `noteDraft` in the store. */
export function NoteEditor() {
  const { noteDraft, setNoteDraft, saveNote, projects, sources } = useStore()
  const [d, setD] = useState<NoteDraft | null>(noteDraft)
  const [err, setErr] = useState('')
  useEffect(() => {
    setD(noteDraft)
    setErr('')
  }, [noteDraft])
  if (!noteDraft || !d) return null

  const close = () => setNoteDraft(null)
  const save = () => {
    if (!d.title.trim()) return setErr('Give the note a title')
    saveNote(d)
    close()
  }
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      e.stopPropagation()
      save()
    }
  }
  const footer = (
    <>
      <Button variant="ghost" onClick={close}>
        Cancel
      </Button>
      <Button variant="primary" onClick={save}>
        Save Note
      </Button>
    </>
  )

  return (
    <Modal
      open
      onClose={close}
      title={d.id ? 'Edit Note' : 'New Note'}
      subtitle="Stored in shared prototype state for this session"
      width={580}
      footer={footer}
    >
      <div className="space-y-3" onKeyDown={onKey}>
        <Field label="Title" required>
          <input
            autoFocus
            className={inputCls}
            value={d.title}
            onChange={(e) => setD({ ...d, title: e.target.value })}
            placeholder="e.g. Process isolation rationale"
          />
        </Field>
        {err && <p className="text-xs text-danger">{err}</p>}
        <Field label="Body">
          <textarea
            rows={6}
            className={textareaCls}
            value={d.body}
            onChange={(e) => setD({ ...d, body: e.target.value })}
            placeholder="รองรับทั้งภาษาไทยและภาษาอังกฤษ"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Project">
            <select
              className={inputCls}
              value={d.projectId}
              onChange={(e) => setD({ ...d, projectId: e.target.value })}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
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
          <Field label="Page">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={d.page ?? ''}
              disabled={!d.sourceId}
              onChange={(e) => setD({ ...d, page: e.target.value ? Number(e.target.value) : undefined })}
            />
          </Field>
        </div>
        <Field label="Tags" hint="Comma separated">
          <input
            className={inputCls}
            value={d.tags.join(', ')}
            onChange={(e) =>
              setD({
                ...d,
                tags: e.target.value
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      </div>
    </Modal>
  )
}
