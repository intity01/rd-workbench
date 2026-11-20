import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Activity, ArrowRight, BookOpenText, FileText, FolderPlus, NotebookPen, Search } from 'lucide-react'
import { useStore } from '../../state/StoreProvider'
import { Button, Card, EmptyState, Progress, SectionTitle, Skeleton, StatusTag, VerifyTag } from '../../ui'
import { HomeSidePanel } from './HomeSidePanel'
import { ProjectCard } from '../projects/ProjectCard'

function greeting(th: boolean) {
  const h = new Date().getHours()
  if (th) return h < 12 ? 'สวัสดีตอนเช้า' : h < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function HomePage() {
  const { projects, sources, notes, tasks, setPaletteOpen, settings, setNoteDraft, currentProjectId } =
    useStore()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [])
  const th = settings.language === 'ไทย'
  const date = new Date().toLocaleDateString(th ? 'th-TH' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  // Workspace totals include 2 archived sample projects and earlier indexed material.
  const metrics = [
    {
      label: 'Active Projects',
      value: projects.filter((p) => p.status === 'Active' || p.status === 'Planning').length + 2,
      to: '/projects',
      icon: FolderPlus,
    },
    {
      label: 'Sources Indexed',
      value: 128 + sources.filter((s) => s.status === 'Completed' && Number(s.id.slice(4)) > 8).length,
      to: '/imports',
      icon: FileText,
    },
    {
      label: 'Pending Tasks',
      value: tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled').length,
      to: '/tasks',
      icon: Activity,
    },
    { label: 'Research Notes', value: 40 + notes.length, to: '/library', icon: NotebookPen },
  ]
  const last = sources.find((s) => s.id === 'SRC-001')
  const newNote = () =>
    setNoteDraft({ title: '', body: '', projectId: currentProjectId || 'P-001', tags: [] })

  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 overflow-auto px-6 pb-6">
        <div className="flex items-end justify-between gap-6 pt-6 pb-5">
          <div>
            <div className="text-xs text-muted">{date}</div>
            <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{greeting(th)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex h-8 w-64 items-center gap-2 rounded-full bg-raised px-3 text-[13px] text-muted hover:text-fg"
            >
              <Search size={14} aria-hidden /> Search projects, sources, notes…
            </button>
            <Button variant="primary" icon={FolderPlus} onClick={() => nav('/projects/new')}>
              New Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <button
              key={m.label}
              onClick={() => nav(m.to)}
              className="rounded-2xl bg-surface-2 px-4 py-3.5 text-left hover:bg-raised"
            >
              <div className="flex items-center justify-between text-xs text-muted">
                {m.label}
                <m.icon size={14} aria-hidden />
              </div>
              <div className="mt-2 font-mono text-[28px] leading-none font-medium tracking-tight">
                {String(m.value).padStart(2, '0')}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-7 mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Recent Projects</h2>
          <Button variant="ghost" size="sm" onClick={() => nav('/projects')}>
            View all <ArrowRight size={12} />
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[196px]" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <EmptyState
              icon={FolderPlus}
              title="No projects yet"
              body="Create a research project to start collecting sources."
              action={
                <Button variant="primary" onClick={() => nav('/projects/new')}>
                  Create project
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {projects.slice(0, 3).map((p) => (
              <ProjectCard key={p.id} p={p} onOpen={() => nav(`/projects/${p.id}`)} />
            ))}
          </div>
        )}

        {last && (
          <>
            <h2 className="mt-7 mb-3 text-[15px] font-semibold">Continue Research</h2>
            <div className="flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
              <div className="flex h-14 w-11 items-center justify-center rounded-lg bg-raised font-mono text-[9px] text-muted">
                PDF
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{last.title}</div>
                <div className="text-xs text-muted">
                  Page 4 of 6 · Section 4 Process Separation · 2 messages with assistant
                </div>
                <Progress value={66} className="mt-2 max-w-sm" tone="signal" />
              </div>
              <VerifyTag state={last.verify} />
              <Button
                variant="primary"
                icon={BookOpenText}
                onClick={() => nav('/research?source=SRC-001&page=4')}
              >
                Resume reading
              </Button>
            </div>
          </>
        )}

        <div className="mt-7 grid grid-cols-2 gap-4">
          <Card>
            <SectionTitle
              action={
                <Button variant="ghost" size="sm" onClick={() => nav('/imports')}>
                  Import
                </Button>
              }
            >
              Recent Sources
            </SectionTitle>
            <div className="px-2 pb-2">
              {loading
                ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="m-2 h-8" />)
                : [...sources]
                    .reverse()
                    .slice(0, 5)
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() =>
                          nav(
                            s.status === 'Completed' ? `/research?source=${s.id}` : `/imports?source=${s.id}`,
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-raised"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px]">{s.title}</div>
                          <div className="font-mono text-[10.5px] text-muted">
                            {s.id} · {s.added}
                          </div>
                        </div>
                        <StatusTag status={s.status} />
                      </button>
                    ))}
            </div>
          </Card>
          <Card>
            <SectionTitle
              action={
                <Button variant="ghost" size="sm" onClick={newNote}>
                  New
                </Button>
              }
            >
              Recent Notes
            </SectionTitle>
            <div className="px-2 pb-2">
              {notes.length === 0 && (
                <EmptyState
                  icon={NotebookPen}
                  title="No notes yet"
                  body="Select a passage in the reader and choose Create Note."
                />
              )}
              {notes.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  onClick={() => nav(`/library?note=${n.id}`)}
                  className="block w-full rounded-xl px-2.5 py-2 text-left hover:bg-raised"
                >
                  <div className="truncate text-[13px]">{n.title}</div>
                  <div className="truncate text-[11px] text-muted">{n.body}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <HomeSidePanel />
    </div>
  )
}
