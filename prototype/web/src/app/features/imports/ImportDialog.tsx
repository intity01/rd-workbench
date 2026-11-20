import { useEffect, useRef, useState } from 'react'
import { Check, CircleAlert, FileText, FolderOpen, Upload, X } from 'lucide-react'
import type { SourceType } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, Field, Modal, inputCls, textareaCls, field } from '../../ui'
import {
  METHODS,
  SAMPLE_BIBTEX,
  SAMPLE_DOCS,
  SAMPLE_PDFS,
  isHttpUrl,
  parseBibTitles,
  type Method,
} from './methods'

const TYPE: Record<Method, SourceType> = {
  pdf: 'PDF',
  url: 'URL',
  folder: 'PDF',
  bibtex: 'BibTeX',
  other: 'Document',
}

export function ImportDialog({
  method,
  onClose,
  onAdded,
}: {
  method: Method
  onClose: () => void
  onAdded: (id: string) => void
}) {
  const { projects, currentProjectId, addSource, toast } = useStore()
  const [pid, setPid] = useState(currentProjectId || projects[0]?.id || '')
  const [picked, setPicked] = useState<string[]>([])
  const [url, setUrl] = useState('')
  const [bib, setBib] = useState(SAMPLE_BIBTEX)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setErr('')
    setPicked(method === 'folder' ? SAMPLE_PDFS.slice(0, 2) : [])
  }, [method])
  const m = METHODS.find((x) => x.id === method)!
  const samples = method === 'other' ? SAMPLE_DOCS : SAMPLE_PDFS
  const toggle = (f: string) => setPicked((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]))

  const submit = () => {
    if (!pid) return setErr('Choose a project')
    setErr('')
    const type = TYPE[method]
    if (method === 'url') {
      if (!isHttpUrl(url)) return setErr('Enter a valid http(s) URL, e.g. https://example.org/article')
      setBusy(true)
      return setTimeout(() => {
        const id = addSource({
          title: url.replace(/^https?:\/\//, '').slice(0, 48),
          type,
          projectId: pid,
          url,
          pages: 2,
          journal: 'Web article',
        })
        setBusy(false)
        toast('URL captured — metadata fetch simulated')
        onAdded(id)
      }, 900)
    }
    if (method === 'bibtex') {
      const titles = parseBibTitles(bib)
      if (!titles.length) return setErr('No entries with a title field were found')
      const ids = titles.map((t) =>
        addSource({ title: `${t.slice(0, 40)}.bib`, paperTitle: t, type, projectId: pid, pages: 1 }),
      )
      toast(`${titles.length} BibTeX entr${titles.length > 1 ? 'ies' : 'y'} queued (metadata only)`)
      return onAdded(ids[ids.length - 1])
    }
    if (!picked.length) return setErr('Select at least one file')
    const ids = picked.map((f) => addSource({ title: f, type, projectId: pid }))
    toast(`${picked.length} source${picked.length > 1 ? 's' : ''} queued for processing`)
    onAdded(ids[ids.length - 1])
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" icon={Upload} disabled={busy} onClick={submit}>
        {busy ? 'Fetching…' : 'Import'}
      </Button>
    </>
  )
  return (
    <Modal
      open
      onClose={onClose}
      title={`Import ${m.label}`}
      subtitle="Prototype: files are not uploaded or parsed. The reader shows generated sample text."
      width={560}
      footer={footer}
    >
      <div className="space-y-4">
        <Field label="Add to project">
          <select className={inputCls} value={pid} onChange={(e) => setPid(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        {method === 'url' && (
          <Field label="URL" hint="Only the address is stored; nothing is downloaded.">
            <input
              autoFocus
              className={field('font-mono')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.org/article"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </Field>
        )}
        {method === 'bibtex' && (
          <Field label="Paste BibTeX">
            <textarea
              rows={7}
              className={`${textareaCls} font-mono text-xs`}
              value={bib}
              onChange={(e) => setBib(e.target.value)}
            />
          </Field>
        )}
        {(method === 'pdf' || method === 'other' || method === 'folder') && (
          <>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                accept={method === 'other' ? '.docx,.md,.txt,.odt' : '.pdf'}
                onChange={(e) =>
                  setPicked((p) => [...p, ...Array.from(e.target.files ?? []).map((f) => f.name)])
                }
              />
              <Button
                icon={method === 'folder' ? FolderOpen : FileText}
                onClick={() => fileRef.current?.click()}
              >
                {method === 'folder' ? 'Choose files from folder…' : 'Choose files…'}
              </Button>
              <span className="text-[11px] text-muted">or pick sample documents below</span>
            </div>
            <div className="overflow-hidden rounded-2xl bg-surface-2">
              {samples.map((f) => (
                <label
                  key={f}
                  className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-raised"
                >
                  <input
                    type="checkbox"
                    checked={picked.includes(f)}
                    onChange={() => toggle(f)}
                    className="accent-[var(--signal-ink)]"
                  />
                  <span className="flex-1">{f}</span>
                  <span className="text-[10.5px] text-muted">sample</span>
                </label>
              ))}
              {picked
                .filter((f) => ![...SAMPLE_PDFS, ...SAMPLE_DOCS].includes(f))
                .map((f) => (
                  <div key={f} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                    <Check size={14} className="text-success" aria-hidden />
                    <span className="flex-1">{f}</span>
                    <button
                      className="text-muted hover:text-danger"
                      aria-label={`Remove ${f}`}
                      onClick={() => toggle(f)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}
        {err && (
          <p className="flex items-center gap-1.5 text-xs text-danger">
            <CircleAlert size={13} />
            {err}
          </p>
        )}
      </div>
    </Modal>
  )
}
