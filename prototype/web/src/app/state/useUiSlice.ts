import { useCallback, useState } from 'react'
import { now } from '../lib/format'
import type { Activity, ConfirmReq, NoteDraft, Notice, Toast } from './types'

const SEED_ACTIVITY: Activity[] = [
  {
    id: 1,
    text: 'Saved note “Process isolation rationale”',
    at: '09:52',
    to: '/library?note=N-001',
    detail: 'Note created from Native-Rust-UI-Comparison.pdf page 4.',
  },
  {
    id: 2,
    text: 'Verified metadata for Native-Rust-UI-Comparison.pdf',
    at: '09:12',
    to: '/verify?source=SRC-001',
    detail: 'Simulated lookup matched title, authors and year.',
  },
  {
    id: 3,
    text: 'OCR failed on Audio-Processing-Study.pdf',
    at: 'Yesterday',
    to: '/imports?source=SRC-004',
    detail: 'Worker exited with code 137 on page 7 (sample error).',
  },
  {
    id: 4,
    text: 'Exported architecture report (Typst)',
    at: 'Yesterday',
    to: '/tasks?task=T-004',
    detail: 'Sample report export completed.',
  },
]

const SEED_NOTICES: Notice[] = [
  {
    id: 1,
    text: 'Audio-Processing-Study.pdf failed at OCR',
    at: 'Yesterday',
    to: '/imports?source=SRC-004',
    read: false,
    kind: 'error',
  },
  {
    id: 2,
    text: 'DOI verification completed for SRC-001',
    at: '09:12',
    to: '/verify?source=SRC-001',
    read: false,
    kind: 'success',
  },
]

/** Transient interface state: toasts, dialogs, palette, activity feed, notifications. */
export function useUiSlice(confirmDeletes: boolean) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmReq, setConfirmReq] = useState<ConfirmReq | null>(null)
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState('P-001')
  const [activity, setActivity] = useState<Activity[]>(SEED_ACTIVITY)
  const [notices, setNotices] = useState<Notice[]>(SEED_NOTICES)

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (text: string, kind: Toast['kind'] = 'success', action?: Toast['action']) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, kind, text, action }])
      setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )
  const logActivity = useCallback((text: string, to: string, detail = '') => {
    const item = { id: Date.now() + Math.random(), text, at: now(), to, detail: detail || text }
    setActivity((a) => [item, ...a].slice(0, 30))
  }, [])
  const notify = useCallback((text: string, to: string, kind: Notice['kind'] = 'info') => {
    const item = { id: Date.now() + Math.random(), text, at: now(), to, read: false, kind }
    setNotices((n) => [item, ...n].slice(0, 30))
  }, [])
  /** Destructive actions go through here so the "confirm deletes" setting is honoured. */
  const confirm = (req: ConfirmReq) => (confirmDeletes ? setConfirmReq(req) : req.onConfirm())

  return {
    toasts,
    confirmReq,
    noteDraft,
    paletteOpen,
    currentProjectId,
    activity,
    notices,
    setConfirmReq,
    setNoteDraft,
    setPaletteOpen,
    setCurrentProjectId,
    setNotices,
    toast,
    dismissToast,
    logActivity,
    notify,
    confirm,
  }
}

export type UiSlice = ReturnType<typeof useUiSlice>
