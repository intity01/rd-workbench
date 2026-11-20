// Fictional sample data for the R&D Workbench prototype. No real citations, DOIs, or benchmarks.
import type { Source } from './types'

export type Block =
  | { k: 'title'; text: string; sub: string }
  | { k: 'h'; text: string }
  | { k: 'p'; text: string }
  | { k: 'eq'; text: string; n: string }
  | { k: 'table'; caption: string; head: string[]; rows: string[][] }
  | { k: 'refs'; items: string[] }

const SRC001: Block[][] = [
  [
    {
      k: 'title',
      text: 'A Comparative Study of Native Rust UI Toolkits for Desktop Research Tools',
      sub: 'K. Sample · R. Example — Sample Journal of Interactive Systems (fictional), 2024',
    },
    { k: 'h', text: 'Abstract' },
    {
      k: 'p',
      text: 'Research tools combine long reading sessions with heavy background computation. This sample paper compares immediate-mode and retained-mode Rust UI toolkits and argues that the user interface core should be isolated from document processing workers.',
    },
    { k: 'h', text: '1 Introduction' },
    {
      k: 'p',
      text: 'Desktop research software must render documents, annotations and graphs while extraction, OCR and indexing run in the background. When these responsibilities share one process, a slow extraction step can stall interaction and frustrate the reader.',
    },
    {
      k: 'p',
      text: 'We frame the problem as a boundary question: which work belongs in the native core, and which belongs in replaceable workers written in the language with the best document ecosystem.',
    },
  ],
  [
    { k: 'h', text: '2 Background' },
    {
      k: 'p',
      text: 'Immediate-mode toolkits rebuild the interface description every frame, which simplifies state handling. Retained-mode toolkits keep a widget tree and update it incrementally, which can reduce redraw work for static content.',
    },
    {
      k: 'table',
      caption: 'Table 1. Qualitative comparison of rendering models (illustrative, not measured).',
      head: ['Property', 'Immediate mode', 'Retained mode'],
      rows: [
        ['State model', 'Rebuilt per frame', 'Persistent tree'],
        ['Large documents', 'Needs virtualisation', 'Needs virtualisation'],
        ['Learning curve', 'Lower', 'Higher'],
        ['Custom canvas', 'Straightforward', 'Toolkit-dependent'],
      ],
    },
    {
      k: 'p',
      text: 'Both models require virtualised lists and tiled page rendering when documents contain hundreds of pages.',
    },
  ],
  [
    { k: 'h', text: '3 Inter-process Communication' },
    {
      k: 'p',
      text: 'A core–worker architecture introduces a transfer cost for every page image and text block. Zero-copy IPC between Python and Rust, using shared memory regions, lets the worker write extracted buffers that the core reads without serialising them again.',
    },
    { k: 'eq', text: 'T_transfer = L + S / B', n: '(1)' },
    {
      k: 'p',
      text: 'Here L is the fixed messaging latency, S the payload size and B the effective bandwidth. For large page rasters, avoiding copies reduces S effectively to a small descriptor.',
    },
    {
      k: 'table',
      caption: 'Table 2. IPC options considered (qualitative).',
      head: ['Mechanism', 'Copies', 'Complexity'],
      rows: [
        ['JSON over pipe', 'Multiple', 'Low'],
        ['MessagePack over socket', 'One', 'Low'],
        ['Shared memory ring buffer', 'Zero', 'Medium'],
        ['Memory-mapped file', 'Zero', 'Medium'],
      ],
    },
  ],
  [
    { k: 'h', text: '4 Process Separation' },
    {
      k: 'p',
      text: 'Separating the Rust Core from the Python document processing worker keeps the desktop interface responsive while computationally intensive extraction runs independently.',
    },
    {
      k: 'p',
      text: 'Because workers communicate through a narrow message protocol, they can be restarted or replaced without restarting the entire application. A crashed OCR worker becomes a recoverable job failure rather than a lost session.',
    },
    { k: 'eq', text: 'R_ui = 1 − P(block | shared process)', n: '(2)' },
    {
      k: 'p',
      text: 'Equation (2) is a conceptual expression of interface responsiveness; the paper does not report measured values for it.',
    },
  ],
  [
    { k: 'h', text: '5 Discussion' },
    {
      k: 'p',
      text: 'Process separation adds operational complexity: workers must be supervised, versioned and given resource limits. Scanned mathematical documents remain difficult and may require adaptive processing that chooses OCR and equation passes per page.',
    },
    { k: 'h', text: '6 Conclusion' },
    {
      k: 'p',
      text: 'For a single-user research workstation, a native core with isolated document workers is a pragmatic boundary that preserves responsiveness and allows the extraction stack to evolve.',
    },
  ],
  [
    { k: 'h', text: 'References' },
    {
      k: 'refs',
      items: [
        '[1] Sample, A. (2023). Fictional notes on worker supervision. Example Press. [fictional sample reference]',
        '[2] Example, B. (2022). Illustrative IPC patterns. Sample Proceedings. [fictional sample reference]',
        '[3] Sample, K. (2024). Desktop rendering models. Sample Journal. [fictional sample reference]',
      ],
    },
  ],
]

export function getPages(s: Source): Block[][] {
  if (s.id === 'SRC-001') return SRC001
  const t = s.topic
  const pages: Block[][] = [
    [
      { k: 'title', text: s.paperTitle, sub: `${s.authors} — ${s.journal}, ${s.year}` },
      { k: 'h', text: 'Abstract' },
      { k: 'p', text: s.abstract || `This fictional sample document discusses ${t}.` },
      { k: 'h', text: '1 Introduction' },
      {
        k: 'p',
        text: `Work on ${t} increasingly happens on personal machines. This sample text motivates why local processing and clear evidence trails matter for independent researchers.`,
      },
    ],
    [
      { k: 'h', text: '2 Approach' },
      {
        k: 'p',
        text: `We describe an adaptive pipeline for ${t}: inspect the input first, then apply heavier processing only where needed. Scanned mathematical documents can reduce accuracy and should be routed to specialised passes.`,
      },
      { k: 'eq', text: 'Cost = Σ_i w_i · c_i', n: '(1)' },
      {
        k: 'p',
        text: 'On-device models reduce exposure of private excerpts, at the expense of model size and speed.',
      },
    ],
    [
      { k: 'h', text: '3 Observations' },
      {
        k: 'table',
        caption: 'Table 1. Illustrative summary (sample values, not real measurements).',
        head: ['Condition', 'Outcome', 'Note'],
        rows: [
          ['Born-digital text', 'Good', 'Text layer present'],
          ['Scanned pages', 'Variable', 'OCR required'],
          ['Dense equations', 'Weak', 'Needs equation pass'],
        ],
      },
      {
        k: 'p',
        text: 'Code-switched segments remain a weak point for alignment and extraction alike, suggesting per-segment strategies.',
      },
    ],
    [
      { k: 'h', text: 'References' },
      {
        k: 'refs',
        items: [
          '[1] Sample, A. (2022). Fictional reference on ' + t + '. [fictional sample reference]',
          '[2] Example, B. (2021). Illustrative methods. [fictional sample reference]',
        ],
      },
    ],
  ]
  return pages.slice(0, Math.max(1, Math.min(s.pages, pages.length)))
}
