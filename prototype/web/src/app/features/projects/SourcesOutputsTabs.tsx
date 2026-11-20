import { useNavigate } from 'react-router'
import { FileOutput, Upload } from 'lucide-react'
import type { Project } from '../../data/types'
import { useStore } from '../../state/StoreProvider'
import { Button, Card, EmptyState, SectionTitle, StatusTag, VerifyTag } from '../../ui'

export function SourcesTab({ p }: { p: Project }) {
  const { sources } = useStore()
  const nav = useNavigate()
  const ps = sources.filter((s) => s.projectId === p.id)
  if (!ps.length)
    return (
      <Card>
        <EmptyState
          icon={Upload}
          title="No sources in this project"
          action={
            <Button variant="primary" onClick={() => nav('/imports?import=pdf')}>
              Import Source
            </Button>
          }
        />
      </Card>
    )
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-[13px]">
        <thead className="text-left text-[11px] text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">Source</th>
            <th className="font-medium">Type</th>
            <th className="font-medium">Processing</th>
            <th className="font-medium">Verification</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ps.map((s) => (
            <tr key={s.id} className="border-t border-line">
              <td className="px-4 py-2.5">
                <div className="font-medium">{s.title}</div>
                <div className="font-mono text-[11px] text-muted">{s.id}</div>
              </td>
              <td className="text-muted">{s.type}</td>
              <td>
                <StatusTag status={s.status} />
              </td>
              <td>
                <VerifyTag state={s.verify} />
              </td>
              <td className="space-x-1 pr-4 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={s.status !== 'Completed'}
                  onClick={() => nav(`/research?source=${s.id}`)}
                >
                  Read
                </Button>
                <Button size="sm" variant="ghost" onClick={() => nav(`/verify?source=${s.id}`)}>
                  Verify
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export function OutputsTab({ p }: { p: Project }) {
  const nav = useNavigate()
  return (
    <Card>
      <SectionTitle>Outputs</SectionTitle>
      <div className="px-2 pb-2">
        {p.id === 'P-001' ? (
          <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px]">
            <FileOutput size={16} className="text-muted" aria-hidden />
            <div className="flex-1">
              <div className="font-medium">architecture-report.pdf</div>
              <div className="text-[11px] text-muted">Sample output from Report Export (Typst) · T-004</div>
            </div>
            <Button size="sm" onClick={() => nav('/tasks?task=T-004')}>
              View job
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={FileOutput}
            title="No outputs yet"
            body="Exports appear here after a report job completes."
          />
        )}
        <div className="mt-2 flex items-center justify-between rounded-xl bg-raised px-3 py-2.5 text-xs text-muted">
          Report export is a prototype preview — no files are written.
          <Button size="sm" disabled>
            Export report (unavailable)
          </Button>
        </div>
      </div>
    </Card>
  )
}
