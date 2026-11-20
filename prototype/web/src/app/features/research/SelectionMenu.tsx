import {
  Highlighter,
  Lightbulb,
  NotebookPen,
  Scale,
  SearchCheck,
  Sparkles,
  Swords,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'

export type SelectionKind =
  | 'Explain'
  | 'Summarize'
  | 'Compare'
  | 'Support'
  | 'Contradict'
  | 'Note'
  | 'Graph'
  | 'Highlight'

const ITEMS: [SelectionKind, string, LucideIcon][] = [
  ['Explain', 'Explain Selection', Lightbulb],
  ['Summarize', 'Summarize', Sparkles],
  ['Compare', 'Compare with Other Sources', Scale],
  ['Support', 'Find Supporting Evidence', SearchCheck],
  ['Contradict', 'Find Contradictions', Swords],
  ['Note', 'Create Note', NotebookPen],
  ['Graph', 'Add to Knowledge Graph', Waypoints],
  ['Highlight', 'Highlight', Highlighter],
]

export type Selection = { text: string; x: number; y: number }

/** Floating menu above a text selection in the reader. */
export function SelectionMenu({ sel, onPick }: { sel: Selection; onPick: (k: SelectionKind) => void }) {
  return (
    <div
      data-selmenu
      role="menu"
      aria-label="Selection actions"
      className="fixed z-40 w-[260px] rounded-2xl bg-card p-1.5 shadow-pop"
      style={{ left: sel.x, top: sel.y, transform: 'translateY(-100%)' }}
    >
      {ITEMS.map(([k, label, Icon], i) => (
        <button
          key={k}
          role="menuitem"
          onClick={() => onPick(k)}
          className={`flex h-8 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[13px] hover:bg-raised ${i === 5 ? 'mt-1' : ''}`}
        >
          <Icon size={14} className="text-muted" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}
