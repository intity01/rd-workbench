import { useStore } from '../../state/StoreProvider'
import type { Settings } from '../../state/settings'
import { Row, Segmented, Switch, cn } from '../../ui'
import { Group, Sel } from './primitives'

function useSet() {
  const { setSetting } = useStore()
  return <K extends keyof Settings>(k: K) =>
    (v: Settings[K]) =>
      setSetting(k, v)
}

export function GeneralSection() {
  const { settings: s } = useStore()
  const set = useSet()
  return (
    <>
      <Group title="Language">
        <Row label="Interface language" sub="Navigation and greetings switch immediately">
          <Segmented
            label="Language"
            value={s.language}
            onChange={set('language')}
            options={[
              { value: 'English', label: 'English' },
              { value: 'ไทย', label: 'ไทย' },
            ]}
          />
        </Row>
      </Group>
      <Group title="Startup">
        <Row label="Open on launch">
          <Sel
            label="Open on launch"
            value={s.startup}
            onChange={set('startup')}
            options={['Home', 'Last project', 'Research Workspace']}
          />
        </Row>
        <Row label="Reopen last documents">
          <Switch label="Reopen last documents" checked={s.reopenLast} onChange={set('reopenLast')} />
        </Row>
      </Group>
      <Group title="Application" footer="When off, deletes happen immediately without a confirmation dialog.">
        <Row label="Confirm destructive actions">
          <Switch
            label="Confirm destructive actions"
            checked={s.confirmDeletes}
            onChange={set('confirmDeletes')}
          />
        </Row>
      </Group>
    </>
  )
}

function ThemeCard({ t, on, onPick }: { t: 'dark' | 'light'; on: boolean; onPick: () => void }) {
  const dark = t === 'dark'
  return (
    <button
      onClick={onPick}
      aria-pressed={on}
      className={cn('rounded-2xl p-2 text-left', on ? 'bg-fg text-app' : 'hover:bg-raised')}
    >
      <div className={cn('flex h-20 gap-1.5 rounded-xl p-1.5', dark ? 'bg-[#0A0A0B]' : 'bg-[#F3F3F1]')}>
        <div className={cn('w-8 rounded-lg', dark ? 'bg-[#18181B]' : 'bg-white')} />
        <div className={cn('flex-1 rounded-lg p-2', dark ? 'bg-[#18181B]' : 'bg-white')}>
          <div className="h-2 w-10 rounded-full bg-[#D4F07A]" />
        </div>
      </div>
      <div className="mt-2 px-1 text-[13px] font-medium capitalize">{t}</div>
    </button>
  )
}

export function AppearanceSection() {
  const { settings: s, setSetting } = useStore()
  const set = useSet()
  return (
    <>
      <Group title="Theme">
        <div className="grid grid-cols-2 gap-2 p-2">
          {(['dark', 'light'] as const).map((t) => (
            <ThemeCard key={t} t={t} on={s.theme === t} onPick={() => setSetting('theme', t)} />
          ))}
        </div>
      </Group>
      <Group
        title="Typography"
        footer="Inter for interface, Noto Sans Thai for Thai text, JetBrains Mono for identifiers and DOIs."
      >
        <Row label="Text size">
          <Segmented
            label="Text size"
            value={s.textSize}
            onChange={set('textSize')}
            options={[
              { value: 'small', label: 'Small' },
              { value: 'default', label: 'Default' },
              { value: 'large', label: 'Large' },
            ]}
          />
        </Row>
        <Row
          label="Preview"
          sub={
            <span lang="th">
              ตัวอย่างข้อความภาษาไทย · Mixed English text · <span className="font-mono">10.5555/sample</span>
            </span>
          }
        />
      </Group>
      <Group title="Layout">
        <Row label="Interface density">
          <Segmented
            label="Density"
            value={s.density}
            onChange={set('density')}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
          />
        </Row>
        <Row label="Sidebar">
          <Segmented
            label="Sidebar"
            value={s.sidebar}
            onChange={set('sidebar')}
            options={[
              { value: 'expanded', label: 'Expanded' },
              { value: 'collapsed', label: 'Collapsed' },
            ]}
          />
        </Row>
      </Group>
    </>
  )
}
