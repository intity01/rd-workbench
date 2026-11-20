import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Bell, ChevronRight, Moon, Plus, Search, Settings, Sun } from 'lucide-react'
import { useStore } from '../state/StoreProvider'
import { Button, IconButton, Kbd, StatusGlyph } from '../ui'
import { useT } from './i18n'
import { CreateMenu, NotificationsMenu } from './TopBarMenus'
import { useGlobalShortcuts } from './useGlobalShortcuts'

const LABELS: Record<string, string> = {
  '/research': 'Research Workspace',
  '/imports': 'Import & Processing',
  '/verify': 'Citation & DOI Verification',
  '/projects/new': 'New Research Project',
}
const PROJECT_SCOPED = ['/research', '/imports', '/verify', '/map']

function useCrumbs() {
  const { pathname } = useLocation()
  const { projects, currentProjectId } = useStore()
  const t = useT()
  return useMemo(() => {
    const named: Record<string, string> = {
      '/': t('home'),
      '/projects': t('projects'),
      '/library': t('library'),
      '/map': t('map'),
      '/tasks': t('tasks'),
      '/settings': t('settings'),
      '/help': t('help'),
      ...LABELS,
    }
    if (pathname.startsWith('/projects/') && pathname !== '/projects/new')
      return [t('projects'), projects.find((x) => pathname.endsWith(x.id))?.name ?? 'Project']
    const proj = projects.find((x) => x.id === currentProjectId)
    const label = named[pathname] ?? 'Not found'
    return PROJECT_SCOPED.includes(pathname) && proj ? [proj.name, label] : [label]
  }, [pathname, projects, currentProjectId, t])
}

export function TopBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const { settings, setSetting, setPaletteOpen, notices, sources, tasks } = useStore()
  const [menu, setMenu] = useState<null | 'create' | 'notify'>(null)
  const crumbs = useCrumbs()
  const close = () => setMenu(null)
  useGlobalShortcuts(close)
  useEffect(() => {
    setMenu(null)
  }, [loc.pathname, loc.search])
  const running =
    sources.filter((s) => s.status === 'Running').length +
    tasks.filter((x) => x.kind === 'job' && x.status === 'Running').length
  const unread = notices.filter((n) => !n.read).length
  const dark = settings.theme === 'dark'

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-[13px]">
        {crumbs.map((c, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight size={13} className="shrink-0 text-muted" aria-hidden />}
            <span className={i === crumbs.length - 1 ? 'truncate font-semibold' : 'truncate text-muted'}>
              {c}
            </span>
          </span>
        ))}
      </nav>
      <button
        onClick={() => setPaletteOpen(true)}
        className="flex h-8 w-[260px] shrink items-center gap-2 rounded-full bg-raised px-3 text-[13px] text-muted hover:text-fg"
        aria-label="Global search (Ctrl+K)"
      >
        <Search size={14} aria-hidden />
        <span className="flex-1 truncate text-left">Search everything…</span>
        <Kbd>Ctrl K</Kbd>
      </button>
      <button
        onClick={() => nav('/imports')}
        data-tip={running ? `${running} job${running > 1 ? 's' : ''} running` : 'No active processing'}
        aria-label="Processing status"
        className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted hover:bg-raised hover:text-fg"
      >
        <StatusGlyph kind={running ? 'busy' : 'ok'} />
        <span className="font-mono">{running}</span>
      </button>
      <div className="relative">
        <IconButton
          label={`Notifications (${unread} unread)`}
          icon={Bell}
          active={menu === 'notify'}
          onClick={() => setMenu(menu === 'notify' ? null : 'notify')}
        />
        {unread > 0 && (
          <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 font-mono text-[9px] text-white">
            {unread}
          </span>
        )}
        {menu === 'notify' && <NotificationsMenu onClose={close} />}
      </div>
      <IconButton
        label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        icon={dark ? Sun : Moon}
        onClick={() => setSetting('theme', dark ? 'light' : 'dark')}
      />
      <IconButton label="Preferences (Ctrl+,)" icon={Settings} onClick={() => nav('/settings')} />
      <div className="relative ml-1">
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setMenu(menu === 'create' ? null : 'create')}
          aria-haspopup="menu"
          aria-expanded={menu === 'create'}
        >
          Create
        </Button>
        {menu === 'create' && <CreateMenu onClose={close} />}
      </div>
    </header>
  )
}
