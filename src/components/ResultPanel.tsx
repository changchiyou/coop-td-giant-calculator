import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import { computeRun, formatMinutes, staminaBudgetParts, RESOURCE_KEYS } from '../core/engine'
import type { CalcResult, RewardSet } from '../core/types'
import { COSTS, GACHA_REF, GIANT_TIER_ROWS, REWARD_ROWS } from '../data'
import { useRunStore } from '../store/useRunStore'

const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

function RewardGrid({ rewards, t, hideExpSilver }: { rewards: RewardSet; t: TFunction; hideExpSilver: boolean }) {
  const keys = RESOURCE_KEYS.filter(
    (k) => (rewards[k] ?? 0) !== 0 && !(hideExpSilver && (k === 'exp' || k === 'silver')),
  )
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

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-slate-400">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${warn ? 'text-amber-400' : 'text-emerald-300'}`}
      >
        {value}
      </span>
    </div>
  )
}

export function ResultPanel() {
  const { t } = useTranslation()
  const config = useRunStore((s) => s.config)

  const result: CalcResult = useMemo(
    () =>
      computeRun({
        config,
        rewards: REWARD_ROWS,
        giantTiers: GIANT_TIER_ROWS,
        costs: COSTS,
        gacha: GACHA_REF,
      }),
    [config],
  )

  const block = (title: string, rewards: RewardSet) => (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <RewardGrid rewards={rewards} t={t} hideExpSilver={!config.showExpSilver} />
    </div>
  )

  const staminaOver = result.extraStamina > 0
  const parts = staminaBudgetParts(COSTS)
  const ladder = [...COSTS.diamondPurchaseCosts, `…${COSTS.diamondPurchaseRepeatCost}`].join('/')

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {t('results.section')}
      </h2>

      <div className="mb-4 space-y-1">
        <Stat
          label={t('results.plan')}
          value={t('results.planValue', {
            cycles: config.cycles,
            runs: result.ticketRuns,
            giants: result.giantAttempts,
          })}
        />
        <Stat label={t('results.perRunTime')} value={formatMinutes(result.minutesPerRun)} />
        <Stat label={t('results.totalTime')} value={formatMinutes(result.totalMinutes)} />
        <Stat
          label={t('results.tickets')}
          value={t('results.ticketsValue', {
            earned: result.ticketsEarned,
            used: result.ticketsUsed,
          })}
          warn={result.ticketsShortfall > 0}
        />
      </div>

      <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('results.stamina')}
        </h3>
        <div className="space-y-1">
          <Stat label={t('results.staminaNeeded')} value={nf.format(result.staminaNeeded)} />
          <Stat label={t('results.staminaBudget')} value={nf.format(result.staminaBudget)} />
          <p className="pt-1 text-xs leading-relaxed text-slate-500">
            {t('results.budgetFormula', {
              regen: parts.regen,
              regenMin: COSTS.staminaRegenMinutes,
              ads: parts.ads,
              purchases: parts.purchases,
              n: COSTS.defaultDiamondPurchases,
              each: COSTS.staminaPerPurchase,
              total: parts.total,
            })}
          </p>
          {staminaOver && (
            <>
              <Stat label={t('results.extraStamina')} value={nf.format(result.extraStamina)} warn />
              <Stat
                label={t('results.extraDiamonds', { n: result.extraPurchases })}
                value={nf.format(result.extraDiamonds)}
                warn
              />
            </>
          )}
        </div>
        <p className="mt-2 border-t border-slate-700/60 pt-2 text-xs leading-relaxed text-slate-500">
          {t('results.calculationBasis', {
            stamina: COSTS.staminaPerRun,
            regenMin: COSTS.staminaRegenMinutes,
            ads: COSTS.adStaminaPerDay,
            ladder,
            each: COSTS.staminaPerPurchase,
          })}
        </p>
      </div>

      <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('results.diamondLedger')}
        </h3>
        <div className="space-y-1">
          <Stat
            label={t('results.diamondIncome')}
            value={nf.format(Math.round(result.diamondIncome))}
          />
          <Stat
            label={t('results.diamondSpend', { days: result.estimatedDays })}
            value={nf.format(result.totalDiamondSpend)}
          />
          <Stat
            label={t('results.diamondNet')}
            value={nf.format(Math.round(result.diamondNet))}
            warn={result.diamondNet < 0}
          />
        </div>
        <p className="mt-2 border-t border-slate-700/60 pt-2 text-xs leading-relaxed text-slate-500">
          {result.diamondNet < 0
            ? t('results.diamondLedgerWarn', {
                daily: nf.format(result.dailyPurchaseDiamonds),
                n: COSTS.defaultDiamondPurchases,
              })
            : t('results.diamondLedgerOk', {
                daily: nf.format(result.dailyPurchaseDiamonds),
                n: COSTS.defaultDiamondPurchases,
              })}
        </p>
      </div>

      <div className="space-y-4">
        {block(t('results.perTicketRun'), result.perTicketRun)}
        {block(t('results.perGiantAttempt'), result.perGiantAttempt)}
        <div>
          {block(t('results.totalRewards'), result.totalRewards)}
          {result.ticketEquivalent && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {t('results.gachaConverted', {
                draws: nf.format(GACHA_REF.draws),
                parts: Object.entries(GACHA_REF.rewards)
                  .filter(([k]) => k !== 'tickets')
                  .map(([k, v]) => `${nf.format(v!)} ${t(`resource.${k}`)}`)
                  .join(' / '),
              })}
            </p>
          )}
        </div>
        {block(t('results.perHour'), result.perHour)}
      </div>
    </section>
  )
}
