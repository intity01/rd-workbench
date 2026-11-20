import { useNavigate } from 'react-router'
import { X } from 'lucide-react'
import { useStore } from '../state/StoreProvider'
import { StatusGlyph } from '../ui'

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  const nav = useNavigate()
  return (
    <div
      className="pointer-events-none fixed right-5 bottom-5 z-[60] flex w-[340px] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((x) => (
        <div
          key={x.id}
          className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-fg px-4 py-3 text-app shadow-pop"
        >
          <StatusGlyph kind={x.kind === 'error' ? 'fail' : x.kind === 'info' ? 'stopped' : 'ok'} />
          <p className="flex-1 text-[13px] leading-snug">{x.text}</p>
          {x.action && (
            <button
              className="rounded-full bg-signal px-2.5 py-1 text-[12px] font-medium text-on-signal"
              onClick={() => {
                nav(x.action!.to)
                dismissToast(x.id)
              }}
            >
              {x.action.label}
            </button>
          )}
          <button
            aria-label="Dismiss"
            onClick={() => dismissToast(x.id)}
            className="opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
