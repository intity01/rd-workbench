import {
  Atom,
  CircleCheckBig,
  CircleHelp,
  FileCheck,
  FileText,
  Layers,
  Lightbulb,
  Swords,
  type LucideIcon,
} from 'lucide-react'
import type { NodeType } from '../../data/types'

export const NODE_ICON: Record<NodeType, LucideIcon> = {
  claim: Lightbulb,
  evidence: FileCheck,
  counter: Swords,
  question: CircleHelp,
  decision: CircleCheckBig,
  topic: Layers,
  concept: Atom,
  document: FileText,
}
