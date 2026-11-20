import { Braces, FileText, Files, FolderOpen, Globe, type LucideIcon } from 'lucide-react'

export type Method = 'pdf' | 'url' | 'folder' | 'bibtex' | 'other'

export const METHODS: { id: Method; label: string; hint: string; icon: LucideIcon; color: string }[] = [
  { id: 'pdf', label: 'PDF', hint: 'Papers & reports', icon: FileText, color: '#E5484D' },
  { id: 'url', label: 'URL', hint: 'Web articles', icon: Globe, color: '#2BA8B8' },
  { id: 'folder', label: 'Folder', hint: 'Batch import', icon: FolderOpen, color: '#E8A33C' },
  { id: 'bibtex', label: 'BibTeX', hint: 'Reference lists', icon: Braces, color: '#9B7BEA' },
  { id: 'other', label: 'Other Documents', hint: 'DOCX, MD, TXT', icon: Files, color: '#7C8597' },
]

export const SAMPLE_PDFS = [
  'Adaptive-OCR-Strategies.pdf',
  'Thai-Text-Segmentation-Notes.pdf',
  'Equation-Recognition-Overview.pdf',
]
export const SAMPLE_DOCS = ['Meeting-notes-2025-06.md', 'Lab-protocol.docx']
export const SAMPLE_BIBTEX =
  '@article{sample2024,\n  title = {Adaptive Document Processing for Personal Research},\n  author = {Sample, A. and Example, B.},\n  year = {2024}\n}'

export const parseBibTitles = (bib: string) =>
  [...bib.matchAll(/title\s*=\s*[{"]([^}"]+)[}"]/gi)].map((x) => x[1])
export const isHttpUrl = (u: string) => /^https?:\/\/[^\s.]+\.[^\s]+$/.test(u.trim())
