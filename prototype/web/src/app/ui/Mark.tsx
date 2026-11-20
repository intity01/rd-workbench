import { Fragment } from 'react'
import { esc } from './cn'

/** Emphasise query terms inside text. */
export function Mark({ text, terms, cls = 'q' }: { text: string; terms: string[]; cls?: string }) {
  const t = terms.filter((x) => x.length > 1)
  if (!t.length) return <>{text}</>
  const re = new RegExp(`(${t.map(esc).join('|')})`, 'gi')
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 ? (
          <mark key={i} className={cls}>
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
