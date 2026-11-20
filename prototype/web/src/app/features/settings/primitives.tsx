import { useState, type ReactNode } from 'react'
import { cn, field } from '../../ui'

/** iOS-style grouped list: caption, solid container, footnote. */
export function Group({
  title,
  footer,
  children,
}: {
  title?: string
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mb-6">
      {title && <h3 className="mb-1.5 px-4 text-[11px] font-medium text-muted">{title}</h3>}
      <div className="divide-y divide-line overflow-hidden rounded-2xl bg-surface-2">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[11.5px] leading-relaxed text-muted">{footer}</p>}
    </section>
  )
}

export function Sel({
  value,
  options,
  onChange,
  label,
  w = 'w-56',
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  label: string
  w?: string
}) {
  return (
    <select
      aria-label={label}
      className={field(`h-8 rounded-full text-[13px] ${w}`)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )
}

export type TestState = { state: 'testing' | 'ok' | 'error'; msg?: string }

export function TestResult({ t }: { t?: TestState }) {
  if (!t) return null
  const cls = t.state === 'ok' ? 'text-success' : t.state === 'error' ? 'text-danger' : 'text-muted'
  return (
    <span className={cn('text-[11.5px] font-medium', cls)}>{t.state === 'testing' ? 'Testing…' : t.msg}</span>
  )
}

/** Simulated connection tests: resolve after a delay without any network access. */
export function useConnectionTests() {
  const [tests, setTests] = useState<Record<string, TestState>>({})
  const run = (name: string, ok: boolean, okMsg: string, errMsg: string) => {
    setTests((t) => ({ ...t, [name]: { state: 'testing' } }))
    setTimeout(
      () =>
        setTests((t) => ({
          ...t,
          [name]: ok ? { state: 'ok', msg: okMsg } : { state: 'error', msg: errMsg },
        })),
      1000,
    )
  }
  return { tests, run }
}
