// Fictional sample data for the R&D Workbench prototype. No real citations, DOIs, or benchmarks.
import type { Check, CheckState, Verification } from './types'

const ok = (label: string, state: CheckState, detail: string): Check => ({ label, state, detail })

export const VERIFICATIONS: Verification[] = [
  {
    sourceId: 'SRC-001',
    checks: [
      ok('DOI Resolution', 'Found', 'Sample DOI resolved in simulated lookup'),
      ok('Title Match', 'Matched', 'Exact title match'),
      ok('Author Match', 'Matched', '2 of 2 authors'),
      ok('Publication Year Match', 'Matched', '2024'),
      ok('Metadata Availability', 'Matched', 'Journal, publisher, abstract present'),
      ok('Full-text Availability', 'Not Checked', 'Not checked in prototype'),
    ],
    providers: [
      {
        name: 'OpenAlex',
        title: 'A Comparative Study of Native Rust UI Toolkits…',
        year: '2024',
        authors: 'K. Sample, R. Example',
        state: 'Matched',
      },
      {
        name: 'Crossref',
        title: 'A Comparative Study of Native Rust UI Toolkits…',
        year: '2024',
        authors: 'K. Sample, R. Example',
        state: 'Matched',
      },
      {
        name: 'Semantic Scholar',
        title: 'A Comparative Study of Native Rust UI Toolkits…',
        year: '2024',
        authors: 'K. Sample, R. Example',
        state: 'Matched',
      },
    ],
    history: [
      { at: '2025-06-12 09:12', result: 'Matched', note: 'Simulated lookup via Rust Core job T-002' },
    ],
  },
  {
    sourceId: 'SRC-002',
    checks: [
      ok('DOI Resolution', 'Found', 'Sample DOI resolved'),
      ok('Title Match', 'Matched', 'Title matched'),
      ok('Author Match', 'Needs Review', '1 of 2 authors — initials differ'),
      ok('Publication Year Match', 'Matched', '2023'),
      ok('Metadata Availability', 'Matched', 'Present'),
      ok('Full-text Availability', 'Not Checked', 'Not checked in prototype'),
    ],
    providers: [
      {
        name: 'OpenAlex',
        title: 'Running Language Models Locally…',
        year: '2023',
        authors: 'A. Sample, B. Example',
        state: 'Matched',
      },
      {
        name: 'Crossref',
        title: 'Running Language Models Locally…',
        year: '2023',
        authors: 'A. Sample, B. Exemplar',
        state: 'Needs Review',
      },
      { name: 'Semantic Scholar', title: '—', year: '—', authors: '—', state: 'Not Checked' },
    ],
    history: [
      { at: '2025-06-12 08:50', result: 'Needs Review', note: 'Author initials differ between providers' },
    ],
  },
  {
    sourceId: 'SRC-006',
    checks: [
      ok('DOI Resolution', 'Found', 'Sample DOI resolved'),
      ok('Title Match', 'Needs Review', 'Subtitle missing in one provider'),
      ok('Author Match', 'Matched', 'Matched'),
      ok('Publication Year Match', 'Matched', '2023'),
      ok('Metadata Availability', 'Needs Review', 'Abstract missing'),
      ok('Full-text Availability', 'Not Checked', 'Not checked in prototype'),
    ],
    providers: [
      {
        name: 'OpenAlex',
        title: 'A Survey of Forced Alignment Methods…',
        year: '2023',
        authors: 'A. Sample, B. Example',
        state: 'Matched',
      },
      {
        name: 'Crossref',
        title: 'A Survey of Forced Alignment',
        year: '2023',
        authors: 'A. Sample, B. Example',
        state: 'Needs Review',
      },
      {
        name: 'Semantic Scholar',
        title: 'A Survey of Forced Alignment Methods…',
        year: '2023',
        authors: 'A. Sample, B. Example',
        state: 'Matched',
      },
    ],
    history: [{ at: '2025-06-05 14:03', result: 'Needs Review', note: 'Title variant detected' }],
  },
  {
    sourceId: 'SRC-007',
    checks: [
      ok('DOI Resolution', 'Found', 'Sample DOI resolved'),
      ok('Title Match', 'Matched', 'Matched'),
      ok('Author Match', 'Matched', 'Matched'),
      ok('Publication Year Match', 'Mismatch', 'Local 2021 · providers report 2020'),
      ok('Metadata Availability', 'Matched', 'Present'),
      ok('Full-text Availability', 'Not Checked', 'Not checked in prototype'),
    ],
    providers: [
      {
        name: 'OpenAlex',
        title: 'Process Models in Modern Browser Engines',
        year: '2020',
        authors: 'A. Sample, B. Example',
        state: 'Mismatch',
      },
      {
        name: 'Crossref',
        title: 'Process Models in Modern Browser Engines',
        year: '2020',
        authors: 'A. Sample, B. Example',
        state: 'Mismatch',
      },
      {
        name: 'Semantic Scholar',
        title: 'Process Models in Modern Browser Engines',
        year: '2021',
        authors: 'A. Sample, B. Example',
        state: 'Matched',
      },
    ],
    history: [{ at: '2025-06-03 11:20', result: 'Mismatch', note: 'Publication year disagrees' }],
  },
]
