import { useState } from 'react'
import {
  Bot,
  Cable,
  Cpu,
  HardDrive,
  Info,
  Lock,
  Palette,
  Puzzle,
  Settings2,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { IconTile, cn } from '../../ui'
import { AboutSection } from './AboutSection'
import { AppearanceSection, GeneralSection } from './GeneralAppearance'
import { IntegrationsSection, PluginsSection } from './IntegrationsPlugins'
import { ModelsSection, PrivacySection } from './ModelsPrivacy'
import { ProvidersSection } from './ProvidersSection'
import { ProcessingSection, StorageSection } from './StorageProcessing'

const CATS: { id: string; label: string; icon: LucideIcon; color: string; View: () => React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: Settings2, color: '#7C8597', View: GeneralSection },
  { id: 'appearance', label: 'Appearance', icon: Palette, color: '#6E8BFF', View: AppearanceSection },
  { id: 'providers', label: 'AI Providers', icon: Bot, color: '#9B7BEA', View: ProvidersSection },
  { id: 'models', label: 'Model Settings', icon: SlidersHorizontal, color: '#2BA8B8', View: ModelsSection },
  { id: 'privacy', label: 'Privacy', icon: Lock, color: '#2FB37E', View: PrivacySection },
  { id: 'storage', label: 'Storage', icon: HardDrive, color: '#E8A33C', View: StorageSection },
  { id: 'processing', label: 'Processing', icon: Cpu, color: '#E5484D', View: ProcessingSection },
  { id: 'integrations', label: 'Integrations', icon: Cable, color: '#C27C4A', View: IntegrationsSection },
  { id: 'plugins', label: 'Plugins', icon: Puzzle, color: '#6E8BFF', View: PluginsSection },
  { id: 'about', label: 'About', icon: Info, color: '#7C8597', View: AboutSection },
]

export function SettingsPage() {
  const [cat, setCat] = useState('general')
  const current = CATS.find((c) => c.id === cat)!
  return (
    <div className="flex h-full">
      <nav className="w-[232px] shrink-0 overflow-auto p-3" aria-label="Settings categories">
        <h1 className="mb-3 px-2 pt-2 text-[22px] font-semibold tracking-tight">Settings</h1>
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            aria-current={cat === c.id}
            className={cn(
              'flex h-9 w-full items-center gap-2.5 rounded-xl px-2 text-[13px]',
              cat === c.id ? 'bg-raised font-medium' : 'hover:bg-raised/60',
            )}
          >
            <IconTile icon={c.icon} color={c.color} size={24} />
            {c.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[680px] px-8 py-7">
          <h2 className="mb-5 text-[18px] font-semibold">{current.label}</h2>
          <current.View />
        </div>
      </div>
    </div>
  )
}
