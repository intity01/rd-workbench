import type { ReactNode } from 'react'
import { Check, Minus, X, type LucideIcon } from 'lucide-react'
import type { CheckState, ProcStatus, VerifyState } from '../data/types'
import { cn } from './cn'

type Tone = 'neutral' | 'signal' | 'inverse'

const TONES: Record<Tone, string> = {
  neutral: 'bg-raised text-muted',
  signal: 'bg-signal text-on-signal',
  inverse: 'bg-fg text-app',
}

/** Solid tag. `mono` renders the small uppercase technical label style (e.g. ACTION, p.4). */
export function Tag({
  tone = 'neutral',
  mono,
  children,
  className,
}: {
  tone?: Tone
  mono?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 whitespace-nowrap',
        mono ? 'font-mono text-[10px] font-medium tracking-wide uppercase' : 'text-[11px] font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export type GlyphKind = 'ok' | 'warn' | 'fail' | 'idle' | 'busy' | 'stopped'

const GLYPH: Record<GlyphKind, { bg: string; icon?: LucideIcon }> = {
  ok: { bg: 'bg-success text-white', icon: Check },
  warn: { bg: 'bg-warning text-[#1d1400]', icon: Minus },
  fail: { bg: 'bg-danger text-white', icon: X },
  stopped: { bg: 'bg-muted text-app', icon: Minus },
  idle: { bg: 'bg-raised' },
  busy: { bg: '' },
}

/** Filled status circle. Shape (icon) carries meaning as well as colour. */
export function StatusGlyph({ kind, size = 14 }: { kind: GlyphKind; size?: number }) {
  if (kind === 'busy')
    return (
      <span
        aria-hidden
        className="inline-block shrink-0 animate-spin rounded-full border-2 border-raised border-t-signal-ink"
        style={{ width: size, height: size }}
      />
    )
  const g = GLYPH[kind]
  const Icon = g.icon
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full', g.bg)}
      style={{ width: size, height: size }}
    >
      {Icon ? (
        <Icon size={size * 0.68} strokeWidth={3.2} />
      ) : (
        <span className="h-1 w-1 rounded-full bg-muted" />
      )}
    </span>
  )
}

const PROC: Record<ProcStatus, GlyphKind> = {
  Queued: 'idle',
  Running: 'busy',
  Completed: 'ok',
  Failed: 'fail',
  Cancelled: 'stopped',
}

/** Processing status: glyph + plain label. */
export function StatusTag({ status, label }: { status: ProcStatus; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-fg">
      <StatusGlyph kind={PROC[status]} />
      {label ?? status}
    </span>
  )
}

const VERIFY: Record<VerifyState | CheckState, { kind: GlyphKind; label: string }> = {
  Matched: { kind: 'ok', label: 'Metadata Matched' },
  Found: { kind: 'ok', label: 'Found' },
  'Needs Review': { kind: 'warn', label: 'Needs Review' },
  Mismatch: { kind: 'fail', label: 'Metadata Mismatch' },
  'Not Checked': { kind: 'idle', label: 'Not Checked' },
}

export const verifyGlyph = (s: VerifyState | CheckState) => VERIFY[s].kind

export function VerifyTag({ state, short }: { state: VerifyState | CheckState; short?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-fg">
      <StatusGlyph kind={VERIFY[state].kind} />
      {short ? state : VERIFY[state].label}
    </span>
  )
}

/** Small solid colour square used next to a type label. */
export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-[3px]"
      style={{ width: size, height: size, background: color }}
    />
  )
}
