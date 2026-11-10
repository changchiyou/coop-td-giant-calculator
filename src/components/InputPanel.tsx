import { useTranslation } from 'react-i18next'

import type { Difficulty, GiantType, RunMultiplier } from '../core/types'
import { useRunStore } from '../store/useRunStore'
import { FieldRow, NumberInput, Segmented, Toggle } from './fields'

const DIFFICULTIES: Difficulty[] = ['hard', 'hell', 'abyss', 'deepSea']
const GIANT_TYPES: (GiantType | 'any')[] = ['any', 'hitCount', 'shield', 'healing']
const MULTIPLIERS: RunMultiplier[] = [1, 3, 5]

export function InputPanel() {
  const { t } = useTranslation()
  const config = useRunStore((s) => s.config)
  const set = useRunStore((s) => s.set)

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t('inputs.section')}
        </h2>
        <button
          type="button"
          onClick={() => useRunStore.getState().reset()}
          className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
        >
          {t('app.reset')}
        </button>
      </div>

      <Toggle
        label={t('inputs.bought3xStamina')}
        checked={config.bought3xStamina}
        onChange={(v) => set('bought3xStamina', v)}
      />
      <Toggle
        label={t('inputs.boughtNoAdsSpeed2x')}
        checked={config.boughtNoAdsSpeed2x}
        onChange={(v) => set('boughtNoAdsSpeed2x', v)}
      />
      <Toggle
        label={t('inputs.useAdDoubleReward')}
        checked={config.useAdDoubleReward}
        onChange={(v) => set('useAdDoubleReward', v)}
      />

      <FieldRow label={t('inputs.runMultiplier')}>
        <Segmented
          options={MULTIPLIERS.map((m) => ({
            value: m,
            label: t(`multiplier.${m}` as const),
          }))}
          value={config.runMultiplier}
          onChange={(v) => set('runMultiplier', v)}
        />
      </FieldRow>

      <FieldRow label={t('inputs.difficulty')}>
        <Segmented
          options={DIFFICULTIES.map((d) => ({ value: d, label: t(`mode.${d}`) }))}
          value={config.difficulty}
          onChange={(v) => set('difficulty', v)}
        />
      </FieldRow>

      <FieldRow label={t('inputs.giantTier')}>
        <Segmented
          options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: t('tier.n', { n }) }))}
          value={config.giantTier}
          onChange={(v) => set('giantTier', v)}
        />
      </FieldRow>

      <FieldRow label={t('inputs.giantType')}>
        <Segmented
          options={GIANT_TYPES.map((g) => ({ value: g, label: t(`giantType.${g}`) }))}
          value={config.giantType}
          onChange={(v) => set('giantType', v)}
        />
      </FieldRow>

      <FieldRow label={t('inputs.runMinutes')}>
        <NumberInput value={config.runMinutes} onChange={(v) => set('runMinutes', v)} min={1} max={240} />
      </FieldRow>

      <FieldRow label={t('inputs.sessions')}>
        <NumberInput value={config.sessions} onChange={(v) => set('sessions', v)} min={1} max={200} />
      </FieldRow>
    </section>
  )
}
