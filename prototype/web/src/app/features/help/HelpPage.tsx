import { useNavigate } from 'react-router'
import { Button, Kbd, LogoMark, PageHeader } from '../../ui'

const SHORTCUTS: [string, string][] = [
  ['Ctrl K', 'Global search'],
  ['Ctrl N', 'New project'],
  ['Ctrl Shift N', 'New note'],
  ['Ctrl O', 'Import source'],
  ['Ctrl S', 'Save'],
  ['Ctrl Shift F', 'Search in project / document'],
  ['Ctrl Enter', 'Send AI prompt'],
  ['Ctrl Shift G', 'Open Knowledge Map'],
  ['Ctrl 1 / 2 / 3', 'Home / Projects / Library'],
  ['Ctrl ,', 'Settings'],
  ['Ctrl Z / Ctrl Shift Z', 'Undo / redo in Knowledge Map'],
  ['Esc', 'Close overlays'],
]

function BrandCard() {
  return (
    <section className="rounded-2xl bg-surface-2 p-5">
      <h2 className="text-[15px] font-semibold">App icon &amp; mark</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
        One continuous stroke dips twice — <em>research</em>, <em>understand</em> — then rises into a solid
        node: <em>build</em>. Solid tile, no gradient, no outline; the lime node is the only accent.
      </p>
      <div className="mt-5 flex items-end gap-6">
        {[128, 64, 32, 16].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <LogoMark size={s} />
            <span className="font-mono text-[10px] text-muted">{s}px</span>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="flex items-center justify-center rounded-2xl bg-[#0A0A0B] py-6 text-[#EDEDEF]">
          <LogoMark size={40} tile={false} />
          <span className="ml-3 text-[15px] font-semibold">R&amp;D Workbench</span>
        </div>
        <div className="flex items-center justify-center rounded-2xl bg-[#F3F3F1] py-6 text-[#141416]">
          <LogoMark size={40} tile={false} />
          <span className="ml-3 text-[15px] font-semibold">R&amp;D Workbench</span>
        </div>
      </div>
    </section>
  )
}

export function HelpPage() {
  const nav = useNavigate()
  return (
    <div className="h-full overflow-auto">
      <PageHeader title="Help / About" subtitle="Keyboard shortcuts, brand mark and prototype scope." />
      <div className="grid grid-cols-2 gap-4 px-6 pb-6">
        <BrandCard />
        <section className="rounded-2xl bg-surface-2 p-5">
          <h2 className="text-[15px] font-semibold">Keyboard shortcuts</h2>
          <p className="mt-1 text-[11.5px] text-muted">
            Some combinations (Ctrl N, Ctrl 1) may be reserved by the browser in this web preview; they map
            directly in the native app.
          </p>
          <dl className="mt-3 divide-y divide-line">
            {SHORTCUTS.map(([k, d]) => (
              <div key={k} className="flex items-center justify-between py-2 text-[13px]">
                <dt className="text-muted">{d}</dt>
                <dd className="flex gap-1">
                  {k.split(' ').map((p, i) =>
                    p === '/' ? (
                      <span key={i} className="px-0.5 text-muted">
                        /
                      </span>
                    ) : (
                      <Kbd key={i}>{p}</Kbd>
                    ),
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="col-span-2 rounded-2xl bg-surface-2 p-5">
          <h2 className="text-[15px] font-semibold">About this prototype</h2>
          <div className="mt-2 grid grid-cols-3 gap-6 text-[13px] leading-relaxed text-muted">
            <p>
              This is an interactive UX prototype of a future <strong className="text-fg">native</strong>{' '}
              desktop application. The planned production build uses a Rust core with a native UI toolkit
              (e.g. egui / eframe) — no webview.
            </p>
            <p>
              Planned components: SQLite storage, Tantivy full-text search, Python document workers, AI
              provider adapters, native document rendering and an optional sandboxed plugin runtime.
            </p>
            <p>
              AI answers, processing, DOI verification and connection tests are deterministic simulations over
              clearly fictional sample data. No network calls are made and no files are read.
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={() => nav('/')}>
              Back to Home
            </Button>
            <Button onClick={() => nav('/research?source=SRC-001&page=4')}>Try the Research Workspace</Button>
          </div>
        </section>
      </div>
    </div>
  )
}
