import { NavLink, useLocation } from 'react-router'
import {
  BookOpenText,
  CircleHelp,
  FileSearch,
  FolderKanban,
  House,
  ListChecks,
  Microscope,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Upload,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '../state/StoreProvider'
import { LogoMark, cn } from '../ui'
import { useT } from './i18n'

const RESEARCH_PATHS = ['/research', '/imports', '/verify']
const RESEARCH_CHILDREN = [
  { to: '/research', label: 'Workspace', icon: BookOpenText },
  { to: '/imports', label: 'Import & Queue', icon: Upload },
  { to: '/verify', label: 'Verification', icon: ShieldCheck },
]

type ItemOpts = { end?: boolean; active?: boolean; badge?: number; sub?: boolean }

export function Sidebar() {
  const { settings, setSetting, sources } = useStore()
  const t = useT()
  const { pathname } = useLocation()
  const collapsed = settings.sidebar === 'collapsed'
  const inResearch = RESEARCH_PATHS.includes(pathname)
  const busy = sources.filter((s) => s.status === 'Running' || s.status === 'Queued').length

  const item = (to: string, label: string, Icon: LucideIcon, o: ItemOpts = {}) => (
    <NavLink
      key={to + label}
      to={to}
      end={o.end ?? true}
      aria-label={label}
      data-tip={collapsed ? label : undefined}
      data-tip-side="right"
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-xl text-[0.8125rem] font-medium transition-colors',
          collapsed ? 'h-10 w-10 justify-center' : o.sub ? 'h-8 pr-2 pl-9' : 'h-9 px-2.5',
          isActive || o.active ? 'bg-raised text-fg' : 'text-muted hover:text-fg',
        )
      }
    >
      <Icon size={o.sub ? 15 : 17} strokeWidth={1.9} aria-hidden />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && !!o.badge && (
        <span className="rounded-full bg-signal px-1.5 font-mono text-[10px] font-medium text-on-signal">
          {o.badge}
        </span>
      )}
    </NavLink>
  )

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col transition-[width] duration-200',
        collapsed ? 'w-[68px] items-center' : 'w-[232px]',
      )}
      aria-label="Primary"
    >
      <div className={cn('flex h-14 items-center gap-2.5', collapsed ? 'justify-center' : 'px-4')}>
        <LogoMark size={30} />
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight">R&amp;D Workbench</div>
            <div className="text-[10.5px] text-muted">Research. Understand. Build.</div>
          </div>
        )}
      </div>
      <nav className={cn('mt-2 flex flex-1 flex-col gap-0.5', collapsed ? 'items-center' : 'px-3')}>
        {item('/', t('home'), House)}
        {item('/projects', t('projects'), FolderKanban, { end: false })}
        {item('/research', t('research'), Microscope, { active: inResearch && collapsed, badge: busy })}
        {!collapsed && inResearch && RESEARCH_CHILDREN.map((c) => item(c.to, c.label, c.icon, { sub: true }))}
        {item('/library', t('library'), FileSearch)}
        {item('/map', t('map'), Waypoints)}
        {item('/tasks', t('tasks'), ListChecks)}
      </nav>
      <div className={cn('flex flex-col gap-0.5 pb-3', collapsed ? 'items-center' : 'px-3')}>
        {item('/settings', t('settings'), Settings)}
        {item('/help', t('help'), CircleHelp)}
        <button
          onClick={() => setSetting('sidebar', collapsed ? 'expanded' : 'collapsed')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          data-tip={collapsed ? 'Expand sidebar' : undefined}
          data-tip-side="right"
          className={cn(
            'mt-1 flex items-center gap-2.5 rounded-xl text-xs text-muted hover:text-fg',
            collapsed ? 'h-10 w-10 justify-center' : 'h-8 px-2.5',
          )}
        >
          {collapsed ? <PanelLeftOpen size={16} aria-hidden /> : <PanelLeftClose size={16} aria-hidden />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  )
}
