import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../ui'

/** Anchored menu; closes on outside click. Parent must be `relative`. */
export function Popover({
  children,
  onClose,
  className,
}: {
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return (
    <div
      ref={ref}
      role="menu"
      className={cn('absolute top-[calc(100%+8px)] z-50 rounded-2xl bg-card p-1.5 shadow-pop', className)}
    >
      {children}
    </div>
  )
}

export function MenuItem({
  children,
  onClick,
  hint,
}: {
  children: ReactNode
  onClick: () => void
  hint?: string
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[13px] hover:bg-raised"
    >
      {children}
      {hint && <span className="ml-auto font-mono text-[10px] text-muted">{hint}</span>}
    </button>
  )
}
