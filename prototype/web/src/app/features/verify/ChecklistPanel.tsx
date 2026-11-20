import { Check, CircleDashed, History, Loader2 } from 'lucide-react'
import type { Verification } from '../../data/types'
import { Button, Card, EmptyState, SectionTitle, StatusGlyph, VerifyTag, verifyGlyph } from '../../ui'

type Props = { v?: Verification; busy: boolean; onRun: () => void; onReviewed: () => void }

export function ChecklistPanel({ v, busy, onRun, onReviewed }: Props) {
  const needsReview = v?.checks.some((c) => c.state === 'Needs Review')
  return (
    <aside className="m-2 ml-0 overflow-auto rounded-2xl bg-surface-2">
      <SectionTitle
        action={
          needsReview ? (
            <Button size="sm" icon={Check} onClick={onReviewed}>
              Mark reviewed
            </Button>
          ) : undefined
        }
      >
        Verification checklist
      </SectionTitle>
      <div className="px-3 pb-4">
        {busy ? (
          <div className="flex items-center gap-2 rounded-xl bg-raised p-4 text-[13px] text-muted">
            <Loader2 size={15} className="animate-spin" />
            Querying simulated providers…
          </div>
        ) : !v ? (
          <Card className="bg-raised">
            <EmptyState
              icon={CircleDashed}
              title="Not checked yet"
              body="Run a simulated check to compare this record with providers."
              action={
                <Button variant="primary" onClick={onRun}>
                  Run check
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="overflow-hidden rounded-xl bg-surface">
            {v.checks.map((c) => (
              <li key={c.label} className="flex items-center gap-3 px-3.5 py-2.5">
                <StatusGlyph kind={verifyGlyph(c.state)} size={16} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px]">{c.label}</div>
                  <div className="truncate text-[11px] text-muted">{c.detail}</div>
                </div>
                <span className="text-[11.5px] text-muted">{c.state}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {v && !busy && (
        <>
          <SectionTitle>Provider comparison</SectionTitle>
          <div className="mx-3 mb-4 overflow-hidden rounded-xl bg-surface text-[12px]">
            <table className="w-full">
              <thead className="text-left text-[10.5px] text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Provider</th>
                  <th className="font-medium">Year</th>
                  <th className="font-medium">Authors</th>
                  <th className="pr-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {v.providers.map((p) => (
                  <tr key={p.name} className="border-t border-line align-top">
                    <td className="px-3 py-2">
                      <div className="font-medium">{p.name}</div>
                      <div className="max-w-[120px] truncate text-[10.5px] text-muted">{p.title}</div>
                    </td>
                    <td className="py-2 font-mono">{p.year}</td>
                    <td className="max-w-[100px] truncate py-2 text-muted">{p.authors}</td>
                    <td className="py-2 pr-3">
                      <VerifyTag state={p.state} short />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-line px-3 py-2 text-[10.5px] text-muted">
              Simulated provider responses — no API calls are made.
            </p>
          </div>
          <SectionTitle>
            <History size={13} aria-hidden />
            History
          </SectionTitle>
          <ol className="space-y-1.5 px-3 pb-4">
            {v.history.map((h, i) => (
              <li key={i} className="rounded-xl bg-surface px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted">{h.at}</span>
                  <VerifyTag state={h.result} short />
                </div>
                <p className="mt-1 text-xs">{h.note}</p>
              </li>
            ))}
          </ol>
        </>
      )}
    </aside>
  )
}
