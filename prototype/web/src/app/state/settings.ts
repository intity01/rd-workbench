import { useEffect, useState } from 'react'

export interface Settings {
  theme: 'dark' | 'light'
  density: 'comfortable' | 'compact'
  textSize: 'small' | 'default' | 'large'
  sidebar: 'expanded' | 'collapsed'
  language: 'English' | 'ไทย'
  startup: string
  keys: Record<string, string>
  defaultModel: string
  researchModel: string
  summaryModel: string
  fallback: string
  routing: string
  localOnly: boolean
  allowExcerpts: boolean
  allowMetadata: boolean
  dbPath: string
  docPath: string
  ocr: string
  ocrDpi: string
  compute: string
  workers: string
  integrations: Record<string, boolean>
  plugins: Record<string, boolean>
  confirmDeletes: boolean
  reopenLast: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  density: 'comfortable',
  textSize: 'default',
  sidebar: 'expanded',
  language: 'English',
  startup: 'Home',
  keys: { OpenAI: '', Anthropic: '', Google: '', Custom: '' },
  defaultModel: 'local / sample-8b (mock)',
  researchModel: 'local / sample-8b (mock)',
  summaryModel: 'local / sample-3b (mock)',
  fallback: 'None',
  routing: 'Local first, ask before cloud',
  localOnly: true,
  allowExcerpts: false,
  allowMetadata: true,
  dbPath: '~/Workbench/workbench.sqlite',
  docPath: '~/Workbench/documents',
  ocr: 'Only when no text layer',
  ocrDpi: '300',
  compute: 'Auto (prefer GPU)',
  workers: '2',
  integrations: { OpenAlex: true, Crossref: true, 'Semantic Scholar': false, PubMed: false },
  plugins: { 'Typst Export': true, 'BibTeX Tools': true, 'Audio Waveform Viewer': false },
  confirmDeletes: true,
  reopenLast: true,
}

const BASE_SIZE = { small: 15, default: 16, large: 17 }

export function useSettingsSlice() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const setSetting = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }))

  // Theme, text scale and language are applied to the document root.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', settings.theme === 'dark')
    const compact = settings.density === 'compact' ? 1 : 0
    root.style.fontSize = `${BASE_SIZE[settings.textSize] - compact}px`
    root.lang = settings.language === 'ไทย' ? 'th' : 'en'
  }, [settings.theme, settings.textSize, settings.density, settings.language])

  return { settings, setSettings, setSetting }
}
