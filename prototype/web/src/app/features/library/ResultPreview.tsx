import { useNavigate } from 'react-router'
import { ArrowUpRight, FileSearch, Pencil, Trash2 } from 'lucide-react'
import type { Item } from '../../lib/search'
import { useStore } from '../../state/StoreProvider'
import { Button, EmptyState, IconButton, Mark, Tag } from '../../ui'

export function ResultPreview({
  item,
  terms,
  onDeleted,
}: {
  item?: Item
  terms: string[]
  onDeleted: () => void
}) {
  const { notes, experiments, setNoteDraft, confirm, deleteNote } = useStore()
  const nav = useNavigate()
  if (!item)
    return <EmptyState icon={FileSearch} title="No selection" body="Select a result to preview it." />
  const note = item.type === 'Note' ? notes.find((n) => n.id === item.refId) : undefined
  const body =
    note?.body ??
    (item.type === 'Experiment' ? experiments.find((x) => x.id === item.refId)?.body : undefined) ??
    item.text
  const openLabel =
    item.type === 'Document'
      ? `Open page ${item.page}`
      : item.type === 'Citation'
        ? 'Open verification'
        : 'Open location'
  const remove = () =>
    note &&
    confirm({
      title: 'Delete note?',
      body: `“${note.title}” will be removed. Linked graph nodes keep their other links.`,
      onConfirm: () => {
        deleteNote(note.id)
        onDeleted()
      },
    })

  return (
    <div className="p-5">
      <Tag mono>{item.type}</Tag>
      <h2 className="mt-2.5 text-[17px] leading-snug font-semibold">{item.title}</h2>
      <div className="mt-1 font-mono text-[11px] text-muted">
        {item.refId}
        {item.page ? ` · page ${item.page}` : ''} · {item.date}
      </div>
      <p
        className="mt-4 text-[13.5px] leading-[1.75] whitespace-pre-wrap"
        lang={/[\u0E00-\u0E7F]/.test(body) ? 'th' : 'en'}
      >
        <Mark text={body} terms={terms} />
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {item.type !== 'Experiment' && item.type !== 'Note' && (
          <Button variant="primary" icon={ArrowUpRight} onClick={() => nav(item.to)}>
            {openLabel}
          </Button>
        )}
        {note && (
          <>
            {note.sourceId && (
              <Button
                variant="primary"
                icon={ArrowUpRight}
                onClick={() => nav(`/research?source=${note.sourceId}&page=${note.page ?? 1}`)}
              >
                Open source p.{note.page ?? 1}
              </Button>
            )}
            <Button icon={Pencil} onClick={() => setNoteDraft({ ...note })}>
              Edit
            </Button>
            <IconButton label="Delete note" icon={Trash2} solid onClick={remove} />
          </>
        )}
        {item.type === 'Experiment' && <Tag>Experiment log · prototype preview</Tag>}
      </div>
    </div>
  )
}
