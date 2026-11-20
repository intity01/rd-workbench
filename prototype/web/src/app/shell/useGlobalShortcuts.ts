import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '../state/StoreProvider'
import { emitAppEvent } from './events'

/** Ctrl/Cmd shortcuts from the spec. Browsers may reserve a few of these in the web preview. */
export function useGlobalShortcuts(closeMenus: () => void) {
  const nav = useNavigate()
  const store = useStore()
  const { setPaletteOpen, setNoteDraft, toast, currentProjectId } = store

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return closeMenus()
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      const run = (fn: () => void) => {
        e.preventDefault()
        fn()
      }
      if (k === 'k') run(() => setPaletteOpen(true))
      else if (e.shiftKey && k === 'n')
        run(() => setNoteDraft({ title: '', body: '', projectId: currentProjectId || 'P-001', tags: [] }))
      else if (k === 'n') run(() => nav('/projects/new'))
      else if (k === 'o') run(() => nav('/imports?import=pdf'))
      else if (k === 's')
        run(() => emitAppEvent('rd:save') && toast('All changes are kept in local prototype state', 'info'))
      else if (e.shiftKey && k === 'f')
        run(() => emitAppEvent('rd:find') && nav(`/library?scope=${currentProjectId}`))
      else if (e.shiftKey && k === 'g') run(() => nav('/map'))
      else if (k === '1') run(() => nav('/'))
      else if (k === '2') run(() => nav('/projects'))
      else if (k === '3') run(() => nav('/library'))
      else if (k === ',') run(() => nav('/settings'))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [nav, closeMenus, setPaletteOpen, setNoteDraft, toast, currentProjectId])
}
