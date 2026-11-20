import type { Project } from '../../data/types'

export const STEPS = ['Project Identity', 'Research Definition', 'Workspace Configuration']
export const CATEGORIES = [
  'AI / Systems',
  'Audio Processing',
  'Software Engineering',
  'Hardware / IoT',
  'Data Science',
  'Humanities',
  'Other',
]
export const OUTPUTS = [
  'Research report',
  'Architecture decision record',
  'Prototype',
  'Literature review',
  'Dataset',
]
export const PROVIDERS = ['Local Models', 'OpenAI', 'Anthropic', 'Google', 'Custom Provider']
export const CITATION_SOURCES = ['OpenAlex', 'Crossref', 'Semantic Scholar', 'PubMed']
export const PROCESSING = [
  'OCR when needed',
  'Equation processing',
  'Generate embeddings',
  'Auto-verify DOIs',
]

export type WizardForm = Partial<Project> & { tagText: string }

export const EMPTY_FORM: WizardForm = {
  name: '',
  description: '',
  category: 'AI / Systems',
  tagText: '',
  icon: 'flask',
  question: '',
  objectives: '',
  hypotheses: '',
  scope: '',
  exclusions: '',
  output: 'Research report',
  storage: '~/Workbench/projects/',
  language: 'Mixed',
  provider: 'Local Models',
  mode: 'Local-first',
  citationSources: ['OpenAlex', 'Crossref'],
  processing: ['OCR when needed', 'Equation processing'],
}

/** Returns field errors for a step; empty object means valid. */
export function validateStep(step: number, f: WizardForm): Record<string, string> {
  if (step === 0 && !f.name?.trim()) return { name: 'Project name is required' }
  if (step === 1 && !f.question?.trim()) return { question: 'A primary research question is required' }
  return {}
}

export const toProject = (f: WizardForm): Partial<Project> => ({
  ...f,
  tags: f.tagText
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean),
  storage: f.storage || '~/Workbench/projects/',
})
