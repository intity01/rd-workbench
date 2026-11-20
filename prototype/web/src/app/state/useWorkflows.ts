import type { Source } from '../data/types'
import { nextId, stamp, today } from '../lib/format'
import type { GraphSlice } from './useGraphSlice'
import type { LibrarySlice } from './useLibrarySlice'
import type { OpsSlice } from './useOpsSlice'
import type { UiSlice } from './useUiSlice'

type NewSource = Partial<Source> & Pick<Source, 'title' | 'type' | 'projectId'>

/** Actions that span several slices (cascading deletes, import → job creation). */
export function useWorkflows(ui: UiSlice, lib: LibrarySlice, graph: GraphSlice, ops: OpsSlice) {
  const deleteProject = (id: string) => {
    const p = lib.projects.find((x) => x.id === id)
    lib.setProjects((ps) => ps.filter((x) => x.id !== id))
    lib.setSources((s) => s.filter((x) => x.projectId !== id))
    lib.setNotes((n) => n.filter((x) => x.projectId !== id))
    ops.setTasks((t) => t.filter((x) => x.projectId !== id))
    graph.setNodes((n) => n.filter((x) => x.projectId !== id))
    if (ui.currentProjectId === id) ui.setCurrentProjectId(lib.projects.find((x) => x.id !== id)?.id ?? '')
    ui.toast(`Deleted “${p?.name}”`)
    ui.logActivity(`Deleted project “${p?.name}”`, '/projects')
  }

  const addSource = (s: NewSource) => {
    const id = nextId('SRC')
    const rust = s.type === 'URL' || s.type === 'BibTeX'
    const src: Source = {
      paperTitle: s.title.replace(/\.[a-z]+$/i, '').replace(/[-_]/g, ' '),
      added: today(),
      status: 'Queued',
      progress: 0,
      elapsed: 0,
      worker: rust ? 'rust-core' : 'python-worker-01',
      verify: 'Not Checked',
      pages: 4,
      authors: 'Unknown (to be detected)',
      year: new Date().getFullYear(),
      journal: 'Not yet detected',
      doi: '',
      publisher: '—',
      url: '',
      topic: 'imported research material',
      logs: ['[--:--] Added to queue'],
      abstract:
        'Imported in this session. Content shown in the reader is generated sample text, not extracted from your file.',
      ...s,
      id,
    }
    const name = s.type === 'URL' ? 'URL Capture' : s.type === 'BibTeX' ? 'BibTeX Import' : 'PDF Extraction'
    lib.setSources((xs) => [...xs, src])
    ops.setTasks((ts) => [
      ...ts,
      {
        id: nextId('T'),
        name,
        worker: rust ? 'Rust Core' : 'Python Worker',
        kind: 'extract',
        status: 'Queued',
        progress: 0,
        projectId: s.projectId,
        sourceId: id,
        elapsed: 0,
        added: stamp(),
        logs: ['Queued for processing'],
      },
    ])
    lib.bumpSourceCount(s.projectId, 1)
    ui.logActivity(`Imported ${src.title}`, `/imports?source=${id}`)
    return id
  }

  const deleteSource = (id: string) => {
    const s = lib.sources.find((x) => x.id === id)
    lib.setSources((xs) => xs.filter((x) => x.id !== id))
    ops.setTasks((ts) => ts.filter((t) => !(t.kind === 'extract' && t.sourceId === id)))
    if (s) lib.bumpSourceCount(s.projectId, -1)
    ui.toast(`Removed ${s?.title}`)
  }

  const deleteNote = (id: string) => {
    lib.setNotes((ns) => ns.filter((n) => n.id !== id))
    graph.setNodes((xs) => xs.map((n) => (n.noteId === id ? { ...n, noteId: undefined } : n)))
    ui.toast('Note deleted')
  }

  const retryTask = (id: string) => {
    const t = ops.tasks.find((x) => x.id === id)
    if (t?.kind === 'extract' && t.sourceId) lib.retrySource(t.sourceId)
    else ui.toast(`${t?.name} re-queued`)
    ops.setTasks((ts) =>
      ts.map((x) =>
        x.id === id
          ? {
              ...x,
              status: 'Queued',
              progress: 0,
              elapsed: 0,
              error: undefined,
              logs: [...x.logs, 'Retry requested'],
            }
          : x,
      ),
    )
  }

  const cancelTask = (id: string) => {
    const t = ops.tasks.find((x) => x.id === id)
    if (t?.kind === 'extract' && t.sourceId) lib.cancelSource(t.sourceId)
    else ui.toast(`${t?.name} cancelled`, 'info')
    ops.setTasks((ts) =>
      ts.map((x) =>
        x.id === id ? { ...x, status: 'Cancelled', logs: [...x.logs, 'Cancelled by user'] } : x,
      ),
    )
  }

  return { deleteProject, addSource, deleteSource, deleteNote, retryTask, cancelTask }
}
