import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from './cn'

/** Solid container. Separation comes from tone, not outlines. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl bg-surface-2', className)}>{children}</section>
}

type HeaderProps = { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }

export function PageHeader({ title, subtitle, actions, eyebrow }: HeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6 px-6 pt-6 pb-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-xs text-muted">{eyebrow}</div>}
        <h1 className="truncate text-[24px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({
  children,
  action,
  count,
}: {
  children: ReactNode
  action?: ReactNode
  count?: number
}) {
  return (
    <div className="flex h-11 items-center justify-between gap-2 px-4">
      <h3 className="flex items-center gap-2 text-[13px] font-semibold">
        {children}
        {count !== undefined && (
          <span className="rounded-md bg-raised px-1.5 font-mono text-[10px] text-muted">{count}</span>
        )}
      </h3>
      {action}
    </div>
  )
}

type EmptyProps = { icon: LucideIcon; title: string; body?: string; action?: ReactNode }

export function EmptyState({ icon: Icon, title, body, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-raised text-muted">
        <Icon size={17} aria-hidden />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-raised px-1 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  )
}

type ProgressTone = 'signal' | 'fg' | 'success' | 'warning' | 'danger'
const BAR: Record<ProgressTone, string> = {
  signal: 'bg-signal',
  fg: 'bg-fg',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function Progress({
  value,
  tone = 'fg',
  className,
}: {
  value: number
  tone?: ProgressTone
  className?: string
}) {
  return (
    <div
      className={cn('h-1 w-full overflow-hidden rounded-full bg-raised', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', BAR[tone])}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

/** Label-left / control-right row used by inspectors and settings. */
export function Row({ label, sub, children }: { label: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center gap-4 px-4 py-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px]">{label}</div>
        {sub && <div className="text-[11.5px] text-muted">{sub}</div>}
      </div>
      {children}
    </div>
  )
}
