import type {
  CalcInput,
  CalcResult,
  GiantTierRow,
  RewardSet,
  RewardRow,
  ResourceKey,
} from './types'

export const RESOURCE_KEYS: ResourceKey[] = [
  'exp',
  'silver',
  'tickets',
  'powder',
  'jelly',
  'pearl',
]

/** Find the reward row for difficulty × multiplier. Falls back to the 1x
 *  row scaled by the multiplier when the table omits a row (the game
 *  scales every reward in lockstep, per the official reward matrix). */
export function findRewardRow(
  rows: RewardRow[],
  difficulty: CalcInput['config']['difficulty'],
  multiplier: 1 | 3 | 5,
): RewardSet {
  const exact = rows.find((r) => r.difficulty === difficulty && r.multiplier === multiplier)
  if (exact) return exact.rewards
  const base = rows.find((r) => r.difficulty === difficulty && r.multiplier === 1)
  if (!base) return {}
  return scaleRewards(base.rewards, multiplier)
}

/** Giant tier bonus: prefer the exact (difficulty, tier, type) row,
 *  fall back to the 'any' blend row for the same tier. */
export function findGiantBonus(
  rows: GiantTierRow[],
  difficulty: CalcInput['config']['difficulty'],
  tier: number,
  type: CalcInput['config']['giantType'],
): RewardSet {
  const exact = rows.find(
    (r) => r.difficulty === difficulty && r.tier === tier && r.type === type,
  )
  if (exact) return exact.rewards
  const blend = rows.find((r) => r.difficulty === difficulty && r.tier === tier && r.type === 'any')
  return blend?.rewards ?? {}
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

/** Ad-double uplift: expected value when ~1/5 of runs opt into the
 *  watch-ad double reward (impossible with the no-ads package). */
export function adBonusFactor(adDouble: boolean, noAds: boolean): number {
  // 1/5 of runs gain +100% → 0.2 × 2 = expected factor 1.4 on those runs.
  return adDouble && !noAds ? 1 + 0.2 : 1
}

export function computeRun(input: CalcInput, runsPerDay: number): CalcResult {
  const { config, rewards, giantTiers } = input

  const speed = config.boughtNoAdsSpeed2x ? 0.5 : 1
  const minutesPerRun = config.runMinutes * speed

  const base = findRewardRow(rewards, config.difficulty, config.runMultiplier)
  const giant = findGiantBonus(giantTiers, config.difficulty, config.giantTier, config.giantType)
  const adFactor = adBonusFactor(config.useAdDoubleReward, config.boughtNoAdsSpeed2x)

  const perRunRaw = addRewards(base, giant)
  const perRun = scaleRewards(perRunRaw, adFactor)

  const n = Math.max(0, config.sessions)
  const totalMinutes = minutesPerRun * n
  const totalRewards = scaleRewards(perRun, n)

  const perHour: RewardSet = {}
  if (totalMinutes > 0) {
    for (const k of RESOURCE_KEYS) {
      const v = totalRewards[k]
      if (v !== undefined) perHour[k] = (v / totalMinutes) * 60
    }
  }

  return {
    minutesPerRun,
    totalMinutes,
    totalRewards,
    perHour,
    perRun,
    adBonusFactor: adFactor,
    runsPerDay,
  }
}

/** Format minutes as "1h 23m" independent of locale display. */
export function formatMinutes(min: number): string {
  const total = Math.round(min)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
