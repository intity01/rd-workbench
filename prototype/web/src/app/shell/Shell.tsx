import { Outlet } from 'react-router'
import { useStore } from '../state/StoreProvider'
import { CommandPalette } from './CommandPalette'
import { ConfirmDialog } from './ConfirmDialog'
import { NoteEditor } from './NoteEditor'
import { Sidebar } from './Sidebar'
import { Toasts } from './Toasts'
import { TopBar } from './TopBar'

/** Window frame: sidebar on the app background, one solid content pane, global overlays. */
export function Shell() {
  const { paletteOpen, setPaletteOpen } = useStore()
  return (
    <div className="flex h-full min-w-[1024px] bg-app text-fg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col py-2 pr-2">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-surface">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <NoteEditor />
      <ConfirmDialog />
      <Toasts />
    </div>
  )
}
