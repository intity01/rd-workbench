import {
  Field,
  PROJECT_ICONS,
  ProjectIcon,
  Segmented,
  Switch,
  cn,
  inputCls,
  textareaCls,
  field,
} from '../../ui'
import { CATEGORIES, CITATION_SOURCES, OUTPUTS, PROCESSING, PROVIDERS, type WizardForm } from './wizard'

type StepProps = { f: WizardForm; set: (k: string, v: unknown) => void; errors: Record<string, string> }

const Err = ({ msg }: { msg?: string }) => (msg ? <p className="-mt-3 text-xs text-danger">{msg}</p> : null)

export function IdentityStep({ f, set, errors }: StepProps) {
  return (
    <>
      <Field label="Project Name" required>
        <input
          autoFocus
          className={field(errors.name ? 'ring-2 ring-danger' : '')}
          value={f.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Local OCR for Thai Mathematics"
          aria-invalid={!!errors.name}
        />
      </Field>
      <Err msg={errors.name} />
      <Field label="Description">
        <textarea
          rows={3}
          className={textareaCls}
          value={f.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What is this project about?"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Research Category">
          <select className={inputCls} value={f.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Tags" hint="Comma separated">
          <input
            className={inputCls}
            value={f.tagText}
            onChange={(e) => set('tagText', e.target.value)}
            placeholder="ocr, thai, math"
          />
        </Field>
      </div>
      <Field label="Project Icon">
        <div className="flex gap-2">
          {PROJECT_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              aria-label={`Icon ${ic}`}
              aria-pressed={f.icon === ic}
              onClick={() => set('icon', ic)}
              className={cn('rounded-2xl p-1.5', f.icon === ic ? 'bg-fg' : 'hover:bg-raised')}
            >
              <ProjectIcon icon={ic} size={34} />
            </button>
          ))}
        </div>
      </Field>
    </>
  )
}

export function DefinitionStep({ f, set, errors }: StepProps) {
  return (
    <>
      <Field label="Primary Research Question" required>
        <textarea
          autoFocus
          rows={2}
          className={cn(textareaCls, errors.question && 'ring-2 ring-danger')}
          value={f.question}
          onChange={(e) => set('question', e.target.value)}
          placeholder="What do you want to find out?"
        />
      </Field>
      <Err msg={errors.question} />
      <Field label="Research Objectives">
        <textarea
          rows={3}
          className={textareaCls}
          value={f.objectives}
          onChange={(e) => set('objectives', e.target.value)}
        />
      </Field>
      <Field label="Hypotheses (optional)">
        <textarea
          rows={2}
          className={textareaCls}
          value={f.hypotheses}
          onChange={(e) => set('hypotheses', e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Research Scope">
          <textarea
            rows={3}
            className={textareaCls}
            value={f.scope}
            onChange={(e) => set('scope', e.target.value)}
          />
        </Field>
        <Field label="Exclusions">
          <textarea
            rows={3}
            className={textareaCls}
            value={f.exclusions}
            onChange={(e) => set('exclusions', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Expected Output">
        <select className={inputCls} value={f.output} onChange={(e) => set('output', e.target.value)}>
          {OUTPUTS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Field>
    </>
  )
}

function ToggleList({
  items,
  value,
  onToggle,
}: {
  items: string[]
  value: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface-2">
      {items.map((c) => (
        <div key={c} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
          {c}
          <Switch label={c} checked={value.includes(c)} onChange={() => onToggle(c)} />
        </div>
      ))}
    </div>
  )
}

export function WorkspaceStep({ f, set }: StepProps) {
  const toggle = (k: 'citationSources' | 'processing') => (v: string) => {
    const cur = f[k] ?? []
    set(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
  }
  return (
    <>
      <Field
        label="Project Storage Location"
        hint="Shown as a path only — this prototype does not access your file system."
      >
        <input
          className={field('font-mono')}
          value={f.storage}
          onChange={(e) => set('storage', e.target.value)}
        />
      </Field>
      <Field label="Research Language">
        <div>
          <Segmented
            label="Research language"
            value={f.language!}
            onChange={(v) => set('language', v)}
            options={['Thai', 'English', 'Mixed'].map((v) => ({ value: v, label: v }))}
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="AI Provider">
          <select className={inputCls} value={f.provider} onChange={(e) => set('provider', e.target.value)}>
            {PROVIDERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Processing Mode">
          <div>
            <Segmented
              label="Processing mode"
              value={f.mode!}
              onChange={(v) => set('mode', v)}
              options={['Local-first', 'Cloud-assisted'].map((v) => ({ value: v, label: v }))}
            />
          </div>
        </Field>
      </div>
      <Field label="Citation Sources">
        <ToggleList
          items={CITATION_SOURCES}
          value={f.citationSources ?? []}
          onToggle={toggle('citationSources')}
        />
      </Field>
      <Field label="Processing Preferences">
        <ToggleList items={PROCESSING} value={f.processing ?? []} onToggle={toggle('processing')} />
      </Field>
    </>
  )
}
