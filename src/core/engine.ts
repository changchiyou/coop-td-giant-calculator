import type {
  CalcInput,
  CalcResult,
  CostData,
  Difficulty,
  GiantTierRow,
  RewardSet,
  RewardRow,
  ResourceKey,
  RunMultiplier,
} from './types'

export const RESOURCE_KEYS: ResourceKey[] = [
  'exp',
  'silver',
  'tickets',
  'powder',
  'jelly',
  'pearl',
]

/** Find the clear-reward row for difficulty × multiplier. Falls back to the
 *  1x row scaled by the multiplier when the table omits a row (the game
 *  scales every reward in lockstep, per the official reward matrix). */
export function findRewardRow(
  rows: RewardRow[],
  difficulty: Difficulty,
  multiplier: RunMultiplier,
): RewardSet {
  const exact = rows.find((r) => r.difficulty === difficulty && r.multiplier === multiplier)
  if (exact) return exact.rewards
  const base = rows.find((r) => r.difficulty === difficulty && r.multiplier === 1)
  if (!base) return {}
  return scaleRewards(base.rewards, multiplier)
}

/** Giant tier bonus for difficulty × tier. Giant type is reward-irrelevant. */
export function findGiantBonus(
  rows: GiantTierRow[],
  difficulty: Difficulty,
  tier: number,
): RewardSet {
  return rows.find((r) => r.difficulty === difficulty && r.tier === tier)?.rewards ?? {}
}

export function addRewards(a: RewardSet, b: RewardSet): RewardSet {
  const out: RewardSet = {}
  for (const k of RESOURCE_KEYS) {
    const v = (a[k] ?? 0) + (b[k] ?? 0)
    if (v !== 0) out[k] = v
  }
  return out
}

export function scaleRewards(a: RewardSet, factor: number): RewardSet {
  const out: RewardSet = {}
  for (const k of RESOURCE_KEYS) {
    const v = a[k]
    if (v !== undefined) out[k] = v * factor
  }
  return out
}

/** Real-time minutes per run: waves × sec/wave ÷ speed, plus altar idle
 *  on Hell and above. */
export function runMinutes(input: CalcInput): number {
  const { config, costs } = input
  const speed = config.boughtNoAdsSpeed2x ? 2 : 1
  const altars = config.difficulty === 'hard' ? 0 : costs.altarWaitsHellPlus
  return (config.wavesPerRun * config.secPerWave) / speed + altars * config.altarWaitSec
}

/** Diamonds for n stamina purchases walking the ladder, then repeat cost. */
export function diamondCostOfPurchases(n: number, costs: CostData): number {
  let total = 0
  for (let i = 0; i < n; i++) {
    total += i < costs.diamondPurchaseCosts.length
      ? costs.diamondPurchaseCosts[i]
      : costs.diamondPurchaseRepeatCost
  }
  return total
}

export function computeRun(input: CalcInput): CalcResult {
  const { config, rewards, giantTiers, costs } = input

  const minutesPerRun = runMinutes(input) / 60

  // Ticket farming: base clear rewards scaled by the ticket multiplier.
  const perTicketRun = findRewardRow(rewards, config.difficulty, config.ticketMultiplier)
  // Giant farming: tier rewards scaled by the giant multiplier — this is
  // where the multiplier genuinely pays out.
  const perGiantAttempt = scaleRewards(
    findGiantBonus(giantTiers, config.difficulty, config.giantTier),
    config.giantMultiplier,
  )

  const runs = Math.max(0, config.ticketRuns)
  const attempts = Math.max(0, config.giantAttempts)

  const totalRewards = addRewards(
    scaleRewards(perTicketRun, runs),
    scaleRewards(perGiantAttempt, attempts),
  )
  const totalMinutes = minutesPerRun * (runs + attempts)

  const perHour: RewardSet = {}
  if (totalMinutes > 0) {
    for (const k of RESOURCE_KEYS) {
      const v = totalRewards[k]
      if (v !== undefined) perHour[k] = (v / totalMinutes) * 60
    }
  }

  // Giant tickets: one per N runs regardless of any stamina multiplier.
  const ticketsEarned =
    config.runsPerGiantTicket > 0 ? Math.floor(runs / config.runsPerGiantTicket) : 0
  const ticketsUsed = attempts

  // Stamina plan vs budget.
  const staminaNeeded =
    runs * config.staminaPerRun * config.ticketMultiplier +
    attempts * config.staminaPerRun * config.giantMultiplier
  const staminaBudget =
    Math.floor((24 * 60) / costs.staminaRegenMinutes) +
    costs.adStaminaPerDay +
    costs.defaultDiamondPurchases * costs.staminaPerPurchase
  const extraStamina = Math.max(0, staminaNeeded - staminaBudget)
  const extraPurchases =
    costs.staminaPerPurchase > 0 ? Math.ceil(extraStamina / costs.staminaPerPurchase) : 0
  const extraDiamonds =
    diamondCostOfPurchases(costs.defaultDiamondPurchases + extraPurchases, costs) -
    diamondCostOfPurchases(costs.defaultDiamondPurchases, costs)

  return {
    minutesPerRun,
    totalMinutes,
    perTicketRun,
    perGiantAttempt,
    totalRewards,
    perHour,
    ticketsEarned,
    ticketsUsed,
    ticketsShortfall: Math.max(0, ticketsUsed - ticketsEarned),
    staminaNeeded,
    staminaBudget,
    extraStamina,
    extraPurchases,
    extraDiamonds,
  }
}

/** Format minutes as "1h 23m" independent of locale display. */
export function formatMinutes(min: number): string {
  const total = Math.round(min)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
