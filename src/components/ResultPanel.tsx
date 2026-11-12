import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import { computeRun, formatMinutes, staminaBudgetParts, RESOURCE_KEYS } from '../core/engine'
import type { CalcResult, RewardSet } from '../core/types'
import { COSTS, GACHA_REF, GIANT_TIER_ROWS, REWARD_ROWS } from '../data'
import { useRunStore } from '../store/useRunStore'

const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

/** Dotted ledger rule filling the gap between a label and its amount. */
function Leader() {
  return <span aria-hidden className="ledger-leader mx-2 h-3 min-w-4 flex-1" />
}

function RewardGrid({ rewards, t, hideExpSilver }: { rewards: RewardSet; t: TFunction; hideExpSilver: boolean }) {
  const keys = RESOURCE_KEYS.filter(
    (k) => (rewards[k] ?? 0) !== 0 && !(hideExpSilver && (k === 'exp' || k === 'silver')),
  )
  if (keys.length === 0) return <span className="text-sm text-ink-muted">—</span>
  return (
    <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      {keys.map((k) => (
        <div key={k} className="flex items-end py-0.5">
          <dt className="text-xs text-ink-soft">{t(`resource.${k}`)}</dt>
          <Leader />
          <dd className="font-mono text-[13px] tabular-nums text-ink">
            {nf.format(rewards[k]!)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-end py-0.5">
      <span className="text-xs text-ink-soft">{label}</span>
      <Leader />
      <span
        className={`font-mono text-[13px] tabular-nums ${warn ? 'font-medium text-alert' : 'text-ink'}`}
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
      <h3 className="mb-1 border-b border-rule-soft pb-1 font-display text-[15px] font-medium text-ink">
        {title}
      </h3>
      <RewardGrid rewards={rewards} t={t} hideExpSilver={!config.showExpSilver} />
    </div>
  )

  const staminaOver = result.extraStamina > 0
  const parts = staminaBudgetParts(COSTS)
  const ladder = [...COSTS.diamondPurchaseCosts, `${COSTS.diamondPurchaseRepeatCost}×N`].join('/')

  return (
    <section className="border-t-2 border-ink bg-sheet p-5 shadow-sheet">
      <h2 className="mb-4 font-display text-lg font-semibold text-ink">{t('results.section')}</h2>

      <div className="mb-5 space-y-0.5">
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

      <div className="mb-5">
        <h3 className="mb-1 border-b border-rule-soft pb-1 font-display text-[15px] font-medium text-ink">
          {t('results.stamina')}
        </h3>
        <div className="space-y-0.5">
          <Stat label={t('results.staminaNeeded')} value={nf.format(result.staminaNeeded)} />
          <Stat label={t('results.staminaBudget')} value={nf.format(result.staminaBudget)} />
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
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] leading-snug text-ink-muted">
          <li>
            {t('results.basisRun', {
              stamina: COSTS.staminaPerRun,
              hard: COSTS.wavesByDifficulty.hard,
              other: COSTS.wavesByDifficulty.hell,
            })}
          </li>
          <li>{t('results.basisDaily', { regenMin: COSTS.staminaRegenMinutes, regen: parts.regen, ads: parts.ads })}</li>
          <li>{t('results.basisBuys', { ladder, each: COSTS.staminaPerPurchase })}</li>
          <li>
            {t('results.basisBudget', {
              total: parts.total,
              regen: parts.regen,
              ads: parts.ads,
              n: COSTS.defaultDiamondPurchases,
              each: COSTS.staminaPerPurchase,
              purchases: parts.purchases,
            })}
          </li>
        </ul>
      </div>

      {config.convertTicketsToGacha && (
        <div className="mb-5">
          <h3 className="mb-1 border-b border-rule-soft pb-1 font-display text-[15px] font-medium text-ink">
            {t('results.diamondLedger')}
          </h3>
          <div className="space-y-0.5">
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
        </div>
      )}

      <div className="space-y-5">
        {block(t('results.perTicketRun'), result.perTicketRun)}
        {block(t('results.perGiantAttempt'), result.perGiantAttempt)}
        <div>
          {block(t('results.totalRewards'), result.totalRewards)}
          {config.convertTicketsToGacha && result.ticketEquivalent && (
            <p className="mt-1.5 border-l-2 border-gem pl-2 text-[11px] leading-snug text-ink-muted">
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
