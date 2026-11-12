import type { ReactNode } from 'react'

export function FieldRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-[11px] leading-snug text-ink-muted">{hint}</span>}
      </span>
      <span className="shrink-0">{children}</span>
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="block py-2">
      <span className="flex items-start justify-between gap-4">
        <span>
          <span className="block text-sm font-medium text-ink">{label}</span>
          {hint && <span className="block text-[11px] leading-snug text-ink-muted">{hint}</span>}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={`relative mt-0.5 h-5.5 w-10 shrink-0 rounded-full border transition-colors ${
            checked
              ? 'border-stamina bg-stamina'
              : 'border-rule bg-sunk'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-sheet shadow transition-all ${
              checked ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </span>
    </label>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  ariaLabel?: string
}) {
  return (
    <span
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex overflow-hidden rounded-[4px] border border-rule bg-sheet"
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`border-r border-rule px-2.5 py-1 text-xs font-medium last:border-r-0 ${
            o.value === value
              ? 'bg-ink text-sheet'
              : 'text-ink-soft hover:bg-sunk'
          }`}
        >
          {o.label}
        </button>
      ))}
    </span>
  )
}

export function NumberInput({
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  ariaLabel,
}: {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
  ariaLabel?: string
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={ariaLabel}
      value={Number.isFinite(value) ? value : min}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = Number(e.target.value)
        if (Number.isNaN(n)) return
        onChange(Math.max(min, max === undefined ? n : Math.min(max, n)))
      }}
      className="w-24 rounded-[4px] border border-rule bg-sheet px-2 py-1 text-right font-mono text-sm tabular-nums text-ink focus:border-gem focus:outline-none"
    />
  )
}
