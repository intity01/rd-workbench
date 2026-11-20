import { useEffect, useRef, useState } from 'react'
import { Copy, FileText, Lightbulb, NotebookPen, RefreshCw, Send, Sparkles, Square } from 'lucide-react'
import type { Source } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, EmptyState, Kbd, Segmented, StatusGlyph, Tag } from '../../ui'
import { MessageBubble } from './MessageBubble'
import type { useAssistant } from './useAssistant'

export type Scope = 'document' | 'project'

type Props = {
  width: number
  src?: Source
  scope: Scope
  setScope: (s: Scope) => void
  scopeSources: Source[]
  assistant: ReturnType<typeof useAssistant>
  openSource: (id: string, page?: number, flash?: string) => void
}

export function AssistantPane({ width, src, scope, setScope, scopeSources, assistant, openSource }: Props) {
  const { settings, projects, currentProjectId, setNoteDraft, addNode, toast } = useStore()
  const { messages, generating, ask, stop, regenerate, lastAnswer } = assistant
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, generating])

  const send = () => {
    ask(text)
    setText('')
  }
  const cite = lastAnswer?.citations?.[0]
  const saveNote = () =>
    lastAnswer &&
    setNoteDraft({
      title: 'Assistant answer',
      body: lastAnswer.text,
      projectId: currentProjectId,
      sourceId: cite?.sourceId,
      page: cite?.page,
      tags: ['assistant'],
    })
  const createClaim = () => {
    if (!lastAnswer) return
    const label = lastAnswer.text.split('. ')[0].slice(0, 90)
    const id = addNode({
      type: 'claim',
      label,
      desc: lastAnswer.text,
      x: 600,
      y: 820,
      projectId: currentProjectId,
      sourceId: cite?.sourceId,
      page: cite?.page,
    })
    toast('Claim created in Knowledge Map', 'success', { label: 'Open', to: `/map?node=${id}` })
  }
  const copy = () =>
    lastAnswer &&
    navigator.clipboard?.writeText(lastAnswer.text).then(
      () => toast('Answer copied'),
      () => toast('Clipboard unavailable in this browser', 'error'),
    )
  const onCite = (sid: string, p: number) =>
    openSource(sid, p, sid === 'SRC-001' && p === 4 ? 'keeps the desktop interface responsive' : undefined)

  return (
    <aside style={{ width }} className="flex shrink-0 flex-col">
      <div className="flex h-12 items-center gap-2 px-3">
        <Sparkles size={15} aria-hidden />
        <span className="flex-1 text-[13px] font-semibold">Research Assistant</span>
        <Tag mono>{settings.researchModel}</Tag>
      </div>
      <div className="mx-3 mb-2 space-y-2 rounded-2xl bg-surface-2 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted">Research scope</span>
          <Segmented
            size="sm"
            label="Research scope"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'document', label: 'Document' },
              { value: 'project', label: 'Project' },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {scopeSources.map((s) => (
            <button
              key={s.id}
              onClick={() => openSource(s.id)}
              className="inline-flex h-6 items-center gap-1 rounded-full bg-raised px-2 text-[11px] hover:bg-hover"
            >
              <FileText size={11} className="text-muted" aria-hidden />
              {s.title}
            </button>
          ))}
        </div>
        <p className="text-[10.5px] text-muted">
          {projects.find((p) => p.id === (src?.projectId ?? currentProjectId))?.name} · deterministic mock
          responses, not live AI.
        </p>
      </div>
      <div className="flex-1 space-y-3 overflow-auto px-3 py-2" aria-live="polite">
        {messages.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="Ask about your sources"
            body="Answers cite the exact document and page."
          />
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} onCite={onCite} />
        ))}
        {generating && (
          <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3.5 py-2.5 text-xs text-muted">
            <StatusGlyph kind="busy" /> Searching {scope === 'document' ? '1 document' : 'project sources'}…
          </div>
        )}
        <div ref={end} />
      </div>
      {lastAnswer && (
        <div className="flex flex-wrap gap-1 px-3 py-2">
          <Button size="sm" variant="ghost" icon={RefreshCw} disabled={generating} onClick={regenerate}>
            Regenerate
          </Button>
          <Button size="sm" variant="ghost" icon={NotebookPen} onClick={saveNote}>
            Save as Note
          </Button>
          <Button size="sm" variant="ghost" icon={Lightbulb} onClick={createClaim}>
            Create Claim
          </Button>
          <Button size="sm" variant="ghost" icon={Copy} onClick={copy}>
            Copy Answer
          </Button>
        </div>
      )}
      <div className="p-3 pt-1">
        <div className="rounded-2xl bg-raised focus-within:ring-2 focus-within:ring-signal-ink">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
            rows={3}
            placeholder="Ask about the selected sources…"
            className="block w-full resize-none bg-transparent px-3.5 py-3 text-[13px] outline-none placeholder:text-muted"
            aria-label="Message the research assistant"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="flex items-center gap-1 pl-1.5 text-[10.5px] text-muted">
              <Kbd>Ctrl</Kbd>
              <Kbd>Enter</Kbd>
            </span>
            {generating ? (
              <Button size="sm" variant="danger" icon={Square} onClick={stop}>
                Stop
              </Button>
            ) : (
              <Button size="sm" variant="primary" icon={Send} disabled={!text.trim()} onClick={send}>
                Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
