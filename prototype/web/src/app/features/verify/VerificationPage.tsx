import { useSearchParams } from 'react-router'
import { Info, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useStore } from '../../state/StoreProvider'
import { Button, EmptyState, PageHeader, field } from '../../ui'
import { ChecklistPanel } from './ChecklistPanel'
import { MetadataPanel } from './MetadataPanel'

export function VerificationPage() {
  const { sources, verifications, runVerification, markReviewed, verifying } = useStore()
  const [params, setParams] = useSearchParams()
  const verifiable = sources.filter((s) => s.type !== 'Markdown')
  const src = sources.find((s) => s.id === params.get('source')) ?? verifiable[0]
  if (!src) return <EmptyState icon={ShieldCheck} title="No sources to verify" />
  const busy = verifying === src.id

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Citation & DOI Verification"
        subtitle="Compare stored metadata with bibliographic providers (simulated responses)."
        actions={
          <>
            <select
              className={field('h-8 w-72 rounded-full')}
              value={src.id}
              onChange={(e) => setParams({ source: e.target.value })}
              aria-label="Source to verify"
            >
              {verifiable.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              icon={busy ? Loader2 : RefreshCw}
              disabled={busy}
              onClick={() => runVerification(src.id)}
            >
              {busy ? 'Checking…' : 'Run check'}
            </Button>
          </>
        }
      />
      <div className="mx-6 mb-4 flex items-start gap-2.5 rounded-2xl bg-raised px-4 py-3 text-xs leading-relaxed">
        <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">Metadata matching is not proof of scientific validity.</strong> A
          resolved DOI only confirms that a bibliographic record exists and matches. This prototype makes no
          network requests; all provider results are fictional samples.
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_400px] overflow-hidden">
        <MetadataPanel src={src} />
        <ChecklistPanel
          v={verifications.find((x) => x.sourceId === src.id)}
          busy={busy}
          onRun={() => runVerification(src.id)}
          onReviewed={() => markReviewed(src.id)}
        />
      </div>
    </div>
  )
}
