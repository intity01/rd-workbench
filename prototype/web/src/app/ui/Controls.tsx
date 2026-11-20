import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from './cn'

const BASE =
  'bg-raised text-fg placeholder:text-muted outline-none focus:ring-2 focus:ring-signal-ink disabled:opacity-45'
const DEFAULTS: [RegExp, string][] = [
  [/(^|\s)w-/, 'w-full'],
  [/(^|\s)h-/, 'h-9'],
  [/(^|\s)rounded-/, 'rounded-lg'],
  [/(^|\s)px-/, 'px-3'],
  [/(^|\s)text-(xs|sm|base|\[\d)/, 'text-sm'],
]

/** Field classes: defaults apply only to groups the caller did not override, so classes never conflict. */
export const field = (extra = '') =>
  [BASE, ...DEFAULTS.filter(([re]) => !re.test(extra)).map(([, d]) => d), extra].join(' ')
export const inputCls = field()
export const textareaCls = `${BASE} w-full rounded-lg resize-y px-3 py-2 text-sm leading-relaxed`

export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string
  hint?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  )
}

type SwitchProps = { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }

/** Fixed-size switch; never shrinks inside tight rows. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-40',
        checked ? 'bg-signal' : 'bg-hover',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform',
          checked ? 'translate-x-4 bg-on-signal' : 'bg-muted',
        )}
      />
    </button>
  )
}

type Option<T> = { value: T; label: string; icon?: LucideIcon }
type SegmentedProps<T> = {
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  label: string
  size?: 'sm' | 'md'
  full?: boolean
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
  full,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex rounded-full bg-raised p-0.5', full && 'flex w-full')}
    >
      {options.map((o) => {
        const on = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-full px-3 font-medium whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-6 text-[11px]' : 'h-7 text-xs',
              full && 'flex-1',
              on ? 'bg-selected text-fg shadow-sm' : 'text-muted hover:text-fg',
            )}
          >
            {Icon && <Icon size={13} aria-hidden />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
