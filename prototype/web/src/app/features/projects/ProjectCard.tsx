import type { Project } from '../../data/types'
import { Progress, ProjectIcon, Tag } from '../../ui'

export function ProjectStatusTag({ status }: { status: Project['status'] }) {
  return <Tag tone={status === 'Active' ? 'signal' : 'neutral'}>{status}</Tag>
}

export function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group flex h-full flex-col rounded-2xl bg-surface-2 p-4 text-left transition-colors hover:bg-raised"
    >
      <div className="flex items-start gap-3">
        <ProjectIcon icon={p.icon} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold">{p.name}</div>
          <div className="text-xs text-muted">{p.category}</div>
        </div>
        <ProjectStatusTag status={p.status} />
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted">{p.description}</p>
      <div className="mt-4 flex items-center gap-2">
        <Tag mono>{p.sourceCount} sources</Tag>
        <span className="ml-auto font-mono text-[11px] text-muted">{p.progress}%</span>
      </div>
      <Progress value={p.progress} className="mt-2" />
      <div className="mt-3 text-[11px] text-muted">
        Updated <span className="font-mono">{p.updated}</span>
      </div>
    </button>
  )
}
