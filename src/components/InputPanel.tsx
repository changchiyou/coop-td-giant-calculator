import { useTranslation } from 'react-i18next'

import type { Difficulty, RunMultiplier } from '../core/types'
import { useRunStore } from '../store/useRunStore'
import { FieldRow, NumberInput, Segmented, Toggle } from './fields'

const DIFFICULTIES: Difficulty[] = ['hard', 'hell', 'abyss', 'deepSea']
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
      </div>

      <Toggle
        checked={config.boughtNoAdsSpeed2x}
        onChange={(v) => set('boughtNoAdsSpeed2x', v)}
        label={t('inputs.boughtNoAdsSpeed2x')}
      />

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

      <FieldRow label={t('inputs.cycles')}>
        <NumberInput value={config.cycles} onChange={(v) => set('cycles', v)} min={0} max={500} />
      </FieldRow>
      <p className="mb-2 text-[11px] leading-snug text-slate-500">{t('inputs.cycleHint')}</p>

      <FieldRow label={t('inputs.ticketMultiplier')}>
        <Segmented
          options={MULTIPLIERS.map((m) => ({ value: m, label: t(`multiplier.${m}`) }))}
          value={config.ticketMultiplier}
          onChange={(v) => set('ticketMultiplier', v)}
        />
      </FieldRow>
      <FieldRow label={t('inputs.giantMultiplier')}>
        <Segmented
          options={MULTIPLIERS.map((m) => ({ value: m, label: t(`multiplier.${m}`) }))}
          value={config.giantMultiplier}
          onChange={(v) => set('giantMultiplier', v)}
        />
      </FieldRow>

      <Toggle
        checked={config.showExpSilver}
        onChange={(v) => set('showExpSilver', v)}
        label={t('inputs.showExpSilver')}
      />
      <Toggle
        checked={config.convertTicketsToGacha}
        onChange={(v) => set('convertTicketsToGacha', v)}
        label={t('inputs.convertTicketsToGacha')}
      />
      <div className="my-3 border-t border-slate-700" />
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t('inputs.advanced')}
      </h3>
      <FieldRow label={t('inputs.secPerWave')}>
        <NumberInput
          value={config.secPerWave}
          onChange={(v) => set('secPerWave', v)}
          min={1}
          max={120}
        />
      </FieldRow>
      <FieldRow label={t('inputs.altarWaitSec')}>
        <NumberInput
          value={config.altarWaitSec}
          onChange={(v) => set('altarWaitSec', v)}
          min={0}
          max={300}
        />
      </FieldRow>
    </section>
  )
}
