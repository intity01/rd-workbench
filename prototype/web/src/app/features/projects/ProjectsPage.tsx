import { useState } from 'react'
import { useNavigate } from 'react-router'
import { FolderPlus, LayoutGrid, List, Search, Trash2 } from 'lucide-react'
import { useStore } from '../../state/StoreProvider'
import { Button, EmptyState, IconButton, PageHeader, Progress, ProjectIcon, Segmented, field } from '../../ui'
import { ProjectCard, ProjectStatusTag } from './ProjectCard'

const STATUSES = ['All', 'Active', 'Planning', 'Draft']

export function ProjectsPage() {
  const { projects, deleteProject, confirm } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const list = projects.filter(
    (p) =>
      (status === 'All' || p.status === status) &&
      `${p.name} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase()),
  )
  const remove = (id: string, name: string) =>
    confirm({
      title: 'Delete project?',
      body: `“${name}” and its sources, notes, tasks and graph nodes will be removed from this prototype session.`,
      onConfirm: () => deleteProject(id),
    })

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} research projects in this workspace`}
        actions={
          <Button variant="primary" icon={FolderPlus} onClick={() => nav('/projects/new')}>
            New Project
          </Button>
        }
      />
      <div className="flex items-center gap-3 px-6 pb-3">
        <div className="relative w-72">
          <Search size={14} className="absolute top-2.5 left-3 text-muted" aria-hidden />
          <input
            className={field('rounded-full pl-8')}
            placeholder="Filter projects"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Filter projects"
          />
        </div>
        <Segmented
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUSES.map((v) => ({ value: v, label: v }))}
        />
        <div className="flex-1" />
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'grid', label: 'Grid', icon: LayoutGrid },
            { value: 'list', label: 'List', icon: List },
          ]}
        />
      </div>
      <div className="flex-1 overflow-auto px-6 pb-6">
        {list.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title={projects.length ? 'No matching projects' : 'No projects yet'}
            body={projects.length ? 'Try a different filter.' : 'Create your first research project.'}
            action={
              projects.length ? (
                <Button
                  onClick={() => {
                    setQ('')
                    setStatus('All')
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="primary" onClick={() => nav('/projects/new')}>
                  New Project
                </Button>
              )
            }
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-3 gap-3">
            {list.map((p) => (
              <ProjectCard key={p.id} p={p} onOpen={() => nav(`/projects/${p.id}`)} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface-2">
            <table className="w-full text-[13px]">
              <thead className="text-left text-[11px] text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Project</th>
                  <th className="font-medium">Category</th>
                  <th className="font-medium">Status</th>
                  <th className="font-medium">Sources</th>
                  <th className="w-40 font-medium">Progress</th>
                  <th className="font-medium">Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer border-t border-line hover:bg-raised"
                    onClick={() => nav(`/projects/${p.id}`)}
                  >
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <ProjectIcon icon={p.icon} size={26} />
                        <span className="font-medium">{p.name}</span>
                      </span>
                    </td>
                    <td className="text-muted">{p.category}</td>
                    <td>
                      <ProjectStatusTag status={p.status} />
                    </td>
                    <td className="font-mono">{p.sourceCount}</td>
                    <td className="pr-6">
                      <Progress value={p.progress} />
                    </td>
                    <td className="font-mono text-xs text-muted">{p.updated}</td>
                    <td className="pr-3 text-right">
                      <IconButton
                        label="Delete project"
                        icon={Trash2}
                        onClick={(e) => {
                          e.stopPropagation()
                          remove(p.id, p.name)
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
