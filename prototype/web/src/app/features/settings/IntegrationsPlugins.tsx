import { useStore } from '../../state/StoreProvider'
import { Button, Row, Switch, Tag } from '../../ui'
import { Group, TestResult, useConnectionTests } from './primitives'

export function IntegrationsSection() {
  const { settings: s, setSetting } = useStore()
  const { tests, run } = useConnectionTests()
  return (
    <Group
      title="Bibliographic providers"
      footer="Lookups are simulated in this prototype. No API calls are made."
    >
      {Object.keys(s.integrations).map((k) => (
        <Row key={k} label={k} sub={<TestResult t={tests[k]} />}>
          <Button
            size="sm"
            variant="ghost"
            disabled={!s.integrations[k]}
            onClick={() => run(k, true, 'Simulated response OK', '')}
          >
            Test
          </Button>
          <Switch
            label={k}
            checked={s.integrations[k]}
            onChange={(v) => setSetting('integrations', { ...s.integrations, [k]: v })}
          />
        </Row>
      ))}
    </Group>
  )
}

export function PluginsSection() {
  const { settings: s, setSetting, toast } = useStore()
  const toggle = (k: string, v: boolean) => {
    setSetting('plugins', { ...s.plugins, [k]: v })
    toast(`${k} ${v ? 'enabled' : 'disabled'}`)
  }
  return (
    <>
      <Group title="Installed">
        {Object.keys(s.plugins).map((k) => (
          <Row key={k} label={k} sub={s.plugins[k] ? 'Enabled' : 'Disabled'}>
            <Switch label={k} checked={s.plugins[k]} onChange={(v) => toggle(k, v)} />
          </Row>
        ))}
      </Group>
      <Group title="Permissions">
        <Row label="Typst Export" sub="Read project notes · write to outputs folder">
          <Tag mono>2 permissions</Tag>
        </Row>
        <Row label="BibTeX Tools" sub="Read and write citation records">
          <Tag mono>1 permission</Tag>
        </Row>
      </Group>
      <Group
        title="Future extensions"
        footer="Sandboxed plugin runtime is planned for the native app. Prototype preview only."
      >
        <Row label="Plugin marketplace" sub="Not available in prototype">
          <Button size="sm" disabled>
            Browse (unavailable)
          </Button>
        </Row>
      </Group>
    </>
  )
}
