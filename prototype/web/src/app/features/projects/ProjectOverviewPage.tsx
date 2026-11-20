import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BookOpenText, FileText, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../../state/StoreProvider'
import { Button, EmptyState, PageHeader, ProjectIcon, Segmented } from '../../ui'
import { EditProjectDialog } from './EditProjectDialog'
import { OverviewTab } from './OverviewTab'
import { OutputsTab, SourcesTab } from './SourcesOutputsTabs'

type Tab = 'overview' | 'workspace' | 'sources' | 'map' | 'outputs'

export function ProjectOverviewPage() {
  const { id } = useParams()
  const { projects, sources, setCurrentProjectId, confirm, deleteProject } = useStore()
  const nav = useNavigate()
  const p = projects.find((x) => x.id === id)
  const [tab, setTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (p) setCurrentProjectId(p.id)
  }, [p, setCurrentProjectId])

  if (!p)
    return (
      <EmptyState
        icon={FileText}
        title="Project not found"
        body="It may have been deleted in this session."
        action={<Button onClick={() => nav('/projects')}>Back to projects</Button>}
      />
    )
  const first = sources.find((s) => s.projectId === p.id)
  const count = sources.filter((s) => s.projectId === p.id).length
  const openWorkspace = () => nav(`/research${first ? `?source=${first.id}` : ''}`)
  const onTab = (t: Tab) => (t === 'workspace' ? openWorkspace() : t === 'map' ? nav('/map') : setTab(t))
  const remove = () =>
    confirm({
      title: 'Delete project?',
      body: `“${p.name}” and all of its sources, notes and nodes will be removed from this session.`,
      onConfirm: () => {
        deleteProject(p.id)
        nav('/projects')
      },
    })

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <ProjectIcon icon={p.icon} size={20} />
            {p.category} · <span className="font-mono">{p.id}</span>
          </span>
        }
        title={p.name}
        subtitle={p.description}
        actions={
          <>
            <Button icon={Pencil} onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button icon={Trash2} variant="ghost" onClick={remove}>
              Delete
            </Button>
            <Button variant="primary" icon={BookOpenText} onClick={openWorkspace}>
              Open Research Workspace
            </Button>
          </>
        }
      />
      <div className="px-6 pb-3">
        <Segmented
          label="Project sections"
          value={tab}
          onChange={onTab}
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'workspace', label: 'Research Workspace' },
            { value: 'sources', label: `Sources · ${count}` },
            { value: 'map', label: 'Knowledge Map' },
            { value: 'outputs', label: 'Outputs' },
          ]}
        />
      </div>
      <div className="flex-1 overflow-auto px-6 pb-6">
        {tab === 'overview' && <OverviewTab p={p} />}
        {tab === 'sources' && <SourcesTab p={p} />}
        {tab === 'outputs' && <OutputsTab p={p} />}
      </div>
      {editing && <EditProjectDialog project={p} onClose={() => setEditing(false)} />}
    </div>
  )
}
