import { useRef, useState } from 'react'
import type { Source } from '../../data/types'
import { mockAnswer, type Answer } from '../../lib/assistant'
import { useStore } from '../../state/StoreProvider'

const LATENCY_MS = 1300

/** Conversation controller for the mock assistant: ask, stop, regenerate. */
export function useAssistant(src: Source | undefined, page: number, scopeLabel: string) {
  const { messages, setMessages, nextId, toast } = useStore()
  const [generating, setGenerating] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const respond = (fn: () => Answer, after?: () => void) => {
    setGenerating(true)
    timer.current = window.setTimeout(() => {
      setMessages((m) => [...m, { id: nextId('M'), ...fn() }])
      setGenerating(false)
      after?.()
    }, LATENCY_MS)
  }

  const ask = (text: string, answer?: Answer) => {
    if (!text.trim() || generating) return
    setMessages((m) => [...m, { id: nextId('M'), role: 'user', text }])
    respond(() => answer ?? mockAnswer(text, src, page, scopeLabel))
  }

  const stop = () => {
    clearTimeout(timer.current)
    setGenerating(false)
    setMessages((m) => [...m, { id: nextId('M'), role: 'system', text: 'Generation stopped.' }])
  }

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser || generating) return
    setMessages((m) => {
      const idx = m.map((x) => x.role).lastIndexOf('assistant')
      return idx > m.map((x) => x.role).lastIndexOf('user') ? m.slice(0, idx) : m
    })
    respond(
      () => mockAnswer(lastUser.text, src, page, scopeLabel),
      () => toast('Response regenerated (deterministic mock)', 'info'),
    )
  }

  const lastAnswer = [...messages].reverse().find((m) => m.role === 'assistant')
  return { messages, generating, ask, stop, regenerate, lastAnswer }
}
