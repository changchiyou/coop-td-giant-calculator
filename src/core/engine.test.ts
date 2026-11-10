import { describe, expect, it } from 'vitest'

import { computeRun, diamondCostOfPurchases, findGiantBonus, findRewardRow } from './engine'
import type { CalcInput, CostData, GiantTierRow, RewardRow, RunConfig } from './types'
import { DEFAULT_CONFIG } from '../store/useRunStore'

// Frozen fixture independent of shipped JSON so engine math stays pinned.
const REWARDS: RewardRow[] = [
  { difficulty: 'hell', multiplier: 1, rewards: { exp: 2500, silver: 5000, tickets: 2, powder: 20 } },
  { difficulty: 'hell', multiplier: 3, rewards: { exp: 7500, silver: 15000, tickets: 6, powder: 60 } },
]

const TIERS: GiantTierRow[] = [{ difficulty: 'hell', tier: 5, rewards: { tickets: 4, jelly: 10 } }]

const COSTS: CostData = {
  staminaPerRun: 5,
  staminaRegenMinutes: 6,
  adStaminaPerDay: 100,
  diamondPurchaseCosts: [50, 50, 50, 100, 300, 500],
  diamondPurchaseRepeatCost: 1000,
  staminaPerPurchase: 25,
  defaultDiamondPurchases: 6,
  altarWaitsHellPlus: 3,
}

const cfg = (over: Partial<RunConfig> = {}): RunConfig => ({ ...DEFAULT_CONFIG, ...over })

const input = (config: RunConfig, over: Partial<CalcInput> = {}): CalcInput => ({
  config,
  rewards: REWARDS,
  giantTiers: TIERS,
  costs: COSTS,
  ...over,
})

describe('findRewardRow', () => {
  it('returns exact difficulty × multiplier row', () => {
    expect(findRewardRow(REWARDS, 'hell', 3).exp).toBe(7500)
  })

  it('scales the 1x row when the multiplier row is missing', () => {
    expect(findRewardRow(REWARDS, 'hell', 5).exp).toBe(12500)
  })

  it('returns empty for unknown difficulty', () => {
    expect(findRewardRow(REWARDS, 'deepSea', 1)).toEqual({})
  })
})

describe('findGiantBonus', () => {
  it('returns the difficulty × tier row', () => {
    expect(findGiantBonus(TIERS, 'hell', 5).jelly).toBe(10)
  })

  it('returns empty for missing tier', () => {
    expect(findGiantBonus(TIERS, 'hell', 2)).toEqual({})
  })
})

describe('run time', () => {
  it('1x speed, Hell: 100×12s + 3×30s altar = 21.5 min', () => {
    const r = computeRun(input(cfg({ boughtNoAdsSpeed2x: false })))
    expect(r.minutesPerRun).toBeCloseTo((100 * 12 + 3 * 30) / 60)
  })

  it('2x speed (default) halves wave time but not altar waits', () => {
    const r = computeRun(input(cfg()))
    expect(r.minutesPerRun).toBeCloseTo((100 * 12) / 2 / 60 + 3 * 30 / 60)
  })

  it('Hard has no altar waits', () => {
    const r = computeRun(input(cfg({ difficulty: 'hard' })))
    expect(r.minutesPerRun).toBeCloseTo((100 * 12) / 2 / 60)
  })
})

describe('diamond ladder', () => {
  it('walks the ladder then repeats', () => {
    // 6 ladder steps: 50+50+50+100+300+500 = 1050; 2 more at 1000 each.
    expect(diamondCostOfPurchases(6, COSTS)).toBe(1050)
    expect(diamondCostOfPurchases(8, COSTS)).toBe(3050)
  })
})

describe('computeRun cycle model', () => {
  it('default plan: 10 cycles = 50 ticket runs @1x + 10 giant attempts @3x', () => {
    const r = computeRun(input(cfg()))
    expect(r.ticketRuns).toBe(50)
    expect(r.giantAttempts).toBe(10)
    // Whole cycles always break even on tickets: 50 // 5 = 10 earned, 10 used.
    expect(r.ticketsEarned).toBe(10)
    expect(r.ticketsShortfall).toBe(0)
    // per ticket run = hell1x clear rewards at 1x.
    expect(r.perTicketRun.exp).toBe(2500)
    // per giant attempt = tier-5 rewards × giant multiplier 3.
    expect(r.perGiantAttempt.tickets).toBe(12)
    expect(r.perGiantAttempt.jelly).toBe(30)
    // totals combine both phases.
    expect(r.totalRewards.exp).toBe(2500 * 50)
    expect(r.totalRewards.jelly).toBe(30 * 10)
    // stamina: 50×5×1 + 10×5×3 = 400; budget = 240 + 100 + 6×25 = 490 → under.
    expect(r.staminaNeeded).toBe(400)
    expect(r.staminaBudget).toBe(490)
    expect(r.extraDiamonds).toBe(0)
  })

  it('stamina over budget lists extra purchases and diamond cost', () => {
    // Per cycle: 5×5×1 + 1×5×3 = 40 stamina. 13 cycles = 520 → 30 over 490
    // → 2 purchases; both past the ladder → 2 × 1000.
    const r = computeRun(input(cfg({ cycles: 13 })))
    expect(r.staminaNeeded).toBe(520)
    expect(r.extraStamina).toBe(30)
    expect(r.extraPurchases).toBe(2)
    expect(r.extraDiamonds).toBe(2000)
  })

  it('ticket count ignores multipliers', () => {
    const r = computeRun(input(cfg({ cycles: 4, ticketMultiplier: 5 })))
    expect(r.ticketsEarned).toBe(4)
  })

  it('runs-per-ticket scales the split inside each cycle', () => {
    const r = computeRun(input(cfg({ cycles: 3, runsPerGiantTicket: 10 })))
    expect(r.ticketRuns).toBe(30)
    expect(r.giantAttempts).toBe(3)
    expect(r.ticketsShortfall).toBe(0)
    // stamina: 30×5×1 + 3×5×3 = 195.
    expect(r.staminaNeeded).toBe(195)
  })

  it('zero cycles yields zero totals, no NaN per-hour', () => {
    const r = computeRun(input(cfg({ cycles: 0 })))
    expect(r.totalMinutes).toBe(0)
    expect(r.perHour).toEqual({})
  })
})
