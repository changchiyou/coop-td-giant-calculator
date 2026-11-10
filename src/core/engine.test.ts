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
  it('1x speed, Hell: 100×12s + 3×30s altar = 22.5 min', () => {
    const r = computeRun(input(cfg({ boughtNoAdsSpeed2x: false })))
    expect(r.minutesPerRun).toBeCloseTo((100 * 12 + 3 * 30) / 60)
  })

  it('2x speed halves wave time but not altar waits', () => {
    const r = computeRun(input(cfg({ boughtNoAdsSpeed2x: true })))
    expect(r.minutesPerRun).toBeCloseTo((100 * 12) / 2 / 60 + 3 * 30 / 60)
  })

  it('Hard has no altar waits', () => {
    const r = computeRun(input(cfg({ difficulty: 'hard' })))
    expect(r.minutesPerRun).toBeCloseTo((100 * 12) / 60)
  })
})

describe('diamond ladder', () => {
  it('walks the ladder then repeats', () => {
    // 6 ladder steps: 50+50+50+100+300+500 = 1050; 2 more at 1000 each.
    expect(diamondCostOfPurchases(6, COSTS)).toBe(1050)
    expect(diamondCostOfPurchases(8, COSTS)).toBe(3050)
  })
})

describe('computeRun ticket/giant split', () => {
  it('default plan: 10 ticket runs @1x + 2 giant attempts @3x', () => {
    const r = computeRun(input(cfg()))
    // Ticket runs: 10 // 5 = 2 tickets earned, 2 used → no shortfall.
    expect(r.ticketsEarned).toBe(2)
    expect(r.ticketsShortfall).toBe(0)
    // per ticket run = hell1x clear rewards at 1x.
    expect(r.perTicketRun.exp).toBe(2500)
    // per giant attempt = tier-5 rewards × giant multiplier 3.
    expect(r.perGiantAttempt.tickets).toBe(12)
    expect(r.perGiantAttempt.jelly).toBe(30)
    // totals combine both phases.
    expect(r.totalRewards.exp).toBe(2500 * 10)
    expect(r.totalRewards.jelly).toBe(30 * 2)
    expect(r.staminaBudget).toBe(490)
    // stamina: 10×20×1 + 2×20×3 = 320; budget = 240 + 100 + 6×25 = 490 → under.
    expect(r.staminaNeeded).toBe(320)
  })

  it('stamina over budget lists extra purchases and diamond cost', () => {
    // 40 ticket runs @1x = 800 stamina; budget 490 → 310 over → 13 purchases (325).
    const r = computeRun(input(cfg({ ticketRuns: 40, giantAttempts: 0 })))
    expect(r.extraStamina).toBe(310)
    expect(r.extraPurchases).toBe(13)
    // purchases 7..19 are all past the ladder → 13 × 1000.
    expect(r.extraDiamonds).toBe(13000)
  })

  it('ticket count ignores multipliers', () => {
    const r = computeRun(input(cfg({ ticketRuns: 10, ticketMultiplier: 5 })))
    expect(r.ticketsEarned).toBe(2)
  })

  it('reports ticket shortfall when attempts exceed earnings', () => {
    const r = computeRun(input(cfg({ ticketRuns: 5, giantAttempts: 3 })))
    expect(r.ticketsEarned).toBe(1)
    expect(r.ticketsShortfall).toBe(2)
  })

  it('zero runs yields zero totals, no NaN per-hour', () => {
    const r = computeRun(input(cfg({ ticketRuns: 0, giantAttempts: 0 })))
    expect(r.totalMinutes).toBe(0)
    expect(r.perHour).toEqual({})
  })
})
