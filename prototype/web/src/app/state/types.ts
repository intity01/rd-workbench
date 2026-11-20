export interface Toast {
  id: number
  kind: 'success' | 'error' | 'info'
  text: string
  action?: { label: string; to: string }
}

export interface ConfirmReq {
  title: string
  body: string
  confirmLabel?: string
  onConfirm: () => void
}

export interface NoteDraft {
  id?: string
  title: string
  body: string
  projectId: string
  sourceId?: string
  page?: number
  tags: string[]
}

export interface Activity {
  id: number
  text: string
  at: string
  to: string
  detail: string
}

export interface Notice {
  id: number
  text: string
  at: string
  to: string
  read: boolean
  kind: 'success' | 'error' | 'info'
}

export interface Highlight {
  id: string
  sourceId: string
  page: number
  text: string
}
