import { useNavigate } from 'react-router'
import { FileText, NotebookPen, Upload, Waypoints } from 'lucide-react'
import type { Project } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, Card, EmptyState, Progress, SectionTitle, StatusTag } from '../../ui'
import { ProjectStatusTag } from './ProjectCard'

export function OverviewTab({ p }: { p: Project }) {
  const { sources, notes, nodes, tasks, updateProject, setNoteDraft } = useStore()
  const nav = useNavigate()
  const ps = sources.filter((s) => s.projectId === p.id)
  const pn = notes.filter((n) => n.projectId === p.id)
  const pt = tasks.filter((t) => t.projectId === p.id && t.status !== 'Completed')
  const stats = [
    ['Sources', p.sourceCount],
    ['Notes', pn.length],
    ['Knowledge nodes', nodes.filter((n) => n.projectId === p.id).length],
  ] as const

  return (
    <div className="grid grid-cols-[1fr_300px] gap-4">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="text-xs text-muted">Primary research question</div>
          <p className="mt-2 text-[17px] leading-relaxed font-medium">
            {p.question || 'No research question yet.'}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-4 text-[13px]">
            {(
              [
                ['Objectives', p.objectives],
                ['Scope', p.scope],
                ['Expected output', p.output],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-muted">{k}</div>
                <p className="mt-1 leading-relaxed">{v || '—'}</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid grid-cols-4 gap-3">
          <Card className="px-4 py-3">
            <div className="text-xs text-muted">Status</div>
            <div className="mt-2">
              <ProjectStatusTag status={p.status} />
            </div>
          </Card>
          {stats.map(([l, v]) => (
            <Card key={l} className="px-4 py-3">
              <div className="text-xs text-muted">{l}</div>
              <div className="mt-1 font-mono text-[24px]">{v}</div>
            </Card>
          ))}
        </div>
        <Card>
          <SectionTitle count={ps.length + pn.length}>Recently modified</SectionTitle>
          <div className="px-2 pb-2">
            {ps.length + pn.length === 0 && (
              <EmptyState
                icon={Upload}
                title="No materials yet"
                body="Import a PDF or URL to begin."
                action={
                  <Button variant="primary" icon={Upload} onClick={() => nav('/imports?import=pdf')}>
                    Import Source
                  </Button>
                }
              />
            )}
            {pn.map((n) => (
              <button
                key={n.id}
                onClick={() => nav(`/library?note=${n.id}`)}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-raised"
              >
                <NotebookPen size={15} className="text-muted" aria-hidden />
                <span className="flex-1 truncate text-[13px]">{n.title}</span>
                <span className="font-mono text-[11px] text-muted">{n.updated}</span>
              </button>
            ))}
            {ps.map((s) => (
              <button
                key={s.id}
                onClick={() =>
                  nav(s.status === 'Completed' ? `/research?source=${s.id}` : `/imports?source=${s.id}`)
                }
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-raised"
              >
                <FileText size={15} className="text-muted" aria-hidden />
                <span className="flex-1 truncate text-[13px]">{s.title}</span>
                <StatusTag status={s.status} />
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            Research progress<span className="font-mono text-fg">{p.progress}%</span>
          </div>
          <Progress value={p.progress} className="mt-2" tone="signal" />
          <input
            type="range"
            min={0}
            max={100}
            value={p.progress}
            onChange={(e) => updateProject(p.id, { progress: Number(e.target.value) })}
            className="mt-3 w-full accent-[var(--signal)]"
            aria-label="Adjust progress"
          />
        </Card>
        <Card>
          <SectionTitle count={pt.length}>Pending activities</SectionTitle>
          <div className="space-y-1 px-2 pb-2">
            {pt.length === 0 && <p className="py-3 text-center text-xs text-muted">Nothing pending</p>}
            {pt.map((t) => (
              <button
                key={t.id}
                onClick={() => nav(`/tasks?task=${t.id}`)}
                className="block w-full rounded-xl px-2.5 py-2 text-left hover:bg-raised"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium">{t.name}</span>
                  <StatusTag status={t.status} />
                </div>
                <div className="mt-0.5 text-[11px] text-muted">{t.worker}</div>
              </button>
            ))}
          </div>
        </Card>
        <div className="space-y-2">
          <Button className="w-full" icon={Upload} onClick={() => nav('/imports?import=pdf')}>
            Import source
          </Button>
          <Button
            className="w-full"
            icon={NotebookPen}
            onClick={() => setNoteDraft({ title: '', body: '', projectId: p.id, tags: [] })}
          >
            New note
          </Button>
          <Button className="w-full" icon={Waypoints} onClick={() => nav('/map')}>
            Open knowledge map
          </Button>
        </div>
      </div>
    </div>
  )
}
