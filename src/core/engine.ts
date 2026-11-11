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
  'royalJelly',
  'pearl',
  'godStones',
  'liberationStones',
  'relics',
  'giantMarks',
  'diamonds',
  'relicsGod',
  'relicsSuperGod',
  'monsters',
  'rareMonsters',
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

/** Giant kill rewards for difficulty × tier: base ticket + that stage's
 *  drop only (stages are claimed separately). Giant type is irrelevant. */
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

/** Real-time minutes per run: waves (fixed per difficulty in costs.json:
 *  Hard 90, Hell+ 100) × sec/wave ÷ speed, plus altar idle on Hell+. */
export function runMinutes(input: CalcInput): number {
  const { config, costs } = input
  const speed = config.boughtNoAdsSpeed2x ? 2 : 1
  const waves = costs.wavesByDifficulty[config.difficulty]
  const altars = config.difficulty === 'hard' ? 0 : costs.altarWaitsHellPlus
  return (waves * config.secPerWave) / speed + altars * config.altarWaitSec
}

/** Daily stamina budget decomposed for the on-page formula readout. */
export function staminaBudgetParts(costs: CostData) {
  const regen = Math.floor((24 * 60) / costs.staminaRegenMinutes)
  const ads = costs.adStaminaPerDay
  const purchases = costs.defaultDiamondPurchases * costs.staminaPerPurchase
  return { regen, ads, purchases, total: regen + ads + purchases }
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
  const { config, rewards, giantTiers, costs, gacha } = input

  const minutesPerRun = runMinutes(input) / 60
  // Cycle plan: cycles × (4 ticket runs + 1 giant attempt). The giant
  // attempt itself accrues one unit of ticket progress, so only 4 farming
  // runs are needed per cycle to keep tickets break-even. Runs per giant
  // entry ticket are a fixed game constant (5) in costs.json.
  const cycles = Math.max(0, config.cycles)
  const runsPerCycle = Math.max(1, costs.runsPerGiantTicket)
  const ticketRuns = cycles * (runsPerCycle - 1)
  const giantAttempts = cycles

  // Ticket farming: base clear rewards scaled by the ticket multiplier.
  const perTicketRun = findRewardRow(rewards, config.difficulty, config.ticketMultiplier)

  // Giant farming: a giant attempt ALSO earns the normal run clear rewards
  // (incl. base gacha tickets) at its own multiplier; the tier table adds
  // that stage's drop (extra gacha tickets, stage resource, relics, and
  // Giant Marks = base 1 + stage range) — everything scales with the
  // giant multiplier, matching the official 3x/5x columns.
  const perGiantAttempt = addRewards(
    findRewardRow(rewards, config.difficulty, config.giantMultiplier),
    scaleRewards(
      findGiantBonus(giantTiers, config.difficulty, config.giantTier),
      config.giantMultiplier,
    ),
  )

  let totalRewards = addRewards(
    scaleRewards(perTicketRun, ticketRuns),
    scaleRewards(perGiantAttempt, giantAttempts),
  )
  const totalMinutes = minutesPerRun * (ticketRuns + giantAttempts)

  // Optional: replace the total draw-ticket payout with the equivalent
  // resources from the owner's measured gacha session (per-ticket rates
  // = session rewards ÷ draws; the session's own ticket returns are NOT
  // re-injected — they merely offset part of the measured spend).
  let ticketEquivalent: RewardSet | undefined
  if (config.convertTicketsToGacha && gacha.draws > 0) {
    const tickets = totalRewards.tickets ?? 0
    ticketEquivalent = {}
    for (const [k, v] of Object.entries(gacha.rewards)) {
      const per = (v as number) / gacha.draws
      if (k === 'tickets') continue
      const gained = per * tickets
      if (gained !== 0) ticketEquivalent[k as ResourceKey] = gained
    }
    const rest: RewardSet = { ...totalRewards }
    delete rest.tickets
    totalRewards = addRewards(rest, ticketEquivalent)
  }

  const perHour: RewardSet = {}
  if (totalMinutes > 0) {
    for (const k of RESOURCE_KEYS) {
      const v = totalRewards[k]
      if (v !== undefined) perHour[k] = (v / totalMinutes) * 60
    }
  }

  // Giant-ticket progress accrues on EVERY run including the giant
  // attempt itself; multipliers don't affect it.
  const ticketsEarned = Math.floor((ticketRuns + giantAttempts) / runsPerCycle)
  const ticketsUsed = giantAttempts

  // Stamina plan vs budget (stamina per run is fixed in costs.json).
  const staminaNeeded =
    ticketRuns * costs.staminaPerRun * config.ticketMultiplier +
    giantAttempts * costs.staminaPerRun * config.giantMultiplier
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
    ticketRuns,
    giantAttempts,
    minutesPerRun,
    totalMinutes,
    perTicketRun,
    perGiantAttempt,
    totalRewards,
    ticketEquivalent,
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
