import { AudioLines, BookOpen, Cpu, FlaskConical, Globe, Network, type LucideIcon } from 'lucide-react'

/**
 * R&D Workbench mark: one continuous stroke that dips twice (research → understand)
 * and rises into a solid node (build). Solid tile, no gradient, no outline.
 */
export function LogoMark({ size = 28, tile = true }: { size?: number; tile?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="R&D Workbench" role="img">
      {tile && <rect width="64" height="64" rx="16" fill="#1A1A1D" />}
      <path
        d="M13 21 C15 33 18 44 22 44 C26 44 27.5 30 31 30 C34.5 30 36 44 40 44 C44 44 46.5 32 48.5 24"
        fill="none"
        stroke={tile ? '#EDEDEF' : 'currentColor'}
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="18" r="5.6" fill="#D4F07A" />
    </svg>
  )
}

const ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  cpu: { icon: Cpu, color: '#6E8BFF' },
  audio: { icon: AudioLines, color: '#E8A33C' },
  globe: { icon: Globe, color: '#2FB37E' },
  flask: { icon: FlaskConical, color: '#9B7BEA' },
  book: { icon: BookOpen, color: '#2BA8B8' },
  network: { icon: Network, color: '#E5484D' },
}
export const PROJECT_ICONS = Object.keys(ICONS)

/** Solid colour tile with a white glyph. */
export function IconTile({
  icon: Icon,
  color,
  size = 32,
}: {
  icon: LucideIcon
  color: string
  size?: number
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[30%] text-white"
      style={{ width: size, height: size, background: color }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.2} aria-hidden />
    </span>
  )
}

export function ProjectIcon({ icon, size = 32 }: { icon: string; size?: number }) {
  const m = ICONS[icon] ?? ICONS.cpu
  return <IconTile icon={m.icon} color={m.color} size={size} />
}
