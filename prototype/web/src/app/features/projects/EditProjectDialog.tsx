import { useState } from 'react'
import type { Project } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, Field, Modal, inputCls, textareaCls } from '../../ui'

export function EditProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const { updateProject, toast } = useStore()
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    question: project.question,
  })
  const save = () => {
    updateProject(project.id, form)
    toast('Project updated')
    onClose()
  }
  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" disabled={!form.name.trim()} onClick={save}>
        Save
      </Button>
    </>
  )
  return (
    <Modal open onClose={onClose} title="Edit project" footer={footer}>
      <div className="space-y-3">
        <Field label="Name" required>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            className={textareaCls}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Research question">
          <textarea
            rows={2}
            className={textareaCls}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  )
}
