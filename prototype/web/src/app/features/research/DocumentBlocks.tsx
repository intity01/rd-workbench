import { Fragment, type ReactNode } from 'react'
import type { Block } from '../../data/documents'
import type { Highlight } from '../../state/types'
import { esc } from '../../ui'

export const blockText = (b: Block) =>
  b.k === 'table' ? `${b.caption} ${b.rows.flat().join(' ')}` : b.k === 'refs' ? b.items.join(' ') : b.text

/** Wrap highlights, a cited-passage flash and find matches in <mark> elements. */
export function marked(text: string, hl: Highlight[], find: string, flash: string): ReactNode {
  const terms = [
    ...hl.map((h) => ({ t: h.text, c: 'hl' })),
    ...(flash ? [{ t: flash, c: 'hl flash' }] : []),
    ...(find.length > 1 ? [{ t: find, c: 'find' }] : []),
  ].filter((x) => x.t && text.toLowerCase().includes(x.t.toLowerCase()))
  const run = (s: string, i: number): ReactNode[] => {
    if (i >= terms.length) return [s]
    return s.split(new RegExp(`(${esc(terms[i].t)})`, 'gi')).map((p, j) =>
      j % 2 ? (
        <mark key={`${i}-${j}`} className={terms[i].c}>
          {p}
        </mark>
      ) : (
        <Fragment key={`${i}-${j}`}>{run(p, i + 1)}</Fragment>
      ),
    )
  }
  return run(text, 0)
}

const serif = { fontFamily: 'Georgia, "Noto Serif Thai", "Times New Roman", serif' }

export function BlockView({ b, render }: { b: Block; render: (t: string) => ReactNode }) {
  switch (b.k) {
    case 'title':
      return (
        <header className="mb-6 border-b border-line pb-5 text-center">
          <h1 className="text-[1.55em] leading-snug font-semibold" style={serif}>
            {render(b.text)}
          </h1>
          <p className="mt-2 text-[0.8em] text-muted">{b.sub}</p>
        </header>
      )
    case 'h':
      return <h2 className="mt-6 mb-2 text-[1.05em] font-semibold tracking-tight">{render(b.text)}</h2>
    case 'p':
      return (
        <p className="mb-3 text-justify leading-[1.75]" style={serif}>
          {render(b.text)}
        </p>
      )
    case 'eq':
      return (
        <div className="my-4 flex items-center justify-center gap-6 font-mono text-[0.95em]">
          <span className="rounded-lg bg-raised px-4 py-2">{render(b.text)}</span>
          <span className="text-muted">{b.n}</span>
        </div>
      )
    case 'table':
      return (
        <figure className="my-5">
          <table className="w-full border-y-2 border-fg/70 text-[0.82em]">
            <thead>
              <tr className="border-b border-line">
                {b.head.map((h) => (
                  <th key={h} className="px-2 py-1.5 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className="px-2 py-1">
                      {render(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <figcaption className="mt-1.5 text-[0.75em] text-muted">{b.caption}</figcaption>
        </figure>
      )
    case 'refs':
      return (
        <ol className="space-y-2 text-[0.85em]" style={serif}>
          {b.items.map((r) => (
            <li key={r} className="leading-relaxed">
              {render(r)}
            </li>
          ))}
        </ol>
      )
  }
}
