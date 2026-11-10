import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { computeRun, formatMinutes, RESOURCE_KEYS } from '../core/engine'
import type { CalcResult, RewardSet } from '../core/types'
import { COSTS, GIANT_TIER_ROWS, REWARD_ROWS } from '../data'
import { useRunStore } from '../store/useRunStore'

const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

function RewardGrid({ rewards, t }: { rewards: RewardSet; t: (k: string) => string }) {
  const keys = RESOURCE_KEYS.filter((k) => (rewards[k] ?? 0) !== 0)
  if (keys.length === 0) return <span className="text-sm text-slate-500">—</span>
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
      {keys.map((k) => (
        <div key={k} className="flex items-baseline justify-between gap-2">
          <dt className="text-xs text-slate-400">{t(`resource.${k}`)}</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-100">
            {nf.format(rewards[k]!)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-emerald-300">{value}</span>
    </div>
  )
}

export function ResultPanel() {
  const { t } = useTranslation()
  const config = useRunStore((s) => s.config)

  const result: CalcResult = useMemo(
    () =>
      computeRun(
        {
          config,
          rewards: REWARD_ROWS,
          giantTiers: GIANT_TIER_ROWS,
        },
        config.bought3xStamina ? COSTS.runsPerDay3x : COSTS.runsPerDayBase,
      ),
    [config],
  )

  const block = (title: string, rewards: RewardSet) => (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <RewardGrid rewards={rewards} t={t} />
    </div>
  )

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {t('results.section')}
      </h2>

      <div className="mb-4 space-y-1">
        <Stat label={t('results.perRunTime')} value={formatMinutes(result.minutesPerRun)} />
        <Stat label={t('results.totalTime')} value={formatMinutes(result.totalMinutes)} />
        <Stat label={t('results.runsPerDay')} value={String(result.runsPerDay)} />
      </div>

      <div className="space-y-4">
        {block(t('results.totalRewards'), result.totalRewards)}
        {block(t('results.perRun'), result.perRun)}
        {block(t('results.perHour'), result.perHour)}
      </div>
    </section>
  )
}
