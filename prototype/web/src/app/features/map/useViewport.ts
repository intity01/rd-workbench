import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { GNode } from '../../data/types'
import { bounds } from './geometry'

const MIN_Z = 0.3
const MAX_Z = 2
const clampZ = (z: number) => Math.min(MAX_Z, Math.max(MIN_Z, z))

/** Pan/zoom state for the graph canvas plus screen↔world conversion. */
export function useViewport() {
  const wrap = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.8)
  const [pan, setPan] = useState({ x: 40, y: 30 })
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure() // synchronous first measurement; the observer handles later resizes
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const toWorld = (cx: number, cy: number) => {
    const r = wrap.current!.getBoundingClientRect()
    return { x: (cx - r.left - pan.x) / zoom, y: (cy - r.top - pan.y) / zoom }
  }

  const zoomAt = (mx: number, my: number, nz: number) => {
    const z = clampZ(nz)
    setPan((p) => ({ x: mx - ((mx - p.x) / zoom) * z, y: my - ((my - p.y) / zoom) * z }))
    setZoom(z)
  }
  const zoomBy = (f: number) => zoomAt(size.w / 2, size.h / 2, zoom * f)
  const onWheel = (e: React.WheelEvent) => {
    const r = wrap.current!.getBoundingClientRect()
    zoomAt(e.clientX - r.left, e.clientY - r.top, zoom * (e.deltaY < 0 ? 1.1 : 0.9))
  }

  const fit = useCallback(
    (list: GNode[]) => {
      if (!list.length) return
      const b = bounds(list, 48)
      const z = clampZ(Math.min(1.2, size.w / b.w, size.h / b.h))
      setZoom(z)
      setPan({ x: (size.w - b.w * z) / 2 - b.x * z, y: (size.h - b.h * z) / 2 - b.y * z })
    },
    [size],
  )
  const centerOn = (x: number, y: number, z = zoom) =>
    setPan({ x: size.w / 2 - x * z, y: size.h / 2 - y * z })

  /** Drag on empty canvas pans. */
  const startPan = (e: React.PointerEvent) => {
    const sx = e.clientX
    const sy = e.clientY
    const start = pan
    const move = (ev: PointerEvent) => setPan({ x: start.x + ev.clientX - sx, y: start.y + ev.clientY - sy })
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return { wrap, zoom, pan, size, toWorld, zoomBy, onWheel, fit, centerOn, startPan, setPan }
}

export type Viewport = ReturnType<typeof useViewport>
