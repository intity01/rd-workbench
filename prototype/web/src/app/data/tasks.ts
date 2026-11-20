// Fictional sample data for the R&D Workbench prototype. No real citations, DOIs, or benchmarks.
import type { Citation, Task } from './types'

export const TASKS: Task[] = [
  {
    id: 'T-001',
    name: 'PDF Extraction',
    worker: 'Python Worker',
    kind: 'extract',
    status: 'Running',
    progress: 46,
    projectId: 'P-001',
    sourceId: 'SRC-002',
    elapsed: 38,
    added: '2025-06-12 09:41',
    logs: ['Job accepted by python-worker-01', 'Extracting text from Local-AI-Research.pdf'],
  },
  {
    id: 'T-002',
    name: 'DOI Verification',
    worker: 'Rust Core',
    kind: 'job',
    status: 'Completed',
    progress: 100,
    projectId: 'P-001',
    sourceId: 'SRC-001',
    elapsed: 3,
    added: '2025-06-12 09:12',
    logs: ['Lookup requested (simulated providers)', 'Title, authors, year matched', 'Result stored'],
  },
  {
    id: 'T-003',
    name: 'Embedding Generation',
    worker: 'Local AI',
    kind: 'job',
    status: 'Queued',
    progress: 0,
    projectId: 'P-001',
    sourceId: 'SRC-001',
    elapsed: 0,
    added: '2025-06-12 09:44',
    logs: ['Waiting for GPU slot (simulated)'],
  },
  {
    id: 'T-004',
    name: 'Report Export',
    worker: 'Typst',
    kind: 'job',
    status: 'Completed',
    progress: 100,
    projectId: 'P-001',
    elapsed: 12,
    added: '2025-06-11 17:20',
    logs: ['Compiled report.typ', 'Wrote architecture-report.pdf (sample output)'],
  },
  {
    id: 'T-005',
    name: 'OCR Pass',
    worker: 'Python Worker',
    kind: 'job',
    status: 'Failed',
    progress: 52,
    projectId: 'P-001',
    sourceId: 'SRC-004',
    elapsed: 71,
    added: '2025-06-11 16:02',
    logs: ['OCR started on 9 pages', 'Page 7: large scanned figure', 'Worker exited with code 137'],
    error:
      'Worker process terminated (exit 137). Sample error: memory limit reached while rasterising page 7. Try lowering OCR DPI in Settings → Processing.',
  },
]

export const CITATIONS: Citation[] = [
  {
    id: 'CIT-001',
    sourceId: 'SRC-001',
    page: 4,
    quote:
      'Separating the Rust Core from the Python document processing worker keeps the interface responsive.',
  },
  {
    id: 'CIT-002',
    sourceId: 'SRC-002',
    page: 2,
    quote: 'On-device models reduce exposure of private excerpts.',
  },
  {
    id: 'CIT-003',
    sourceId: 'SRC-006',
    page: 3,
    quote: 'Code-switched segments remain a weak point for alignment.',
  },
  {
    id: 'CIT-004',
    sourceId: 'SRC-007',
    page: 1,
    quote: 'Site isolation trades memory for security boundaries.',
  },
]
