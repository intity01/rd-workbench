import { useState } from 'react'
import { NOTES } from '../data/knowledge'
import { PROJECTS } from '../data/projects'
import { SOURCES } from '../data/sources'
import type { Message, Note, Project, Source } from '../data/types'
import { nextId, today } from '../lib/format'
import type { Highlight, NoteDraft } from './types'
import type { UiSlice } from './useUiSlice'

const SEED_MESSAGES: Message[] = [
  {
    id: 'M-1',
    role: 'user',
    text: 'What is the main advantage of separating the Rust Core from the Python document processing worker?',
  },
  {
    id: 'M-2',
    role: 'assistant',
    text: 'Process separation helps keep the desktop interface responsive while computationally intensive document extraction runs independently. It also makes it possible to restart or replace document workers without restarting the entire application.',
    citations: [{ sourceId: 'SRC-001', page: 4 }],
    scope: 'Current document · 1 source',
  },
]

/** Research material: projects, sources, notes, reader highlights and assistant thread. */
export function useLibrarySlice(ui: UiSlice) {
  const [projects, setProjects] = useState<Project[]>(PROJECTS)
  const [sources, setSources] = useState<Source[]>(SOURCES)
  const [notes, setNotes] = useState<Note[]>(NOTES)
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES)
  const [highlights, setHighlights] = useState<Highlight[]>([
    { id: 'H-1', sourceId: 'SRC-001', page: 4, text: 'keeps the desktop interface responsive' },
  ])

  const addProject = (p: Partial<Project>, draft = false) => {
    const id = nextId('P')
    const project = {
      ...PROJECTS[0],
      tags: [],
      hypotheses: '',
      exclusions: '',
      ...p,
      id,
      status: draft ? 'Draft' : 'Active',
      sourceCount: 0,
      progress: 0,
      updated: today(),
    } as Project
    setProjects((ps) => [project, ...ps])
    ui.logActivity(`${draft ? 'Saved draft' : 'Created project'} “${project.name}”`, `/projects/${id}`)
    return id
  }
  const updateProject = (id: string, patch: Partial<Project>) =>
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch, updated: today() } : p)))
  const bumpSourceCount = (projectId: string, delta: number) =>
    setProjects((ps) =>
      ps.map((p) =>
        p.id === projectId ? { ...p, sourceCount: Math.max(0, p.sourceCount + delta), updated: today() } : p,
      ),
    )

  const updateSource = (id: string, patch: Partial<Source>) =>
    setSources((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const retrySource = (id: string) => {
    setSources((xs) =>
      xs.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'Queued',
              progress: 0,
              elapsed: 0,
              error: undefined,
              logs: [...s.logs, '[--:--] Retry requested — re-queued'],
            }
          : s,
      ),
    )
    ui.toast('Source re-queued for processing')
  }
  const cancelSource = (id: string) => {
    setSources((xs) =>
      xs.map((s) =>
        s.id === id ? { ...s, status: 'Cancelled', logs: [...s.logs, '[--:--] Cancelled by user'] } : s,
      ),
    )
    ui.toast('Processing cancelled', 'info')
  }

  const saveNote = (d: NoteDraft) => {
    if (d.id) {
      setNotes((ns) => ns.map((n) => (n.id === d.id ? { ...n, ...d, id: n.id, updated: today() } : n)))
      ui.toast('Note updated', 'success', { label: 'Open', to: `/library?note=${d.id}` })
      return d.id
    }
    const id = nextId('N')
    setNotes((ns) => [{ ...d, id, updated: today() }, ...ns])
    ui.toast('Note saved', 'success', { label: 'Open', to: `/library?note=${id}` })
    ui.logActivity(`Saved note “${d.title}”`, `/library?note=${id}`, d.body)
    return id
  }

  return {
    projects,
    sources,
    notes,
    messages,
    highlights,
    setProjects,
    setSources,
    setNotes,
    setMessages,
    setHighlights,
    addProject,
    updateProject,
    bumpSourceCount,
    updateSource,
    retrySource,
    cancelSource,
    saveNote,
  }
}

export type LibrarySlice = ReturnType<typeof useLibrarySlice>
