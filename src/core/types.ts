/** Canonical game vocabulary. Keys (not display strings) flow through
 *  i18n as `mode.hell`, `giantType.healing`, `resource.jelly`, … */

export type Difficulty = 'hard' | 'hell' | 'abyss' | 'deepSea'
export type GiantType = 'hitCount' | 'shield' | 'healing'
export type RunMultiplier = 1 | 3 | 5

/** Everything the user can tweak. All fields have defaults in the store. */
export interface RunConfig {
  /** Purchased 3x stamina boost pack (extra daily stamina). */
  bought3xStamina: boolean
  /** Purchased ad-free + 2x game speed package. */
  boughtNoAdsSpeed2x: boolean
  /** Stamina multiplier paid per run. Independent of the 3x stamina pack. */
  runMultiplier: RunMultiplier
  /** Giant Invasion difficulty being farmed. */
  difficulty: Difficulty
  /** Giant tier farmed, 1–5. */
  giantTier: number
  /** Expected Giant type for this farming session ('any' blends the table). */
  giantType: GiantType | 'any'
  /** Typical real-time minutes per full run (waves 1–100 + giant fight). */
  runMinutes: number
  /** Planned runs for this session. */
  sessions: number
  /** Ad-watch double-reward on ~1/5 of runs when no-ads package is OFF. */
  useAdDoubleReward: boolean
}

export type ResourceKey = 'exp' | 'silver' | 'tickets' | 'powder' | 'jelly' | 'pearl'

export type RewardSet = Partial<Record<ResourceKey, number>>

/** Entry of data/rewards.json — rewards per clear keyed by
 *  difficulty × runMultiplier (mirrors the meowdb Rewards matrix). */
export interface RewardRow {
  difficulty: Difficulty
  multiplier: RunMultiplier
  rewards: RewardSet
}

/** Entry of data/giant-tiers.json — Giant kill rewards keyed by
 *  difficulty × tier (1–5) × type ('any' = blended expectation). */
export interface GiantTierRow {
  difficulty: Difficulty
  tier: number
  type: GiantType | 'any'
  rewards: RewardSet
}

/** Entry of data/costs.json — one-time / per-run cost knobs. */
export interface CostData {
  /** Extra stamina granted per day by the 3x stamina pack. */
  staminaPackDailyBonus: number
  /** Base stamina recovered per natural regen tick. */
  staminaRegenPerTick: number
  /** Minutes per stamina regen tick. */
  staminaRegenMinutes: number
  /** Runs per day without the pack (stamina budget / per-run cost). */
  runsPerDayBase: number
  /** Runs per day with the 3x stamina pack. */
  runsPerDay3x: number
}

export interface CalcInput {
  config: RunConfig
  rewards: RewardRow[]
  giantTiers: GiantTierRow[]
}

export interface CalcResult {
  /** Real-time minutes per run after the 2x speed modifier. */
  minutesPerRun: number
  totalMinutes: number
  totalRewards: RewardSet
  /** Reward per hour of real time (runs × rewardsPerRun × 60 / minutes). */
  perHour: RewardSet
  /** Reward per run (per-run values, incl. giant tier bonus). */
  perRun: RewardSet
  /** Ad-double uplift baked into perRun when applicable. */
  adBonusFactor: number
  /** Effective runs/day given the stamina pack choice. */
  runsPerDay: number
}
