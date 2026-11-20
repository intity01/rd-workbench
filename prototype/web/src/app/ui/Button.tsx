import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'signal'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-fg text-app hover:opacity-90',
  secondary: 'bg-raised text-fg hover:bg-hover',
  ghost: 'text-muted hover:bg-raised hover:text-fg',
  danger: 'bg-danger text-white hover:opacity-90',
  signal: 'bg-signal text-on-signal hover:opacity-90',
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md'
  icon?: LucideIcon
}

/** Solid pill button. No outlined variants by design. */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...rest
}: BtnProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors select-none disabled:opacity-40',
        size === 'sm' ? 'h-7 px-3 text-xs' : 'h-8 px-3.5 text-[0.8125rem]',
        VARIANTS[variant],
        className,
      )}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : 14} strokeWidth={2.2} aria-hidden />}
      {children}
    </button>
  )
}

type IconBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: LucideIcon
  active?: boolean
  solid?: boolean
  side?: 'right'
  size?: number
}

/** Circular icon button with a tooltip. `solid` gives the filled look used for primary icon actions. */
export function IconButton({
  label,
  icon: Icon,
  active,
  solid,
  side,
  className,
  size = 32,
  ...rest
}: IconBtnProps) {
  return (
    <button
      aria-label={label}
      data-tip={label}
      data-tip-side={side}
      {...rest}
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-35',
        active
          ? 'bg-fg text-app'
          : solid
            ? 'bg-raised text-fg hover:bg-hover'
            : 'text-muted hover:bg-raised hover:text-fg',
        className,
      )}
    >
      <Icon size={Math.round(size / 2.1)} strokeWidth={2} aria-hidden />
    </button>
  )
}
