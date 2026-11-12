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
    <section className="self-start border-t-2 border-stamina bg-sheet p-5 shadow-sheet lg:sticky lg:top-6">
      <h2 className="mb-3 font-display text-lg font-semibold text-ink">{t('inputs.section')}</h2>

      <Toggle
        checked={config.boughtNoAdsSpeed2x}
        onChange={(v) => set('boughtNoAdsSpeed2x', v)}
        label={t('inputs.boughtNoAdsSpeed2x')}
      />

      <div className="my-1 border-t border-dashed border-rule" />

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
      <p className="-mt-1 mb-1 text-[11px] leading-snug text-ink-muted">{t('inputs.cycleHint')}</p>

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

      <div className="my-1 border-t border-dashed border-rule" />

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

      <div className="mt-3">
        <h3 className="mb-1 border-b border-rule-soft pb-1 font-display text-[15px] font-medium text-ink">
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
      </div>
    </section>
  )
}
