// Domain entities shared by every feature. Mirrors the planned Rust structs 1:1.

export type ProjectStatus = 'Active' | 'Planning' | 'Draft' | 'Paused' | 'Completed'
export type SourceType = 'PDF' | 'Markdown' | 'URL' | 'BibTeX' | 'Document'
export type ProcStatus = 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled'
export type VerifyState = 'Matched' | 'Needs Review' | 'Mismatch' | 'Not Checked'
export type CheckState = 'Found' | 'Matched' | 'Needs Review' | 'Mismatch' | 'Not Checked'
export type NodeType =
  | 'claim'
  | 'evidence'
  | 'counter'
  | 'question'
  | 'decision'
  | 'topic'
  | 'concept'
  | 'document'
export type Rel = 'supports' | 'contradicts' | 'depends_on' | 'refines' | 'leads_to'

export interface Project {
  id: string
  name: string
  description: string
  category: string
  status: ProjectStatus
  sourceCount: number
  progress: number
  updated: string
  question: string
  objectives: string
  hypotheses: string
  scope: string
  exclusions: string
  output: string
  tags: string[]
  icon: string
  storage: string
  language: 'Thai' | 'English' | 'Mixed'
  provider: string
  mode: 'Local-first' | 'Cloud-assisted'
  citationSources: string[]
  processing: string[]
}

export interface Source {
  id: string
  title: string
  paperTitle: string
  type: SourceType
  projectId: string
  added: string
  status: ProcStatus
  progress: number
  worker: string
  elapsed: number
  verify: VerifyState
  pages: number
  authors: string
  year: number
  journal: string
  doi: string
  publisher: string
  abstract: string
  url: string
  topic: string
  logs: string[]
  error?: string
}

export interface Note {
  id: string
  title: string
  body: string
  projectId: string
  sourceId?: string
  page?: number
  tags: string[]
  updated: string
}

export interface GNode {
  id: string
  type: NodeType
  label: string
  desc: string
  x: number
  y: number
  projectId: string
  sourceId?: string
  page?: number
  noteId?: string
}

export interface Edge {
  id: string
  from: string
  to: string
  rel: Rel
}

export interface Task {
  id: string
  name: string
  worker: string
  kind: 'extract' | 'job'
  status: ProcStatus
  progress: number
  projectId?: string
  sourceId?: string
  elapsed: number
  added: string
  logs: string[]
  error?: string
}

export interface Citation {
  id: string
  sourceId: string
  page: number
  quote: string
}

export interface Check {
  label: string
  state: CheckState
  detail: string
}

export interface ProviderRecord {
  name: 'OpenAlex' | 'Crossref' | 'Semantic Scholar'
  title: string
  year: string
  authors: string
  state: CheckState
}

export interface Verification {
  sourceId: string
  checks: Check[]
  providers: ProviderRecord[]
  history: { at: string; result: VerifyState; note: string }[]
}

export interface Experiment {
  id: string
  title: string
  body: string
  projectId: string
  date: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  citations?: { sourceId: string; page: number }[]
  scope?: string
}
