import { useEffect, useRef } from 'react'

/**
 * Global shortcuts dispatch cancelable window events. A page that handles one calls
 * preventDefault(), letting the shell fall back to a default action otherwise.
 */
function useAppEvent(name: 'rd:save' | 'rd:find', fn: () => void) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault()
      ref.current()
    }
    window.addEventListener(name, h)
    return () => window.removeEventListener(name, h)
  }, [name])
}

export const useSaveShortcut = (fn: () => void) => useAppEvent('rd:save', fn)
export const useFindShortcut = (fn: () => void) => useAppEvent('rd:find', fn)

/** Returns true when no page handled the event. */
export const emitAppEvent = (name: 'rd:save' | 'rd:find') =>
  window.dispatchEvent(new CustomEvent(name, { cancelable: true }))
