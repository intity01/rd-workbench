import { useState } from 'react'

/** Pointer-driven pane width. `dir` is +1 when dragging right grows the pane, -1 otherwise. */
export function useResizable(initial: number, min: number, max: number, dir: 1 | -1) {
  const [width, setWidth] = useState(initial)
  const onPointerDown = (e: React.PointerEvent) => {
    const startX = e.clientX
    const start = width
    const move = (ev: PointerEvent) =>
      setWidth(Math.min(max, Math.max(min, start + dir * (ev.clientX - startX))))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  return { width, onPointerDown }
}

export function ResizeHandle({
  onPointerDown,
  label,
}: {
  onPointerDown: (e: React.PointerEvent) => void
  label: string
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      role="separator"
      aria-label={label}
      className="group flex w-2 shrink-0 cursor-col-resize items-center justify-center"
    >
      <span className="h-10 w-1 rounded-full bg-raised transition-colors group-hover:bg-signal" />
    </div>
  )
}
