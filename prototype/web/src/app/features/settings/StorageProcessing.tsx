import { useState } from 'react'
import { useStore } from '../../state/StoreProvider'
import { Button, Row, Segmented, field } from '../../ui'
import { Group, Sel } from './primitives'

export function StorageSection() {
  const { settings: s, setSetting, toast, confirm } = useStore()
  const restore = () =>
    confirm({
      title: 'Restore backup?',
      body: 'This would replace the current workspace. In the prototype nothing is changed.',
      confirmLabel: 'Restore',
      onConfirm: () => toast('Restore simulated — workspace unchanged', 'info'),
    })
  const path = field('h-8 w-72 rounded-full font-mono text-[12px]')
  return (
    <>
      <Group title="Locations" footer="Paths are illustrative — the prototype has no file system access.">
        <Row label="Database">
          <input
            className={path}
            value={s.dbPath}
            onChange={(e) => setSetting('dbPath', e.target.value)}
            aria-label="Database location"
          />
        </Row>
        <Row label="Documents">
          <input
            className={path}
            value={s.docPath}
            onChange={(e) => setSetting('docPath', e.target.value)}
            aria-label="Document storage location"
          />
        </Row>
      </Group>
      <Group title="Backup">
        <Row label="Create backup" sub="Snapshot of database and settings">
          <Button size="sm" onClick={() => toast('Backup simulated — no files written')}>
            Back up now
          </Button>
        </Row>
        <Row label="Restore from backup" sub="Replaces current workspace data">
          <Button size="sm" variant="danger" onClick={restore}>
            Restore…
          </Button>
        </Row>
      </Group>
    </>
  )
}

export function ProcessingSection() {
  const { settings: s, setSetting, toast } = useStore()
  const [engine, setEngine] = useState('Adaptive (recommended)')
  const opts = (vs: string[]) => vs.map((v) => ({ value: v, label: v }))
  return (
    <>
      <Group title="Extraction">
        <Row label="PDF extraction engine">
          <Sel
            label="PDF engine"
            value={engine}
            onChange={setEngine}
            options={['Adaptive (recommended)', 'Text layer only', 'Always full pipeline']}
          />
        </Row>
        <Row label="OCR">
          <Sel
            label="OCR"
            value={s.ocr}
            onChange={(v) => setSetting('ocr', v)}
            options={['Only when no text layer', 'Always', 'Never']}
          />
        </Row>
        <Row label="OCR resolution (DPI)">
          <Segmented
            label="DPI"
            value={s.ocrDpi}
            onChange={(v) => setSetting('ocrDpi', v)}
            options={opts(['200', '300', '400'])}
          />
        </Row>
      </Group>
      <Group title="Compute" footer="Worker counts apply to the future native app.">
        <Row label="CPU / GPU preference">
          <Sel
            label="Compute"
            value={s.compute}
            onChange={(v) => setSetting('compute', v)}
            options={['Auto (prefer GPU)', 'CPU only', 'GPU only']}
          />
        </Row>
        <Row label="Document workers">
          <Segmented
            label="Workers"
            value={s.workers}
            onChange={(v) => setSetting('workers', v)}
            options={opts(['1', '2', '4'])}
          />
        </Row>
        <Row label="Restart workers">
          <Button size="sm" onClick={() => toast('Workers restarted (simulated)')}>
            Restart
          </Button>
        </Row>
      </Group>
    </>
  )
}
