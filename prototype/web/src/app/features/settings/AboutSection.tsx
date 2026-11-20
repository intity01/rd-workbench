import { useStore } from '../../state/StoreProvider'
import { Button, LogoMark, Row } from '../../ui'
import { Group } from './primitives'

const LICENSES = [
  'Inter — SIL Open Font License',
  'Noto Sans Thai — SIL Open Font License',
  'JetBrains Mono — SIL Open Font License',
  'Lucide icons — ISC License',
]

export function AboutSection() {
  const { toast } = useStore()
  const copy = () =>
    navigator.clipboard?.writeText('R&D Workbench 0.1.0-prototype').then(
      () => toast('Diagnostics copied'),
      () => toast('Clipboard unavailable', 'error'),
    )
  return (
    <>
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
        <LogoMark size={56} />
        <div>
          <div className="text-[16px] font-semibold">R&amp;D Workbench</div>
          <div className="text-xs text-muted">Research. Understand. Build.</div>
          <div className="mt-1 font-mono text-[11px] text-muted">0.1.0-prototype · UI preview build</div>
        </div>
      </div>
      <Group title="Licenses">
        {LICENSES.map((l) => (
          <Row key={l} label={l} />
        ))}
      </Group>
      <Group title="Diagnostics">
        <Row label="Copy diagnostics" sub="Prototype build info, no personal data">
          <Button size="sm" onClick={copy}>
            Copy
          </Button>
        </Row>
      </Group>
    </>
  )
}
