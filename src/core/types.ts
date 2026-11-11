/** Canonical game vocabulary. Keys (not display strings) flow through
 *  i18n as `mode.hell`, `resource.jelly`, … */

export type Difficulty = 'hard' | 'hell' | 'abyss' | 'deepSea'
export type RunMultiplier = 1 | 3 | 5

/** Everything the user can tweak. All fields have defaults in the store.
 *
 *  Planning unit is the CYCLE: one giant run = 5 − 1 ticket-farming runs +
 *  one giant attempt (runs per giant entry ticket are FIXED at 5 in
 *  costs.json, not an input). Every run INCLUDING the giant attempt itself
 *  adds one unit of ticket progress, keeping tickets break-even. Ticket
 *  "tickets" are draw tickets (抽獎券), not giant entry tickets; giant
 *  fights hand out extra draw tickets on top.
 *
 *  Waves per run is NOT an input: it is fixed per difficulty in
 *  costs.json (Hard 90, Hell and above 100). */
export interface RunConfig {
  boughtNoAdsSpeed2x: boolean
  /** Giant Invasion difficulty being farmed. */
  difficulty: Difficulty
  /** Giant tier farmed, 1–5. */
  giantTier: number
  /** Stamina multiplier paid on ticket-farming runs (default 1x). */
  ticketMultiplier: RunMultiplier
  /** Stamina multiplier paid on giant attempts (default 3x). */
  giantMultiplier: RunMultiplier
  /** Planned full cycles (each = 4 runs + 1 giant, ticket fixed at 5). */
  cycles: number
  /** Show EXP / silver rows in the reward tables (hidden by default —
   *  they dwarf every other number and skew the per-hour view). */
  showExpSilver: boolean
  /** Convert the total draw-ticket payout into equivalent resources using
   *  the owner's measured gacha session (data/gacha-reference.json). */
  convertTicketsToGacha: boolean
  /** Giant Marks are NOT an input: each giant kill pays base 1 + the
   *  stage drop, both baked into giant-tiers.json `giantMarks` and
   *  scaled by the giant multiplier (3x/5x are linear per the table). */
  /** Seconds per wave at 1x game speed. */
  secPerWave: number
  /** Idle seconds spent per altar pick (Hell+ only). */
  altarWaitSec: number
}

export type ResourceKey =
  | 'exp'
  | 'silver'
  | 'tickets'
  | 'powder'
  | 'jelly'
  | 'royalJelly'
  | 'pearl'
  | 'godStones'
  | 'liberationStones'
  | 'relics'
  | 'giantMarks'
  | 'diamonds'
  | 'relicsGod'
  | 'relicsSuperGod'
  | 'monsters'
  | 'rareMonsters'

export type RewardSet = Partial<Record<ResourceKey, number>>

/** Entry of data/rewards.json — clear rewards per run keyed by
 *  difficulty × runMultiplier (mirrors the meowdb Rewards matrix). */
export interface RewardRow {
  difficulty: Difficulty
  multiplier: RunMultiplier
  rewards: RewardSet
}

/** Entry of data/giant-tiers.json — giant kill rewards keyed by
 *  difficulty × tier (1–5), stored at 1x: base ticket + ONLY that
 *  stage's drop (stages are claimed separately). The 3x/5x columns
 *  scale linearly. Giant type is NOT reward-relevant. */
export interface GiantTierRow {
  difficulty: Difficulty
  tier: number
  rewards: RewardSet
}

/** Entry of data/costs.json — fixed economy numbers (not user inputs). */
export interface CostData {
  /** Fixed stamina cost of any run/attempt at 1x (multiplier scales it). */
  staminaPerRun: number
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
  /** Wave count per run, fixed per difficulty (Hard 90, Hell+ 100). */
  wavesByDifficulty: Record<Difficulty, number>
  /** Runs to earn one giant entry ticket: fixed game constant (5). */
  runsPerGiantTicket: number
}

/** Entry of data/gacha-reference.json — one measured draw-ticket (抽獎券)
 *  gacha session: `draws` tickets spent, `rewards` yielded (the 55 tickets
 *  in it are re-draws partially offsetting the spend). */
export interface GachaReference {
  draws: number
  rewards: RewardSet
}

export interface CalcInput {
  config: RunConfig
  rewards: RewardRow[]
  giantTiers: GiantTierRow[]
  costs: CostData
  gacha: GachaReference
}

export interface CalcResult {
  /** Derived from cycles: ticket-farming runs = cycles × runsPerGiantTicket. */
  ticketRuns: number
  /** Derived from cycles: giant attempts = cycles. */
  giantAttempts: number
  /** Real-time minutes per run (waves + altar waits, after speed modifier). */
  minutesPerRun: number
  totalMinutes: number
  /** Clear rewards for one ticket run at ticketMultiplier. */
  perTicketRun: RewardSet
  /** Giant rewards for one attempt at giantMultiplier (+ Giant Marks). */
  perGiantAttempt: RewardSet
  totalRewards: RewardSet
  /** When convertTicketsToGacha: total draw tickets replaced by the
   *  equivalent resources from the measured session; else undefined. */
  ticketEquivalent?: RewardSet
  /** Reward per hour of real time. */
  perHour: RewardSet
  /** Giant tickets earned from ALL runs incl. giant attempts (ignores multipliers). */
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
  /** Whole-plan calendar days at 24h/day (ceil of totalMinutes / 1440). */
  estimatedDays: number
  /** Hidden cost of the default purchases the budget assumes, per day. */
  dailyPurchaseDiamonds: number
  /** dailyPurchaseDiamonds × estimatedDays. */
  planPurchaseDiamonds: number
  /** planPurchaseDiamonds + extraDiamonds. */
  totalDiamondSpend: number
  /** Draw-ticket-equivalent diamonds (always computed from gacha rates). */
  diamondIncome: number
  /** diamondIncome − totalDiamondSpend; negative = budget is optimistic. */
  diamondNet: number
}
