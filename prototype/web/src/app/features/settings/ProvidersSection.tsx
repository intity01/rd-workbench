import { useState } from 'react'
import { Eye, EyeOff, TriangleAlert } from 'lucide-react'
import { useStore } from '../../state/StoreProvider'
import { Button, field } from '../../ui'
import { Group, TestResult, useConnectionTests } from './primitives'

export function ProvidersSection() {
  const { settings: s, setSetting } = useStore()
  const { tests, run } = useConnectionTests()
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [localUrl, setLocalUrl] = useState('http://localhost:11434')
  const [customUrl, setCustomUrl] = useState('')

  const keyRow = (name: string) => {
    const key = s.keys[name] ?? ''
    const test = () =>
      run(
        name,
        key.trim().length >= 8,
        'Simulated: key format looks valid (no request sent)',
        key.trim() ? 'Simulated: key looks too short' : 'Enter a key first',
      )
    return (
      <div key={name} className="px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium">{name}</span>
          <TestResult t={tests[name]} />
        </div>
        <div className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <input
              type={show[name] ? 'text' : 'password'}
              autoComplete="off"
              className={field('h-8 rounded-full pr-9 font-mono text-[12px]')}
              placeholder={`${name} API key`}
              value={key}
              onChange={(e) => setSetting('keys', { ...s.keys, [name]: e.target.value })}
              aria-label={`${name} API key`}
            />
            <button
              className="absolute top-1.5 right-3 text-muted hover:text-fg"
              aria-label={show[name] ? 'Hide key' : 'Show key'}
              onClick={() => setShow((x) => ({ ...x, [name]: !x[name] }))}
            >
              {show[name] ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Button size="sm" className="h-8" disabled={tests[name]?.state === 'testing'} onClick={test}>
            Test Connection
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-5 flex gap-2.5 rounded-2xl bg-warning px-4 py-3 text-[12.5px] leading-relaxed text-[#1d1400]">
        <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          This prototype does <strong>not</strong> securely store credentials. Keys live only in memory for
          this session and are never sent anywhere. Do not paste real production keys. Connection tests are
          simulated.
        </span>
      </div>
      <Group title="Cloud providers">{['OpenAI', 'Anthropic', 'Google'].map(keyRow)}</Group>
      <Group title="Local models" footer="Endpoint is shown for the future native app; nothing is contacted.">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium">Local runtime endpoint</span>
            <TestResult t={tests.Local} />
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className={field('h-8 flex-1 rounded-full font-mono text-[12px]')}
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              aria-label="Local endpoint"
            />
            <Button
              size="sm"
              className="h-8"
              onClick={() =>
                run(
                  'Local',
                  /^https?:\/\/(localhost|127\.0\.0\.1)/.test(localUrl),
                  'Simulated: 2 sample models listed',
                  'Simulated: endpoint must be localhost',
                )
              }
            >
              Test Connection
            </Button>
          </div>
        </div>
      </Group>
      <Group title="Custom provider">
        <div className="px-4 py-3">
          <input
            className={field('h-8 rounded-full font-mono text-[12px]')}
            placeholder="https://api.example.com/v1"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            aria-label="Custom provider base URL"
          />
        </div>
        {keyRow('Custom')}
      </Group>
    </>
  )
}
