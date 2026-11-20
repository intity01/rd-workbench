import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BookOpenText, Link2, NotebookPen, Trash2, Unlink } from 'lucide-react'
import { NODE_META, REL_META } from '../../data/meta'
import type { GNode, NodeType, Rel } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, Dot, IconButton, IconTile, Tag, textareaCls, field } from '../../ui'
import { ALL, RELS } from './geometry'
import { NODE_ICON } from './nodeIcons'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-5">
    <h4 className="mb-2 border-b border-line pb-2 text-[13px] font-semibold">{title}</h4>
    {children}
  </section>
)
const selectCls = field('h-8 w-36 rounded-full text-[12.5px]')

/** Selected-node configuration: label-left / control-right rows, like a native inspector. */
export function NodeInspector({
  n,
  onSelect,
  onDelete,
}: {
  n: GNode
  onSelect: (id: string) => void
  onDelete: () => void
}) {
  const { edges, nodes, sources, notes, updateNode, deleteEdge, addEdge } = useStore()
  const nav = useNavigate()
  const [target, setTarget] = useState('')
  const [rel, setRel] = useState<Rel>('supports')
  const conns = edges.filter((e) => e.from === n.id || e.to === n.id)
  const src = sources.find((s) => s.id === n.sourceId)
  const note = notes.find((x) => x.id === n.noteId)
  const meta = NODE_META[n.type]
  const row = (label: string, control: React.ReactNode) => (
    <div className="flex min-h-10 items-center justify-between gap-3 text-[13px]">
      <span className="whitespace-nowrap text-muted">{label}</span>
      {control}
    </div>
  )

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
        <IconTile icon={NODE_ICON[n.type]} color={meta.color} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{n.label}</div>
          <div className="text-[11px] text-muted">
            {meta.label} · {n.id}
          </div>
        </div>
        <Tag tone="signal">Selected</Tag>
      </div>
      <Section title="Content">
        <textarea
          rows={2}
          aria-label="Label"
          className={textareaCls}
          defaultValue={n.label}
          onBlur={(e) =>
            e.target.value.trim() &&
            e.target.value !== n.label &&
            updateNode(n.id, { label: e.target.value.trim() })
          }
        />
        <textarea
          rows={3}
          aria-label="Description"
          className={`${textareaCls} mt-2`}
          placeholder="Description"
          defaultValue={n.desc}
          onBlur={(e) => e.target.value !== n.desc && updateNode(n.id, { desc: e.target.value })}
        />
      </Section>
      <Section title="Properties">
        {row(
          'Type',
          <select
            className={selectCls}
            value={n.type}
            onChange={(e) => updateNode(n.id, { type: e.target.value as NodeType })}
          >
            {ALL.map((t) => (
              <option key={t} value={t}>
                {NODE_META[t].label}
              </option>
            ))}
          </select>,
        )}
        {row(
          'Linked source',
          <select
            className={selectCls}
            value={n.sourceId ?? ''}
            onChange={(e) => updateNode(n.id, { sourceId: e.target.value || undefined })}
          >
            <option value="">None</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>,
        )}
        {row(
          'Page',
          <input
            type="number"
            min={1}
            aria-label="Page"
            className={field('h-8 w-20 rounded-full text-[12.5px]')}
            defaultValue={n.page ?? ''}
            disabled={!n.sourceId}
            onBlur={(e) => updateNode(n.id, { page: e.target.value ? Number(e.target.value) : undefined })}
          />,
        )}
        {row(
          'Linked note',
          <select
            className={selectCls}
            value={n.noteId ?? ''}
            onChange={(e) => updateNode(n.id, { noteId: e.target.value || undefined })}
          >
            <option value="">None</option>
            {notes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>,
        )}
        {n.type === 'evidence' && !src && !note && (
          <p className="mt-1 rounded-xl bg-warning px-3 py-2 text-[11.5px] text-[#1d1400]">
            Evidence should link to a source or note.
          </p>
        )}
        {(src || note) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {src && (
              <Button
                size="sm"
                icon={BookOpenText}
                disabled={src.status !== 'Completed'}
                onClick={() => nav(`/research?source=${src.id}&page=${n.page ?? 1}`)}
              >
                Open source{n.page ? ` p.${n.page}` : ''}
              </Button>
            )}
            {note && (
              <Button size="sm" icon={NotebookPen} onClick={() => nav(`/library?note=${note.id}`)}>
                Open note
              </Button>
            )}
          </div>
        )}
      </Section>
      <Section title={`Connections · ${conns.length}`}>
        <ul className="space-y-1">
          {conns.map((e) => {
            const out = e.from === n.id
            const other = nodes.find((x) => x.id === (out ? e.to : e.from))
            return (
              <li key={e.id} className="flex items-center gap-2 rounded-xl bg-surface-2 py-1 pr-1 pl-2.5">
                {other && <Dot color={NODE_META[other.type].color} />}
                <button className="min-w-0 flex-1 text-left" onClick={() => other && onSelect(other.id)}>
                  <span className="block truncate text-[12px]">{other?.label}</span>
                  <span className="text-[10.5px] text-muted">
                    {out ? '' : '← '}
                    {REL_META[e.rel].label}
                    {out ? ' →' : ''}
                  </span>
                </button>
                <IconButton label="Disconnect" icon={Unlink} size={26} onClick={() => deleteEdge(e.id)} />
              </li>
            )
          })}
          {conns.length === 0 && <li className="text-[12px] text-muted">No connections yet.</li>}
        </ul>
        <div className="mt-2 space-y-2 rounded-2xl bg-surface-2 p-2.5">
          <select
            className={field('h-8 rounded-full text-[12.5px]')}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="Target node"
          >
            <option value="">Connect to…</option>
            {nodes
              .filter((x) => x.id !== n.id)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {NODE_META[x.type].label}: {x.label}
                </option>
              ))}
          </select>
          <div className="flex gap-2">
            <select
              className={field('h-8 rounded-full text-[12.5px]')}
              value={rel}
              onChange={(e) => setRel(e.target.value as Rel)}
              aria-label="Relationship"
            >
              {RELS.map((r) => (
                <option key={r} value={r}>
                  {REL_META[r].label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="primary"
              icon={Link2}
              disabled={!target}
              onClick={() => {
                addEdge(n.id, target, rel)
                setTarget('')
              }}
            >
              Connect
            </Button>
          </div>
        </div>
      </Section>
      <Button className="mt-6 w-full" variant="danger" icon={Trash2} onClick={onDelete}>
        Delete node
      </Button>
    </div>
  )
}
