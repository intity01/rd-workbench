import { useNavigate } from 'react-router'
import { FilePlus2, FolderPlus, NotebookPen, Waypoints } from 'lucide-react'
import { useStore } from '../state/StoreProvider'
import { StatusGlyph, cn } from '../ui'
import { MenuItem, Popover } from './Popover'

export function CreateMenu({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  const { setNoteDraft, currentProjectId } = useStore()
  const go = (fn: () => void) => () => {
    onClose()
    fn()
  }
  return (
    <Popover onClose={onClose} className="right-0 w-64">
      <MenuItem onClick={go(() => nav('/projects/new'))} hint="Ctrl N">
        <FolderPlus size={15} className="text-muted" />
        New Research Project
      </MenuItem>
      <MenuItem onClick={go(() => nav('/imports?import=pdf'))} hint="Ctrl O">
        <FilePlus2 size={15} className="text-muted" />
        New Source
      </MenuItem>
      <MenuItem
        onClick={go(() =>
          setNoteDraft({ title: '', body: '', projectId: currentProjectId || 'P-001', tags: [] }),
        )}
        hint="Ctrl ⇧ N"
      >
        <NotebookPen size={15} className="text-muted" />
        New Note
      </MenuItem>
      <MenuItem onClick={go(() => nav('/map?add=1'))}>
        <Waypoints size={15} className="text-muted" />
        New Knowledge Node
      </MenuItem>
    </Popover>
  )
}

export function NotificationsMenu({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  const { notices, setNotices } = useStore()
  const open = (id: number, to: string) => {
    setNotices((ns) => ns.map((x) => (x.id === id ? { ...x, read: true } : x)))
    nav(to)
  }
  return (
    <Popover onClose={onClose} className="right-0 w-80">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <span className="text-xs font-semibold">Notifications</span>
        <button
          className="text-[11px] text-muted hover:text-fg"
          onClick={() => setNotices((n) => n.map((x) => ({ ...x, read: true })))}
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-auto">
        {notices.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted">You're all caught up.</p>
        )}
        {notices.map((n) => (
          <button
            key={n.id}
            onClick={() => open(n.id, n.to)}
            className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-raised"
          >
            <span className="mt-0.5">
              <StatusGlyph kind={n.kind === 'error' ? 'fail' : n.kind === 'success' ? 'ok' : 'idle'} />
            </span>
            <span className="flex-1">
              <span className={cn('block text-[13px]', !n.read && 'font-semibold')}>{n.text}</span>
              <span className="text-[11px] text-muted">
                {n.at}
                {!n.read && ' · unread'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Popover>
  )
}
