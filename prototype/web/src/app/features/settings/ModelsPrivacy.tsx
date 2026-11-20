import { useStore } from '../../state/StoreProvider'
import { Button, Row, Segmented, Switch, Tag } from '../../ui'
import { Group, Sel } from './primitives'

const MODELS = ['local / sample-8b (mock)', 'local / sample-3b (mock)', 'cloud / sample-large (mock)']
const MODEL_ROWS = [
  ['Default model', 'defaultModel'],
  ['Research model', 'researchModel'],
  ['Summarization model', 'summaryModel'],
] as const

export function ModelsSection() {
  const { settings: s, setSetting } = useStore()
  return (
    <Group
      title="Models"
      footer="Models marked (mock) are placeholders used by the deterministic assistant. The research model is shown in the assistant header."
    >
      {MODEL_ROWS.map(([l, k]) => (
        <Row key={k} label={l}>
          <Sel label={l} value={s[k]} onChange={(v) => setSetting(k, v)} options={MODELS} />
        </Row>
      ))}
      <Row label="Fallback provider">
        <Sel
          label="Fallback provider"
          value={s.fallback}
          onChange={(v) => setSetting('fallback', v)}
          options={['None', 'OpenAI', 'Anthropic', 'Google', 'Local Models']}
        />
      </Row>
      <Row label="Model routing">
        <Sel
          label="Model routing"
          value={s.routing}
          onChange={(v) => setSetting('routing', v)}
          options={['Local first, ask before cloud', 'Local only', 'Best available']}
        />
      </Row>
    </Group>
  )
}

export function PrivacySection() {
  const { settings: s, setSetting, projects, updateProject, toast } = useStore()
  const flip = (id: string, name: string, mode: string) => {
    const m = mode === 'Local-first' ? 'Cloud-assisted' : 'Local-first'
    updateProject(id, { mode: m })
    toast(`${name}: ${m}`)
  }
  return (
    <>
      <Group title="Mode">
        <Row
          label="Processing mode"
          sub={s.localOnly ? 'Nothing leaves this machine' : 'Selected requests may use cloud providers'}
        >
          <Segmented
            label="Mode"
            value={s.localOnly ? 'local' : 'cloud'}
            onChange={(v) => setSetting('localOnly', v === 'local')}
            options={[
              { value: 'local', label: 'Local-only' },
              { value: 'cloud', label: 'Cloud-assisted' },
            ]}
          />
        </Row>
      </Group>
      <Group
        title="Data sharing"
        footer={s.localOnly ? 'Cloud options are disabled in Local-only mode.' : undefined}
      >
        <Row label="Allow document excerpts" sub="Send selected passages to cloud models">
          <Switch
            label="Allow document excerpts"
            disabled={s.localOnly}
            checked={s.allowExcerpts && !s.localOnly}
            onChange={(v) => setSetting('allowExcerpts', v)}
          />
        </Row>
        <Row label="Allow external metadata lookup" sub="DOI and title lookups with OpenAlex / Crossref">
          <Switch
            label="Allow external metadata lookup"
            checked={s.allowMetadata}
            onChange={(v) => setSetting('allowMetadata', v)}
          />
        </Row>
      </Group>
      <Group title="Per-project">
        {projects.map((p) => (
          <Row key={p.id} label={p.name}>
            <Tag tone={p.mode === 'Local-first' ? 'signal' : 'neutral'}>{p.mode}</Tag>
            <Button size="sm" variant="ghost" onClick={() => flip(p.id, p.name, p.mode)}>
              Switch
            </Button>
          </Row>
        ))}
      </Group>
    </>
  )
}
