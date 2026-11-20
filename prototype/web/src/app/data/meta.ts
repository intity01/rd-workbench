import type { NodeType, Rel } from './types'

export const STAGES = [
  'File Validation',
  'Metadata Detection',
  'Text Extraction',
  'OCR',
  'Equation Processing',
  'Chunking',
  'Indexing',
]

export const stageOf = (progress: number) =>
  Math.min(STAGES.length - 1, Math.floor((progress / 100) * STAGES.length))

type NodeMeta = { label: string; color: string; layer: 'argument' | 'knowledge'; hint: string }

// Color is used only for the solid icon tile and the type dot — never for borders or body text.
export const NODE_META: Record<NodeType, NodeMeta> = {
  claim: {
    label: 'Claim',
    color: '#6E8BFF',
    layer: 'argument',
    hint: 'A proposition or conclusion to examine.',
  },
  evidence: {
    label: 'Evidence',
    color: '#2FB37E',
    layer: 'argument',
    hint: 'Supporting information from a source or experiment.',
  },
  counter: {
    label: 'Counterargument',
    color: '#E5484D',
    layer: 'argument',
    hint: 'An opposing argument or conflicting observation.',
  },
  question: {
    label: 'Question',
    color: '#E8A33C',
    layer: 'argument',
    hint: 'An unresolved research question.',
  },
  decision: {
    label: 'Decision',
    color: '#9B7BEA',
    layer: 'argument',
    hint: 'A recorded decision or conclusion.',
  },
  topic: { label: 'Topic', color: '#2BA8B8', layer: 'knowledge', hint: 'A research area grouping concepts.' },
  concept: { label: 'Concept', color: '#7C8597', layer: 'knowledge', hint: 'A reusable idea or technique.' },
  document: {
    label: 'Document',
    color: '#C27C4A',
    layer: 'knowledge',
    hint: 'A source document in the library.',
  },
}

// Relations are distinguished by line pattern first; only "contradicts" carries a hue.
export const REL_META: Record<Rel, { label: string; dash?: string; warn?: boolean }> = {
  supports: { label: 'Supports' },
  contradicts: { label: 'Contradicts', dash: '6 4', warn: true },
  depends_on: { label: 'Depends On', dash: '2 4' },
  refines: { label: 'Refines', dash: '10 3 2 3' },
  leads_to: { label: 'Leads To' },
}
