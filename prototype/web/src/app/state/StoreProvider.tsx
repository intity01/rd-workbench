import { createContext, useContext, type ReactNode } from 'react'
import { EXPERIMENTS } from '../data/knowledge'
import { CITATIONS } from '../data/tasks'
import { nextId } from '../lib/format'
import { useSettingsSlice } from './settings'
import { useGraphSlice } from './useGraphSlice'
import { useLibrarySlice } from './useLibrarySlice'
import { useOpsSlice } from './useOpsSlice'
import { useProcessingSim } from './useProcessingSim'
import { useUiSlice } from './useUiSlice'
import { useWorkflows } from './useWorkflows'

/** Single composition point. Each slice maps to one service in the native app. */
function useStoreValue() {
  const settings = useSettingsSlice()
  const ui = useUiSlice(settings.settings.confirmDeletes)
  const library = useLibrarySlice(ui)
  const graph = useGraphSlice(ui)
  const ops = useOpsSlice(ui, library)
  const workflows = useWorkflows(ui, library, graph, ops)
  useProcessingSim(ui, library, ops)
  return {
    ...settings,
    ...ui,
    ...library,
    ...graph,
    ...ops,
    ...workflows,
    citations: CITATIONS,
    experiments: EXPERIMENTS,
    nextId,
  }
}

export type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useStoreValue()}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside <StoreProvider>')
  return v
}
