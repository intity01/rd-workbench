import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useSaveShortcut } from '../../shell/events'
import { useStore } from '../../state/StoreProvider'
import { Button, ProjectIcon, cn } from '../../ui'
import { EMPTY_FORM, STEPS, toProject, validateStep, type WizardForm } from './wizard'
import { DefinitionStep, IdentityStep, WorkspaceStep } from './WizardSteps'

const STEP_VIEWS = [IdentityStep, DefinitionStep, WorkspaceStep]

export function NewProjectPage() {
  const { addProject, toast, setCurrentProjectId } = useStore()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [f, setF] = useState<WizardForm>(EMPTY_FORM)
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }))
  const validate = (s: number) => {
    const e = validateStep(s, f)
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const saveDraft = () => {
    if (!f.name?.trim()) {
      setStep(0)
      return setErrors({ name: 'Name the draft before saving' })
    }
    const id = addProject(toProject(f), true)
    toast('Draft saved', 'success', { label: 'Open', to: `/projects/${id}` })
    nav('/projects')
  }
  const create = () => {
    if (!validate(0)) return setStep(0)
    if (!validate(1)) return setStep(1)
    const id = addProject(toProject(f))
    setCurrentProjectId(id)
    toast(`Project “${f.name}” created`)
    nav(`/projects/${id}`)
  }
  useSaveShortcut(saveDraft)
  const View = STEP_VIEWS[step]

  return (
    <div className="flex h-full">
      <aside className="w-[260px] shrink-0 bg-surface-2/50 p-5">
        <button
          onClick={() => nav(-1)}
          className="mb-5 flex items-center gap-1 text-xs text-muted hover:text-fg"
        >
          <ChevronLeft size={14} />
          Back
        </button>
        <h1 className="text-[22px] font-semibold tracking-tight">New Research Project</h1>
        <p className="mt-1 text-xs text-muted">Three short steps. You can change everything later.</p>
        <ol className="mt-6 space-y-1">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                onClick={() => (i < step || validate(step)) && setStep(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[13px]',
                  i === step ? 'bg-raised font-medium' : 'text-muted hover:text-fg',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                    i < step ? 'bg-signal text-on-signal' : i === step ? 'bg-fg text-app' : 'bg-raised',
                  )}
                >
                  {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-8 rounded-2xl bg-surface-2 p-3">
          <div className="text-[11px] text-muted">Preview</div>
          <div className="mt-2 flex items-center gap-2.5">
            <ProjectIcon icon={f.icon!} size={32} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{f.name || 'Untitled project'}</div>
              <div className="text-[11px] text-muted">{f.category}</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[720px] px-8 py-8">
            <div className="text-xs text-muted">Step {step + 1} of 3</div>
            <h2 className="mt-1 text-[18px] font-semibold">{STEPS[step]}</h2>
            <div className="mt-6 space-y-5">
              <View f={f} set={set} errors={errors} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-8 py-4">
          <Button variant="ghost" icon={ChevronLeft} disabled={step === 0} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          <div className="flex-1" />
          <Button icon={Save} onClick={saveDraft}>
            Save Draft
          </Button>
          {step < 2 ? (
            <Button variant="primary" onClick={() => validate(step) && setStep(step + 1)}>
              Continue <ChevronRight size={14} />
            </Button>
          ) : (
            <Button variant="primary" icon={Check} onClick={create}>
              Create Project
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
