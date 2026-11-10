/** Canonical game vocabulary. Keys (not display strings) flow through
 *  i18n as `mode.hell`, `resource.jelly`, … */

export type Difficulty = 'hard' | 'hell' | 'abyss' | 'deepSea'
export type RunMultiplier = 1 | 3 | 5

/** Everything the user can tweak. All fields have defaults in the store. */
export interface RunConfig {
  /** Purchased ad-free + 2x game speed package. */
  boughtNoAdsSpeed2x: boolean
  /** Giant Invasion difficulty being farmed. */
  difficulty: Difficulty
  /** Giant tier farmed, 1–5. */
  giantTier: number
  /** Stamina multiplier paid on ticket-farming runs (default 1x). */
  ticketMultiplier: RunMultiplier
  /** Stamina multiplier paid on giant attempts (default 3x). */
  giantMultiplier: RunMultiplier
  /** Planned ticket-farming runs. */
  ticketRuns: number
  /** Planned giant attempts (each consumes one giant ticket). */
  giantAttempts: number
  /** Base stamina cost of one run at 1x (multiplier scales it). */
  staminaPerRun: number
  /** Runs needed to earn one giant ticket (multiplier does NOT affect this). */
  runsPerGiantTicket: number
  /** Waves per run. */
  wavesPerRun: number
  /** Seconds per wave at 1x game speed. */
  secPerWave: number
  /** Idle seconds spent per altar pick (Hell+ only). */
  altarWaitSec: number
}

export type ResourceKey = 'exp' | 'silver' | 'tickets' | 'powder' | 'jelly' | 'pearl'

export type RewardSet = Partial<Record<ResourceKey, number>>

/** Entry of data/rewards.json — clear rewards per run keyed by
 *  difficulty × runMultiplier (mirrors the meowdb Rewards matrix). */
export interface RewardRow {
  difficulty: Difficulty
  multiplier: RunMultiplier
  rewards: RewardSet
}

/** Entry of data/giant-tiers.json — giant kill rewards keyed by
 *  difficulty × tier (1–5). Giant type is NOT reward-relevant. */
export interface GiantTierRow {
  difficulty: Difficulty
  tier: number
  rewards: RewardSet
}

/** Entry of data/costs.json — stamina economy + diamond purchase ladder. */
export interface CostData {
  /** Minutes per natural stamina regen tick (1 stamina per tick). */
  staminaRegenMinutes: number
  /** Free stamina per day from watching ads. */
  adStaminaPerDay: number
  /** Diamond ladder: cost of each stamina purchase, in order. */
  diamondPurchaseCosts: number[]
  /** Cost per purchase once the ladder is exhausted. */
  diamondPurchaseRepeatCost: number
  /** Stamina granted per diamond purchase. */
  staminaPerPurchase: number
  /** Purchases assumed already budgeted (default plan buys up to the 500 step). */
  defaultDiamondPurchases: number
  /** Altar picks mid-run on Hell and above. */
  altarWaitsHellPlus: number
}

export interface CalcInput {
  config: RunConfig
  rewards: RewardRow[]
  giantTiers: GiantTierRow[]
  costs: CostData
}

export interface CalcResult {
  /** Real-time minutes per run (waves + altar waits, after speed modifier). */
  minutesPerRun: number
  totalMinutes: number
  /** Clear rewards for one ticket run at ticketMultiplier. */
  perTicketRun: RewardSet
  /** Giant rewards for one attempt at giantMultiplier. */
  perGiantAttempt: RewardSet
  totalRewards: RewardSet
  /** Reward per hour of real time. */
  perHour: RewardSet
  /** Giant tickets earned from ticket runs (ignores multipliers). */
  ticketsEarned: number
  /** Tickets the planned giant attempts consume. */
  ticketsUsed: number
  ticketsShortfall: number
  /** Total stamina the plan needs. */
  staminaNeeded: number
  /** Daily stamina: regen + ads + default diamond purchases. */
  staminaBudget: number
  /** Stamina above budget. */
  extraStamina: number
  /** Extra diamond purchases required above the default budget. */
  extraPurchases: number
  /** Diamonds those extra purchases cost. */
  extraDiamonds: number
}
