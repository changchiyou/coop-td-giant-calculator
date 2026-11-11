import { describe, expect, it } from 'vitest'

import {
  addRewards,
  computeRun,
  diamondCostOfPurchases,
  findGiantBonus,
  findRewardRow,
  formatMinutes,
  staminaBudgetParts,
} from './engine'
import type { CalcInput, RunConfig } from './types'
import { COSTS, GACHA_REF, GIANT_TIER_ROWS, REWARD_ROWS } from '../data'

const DEFAULT: RunConfig = {
  boughtNoAdsSpeed2x: true,
  difficulty: 'hell',
  giantTier: 5,
  ticketMultiplier: 1,
  giantMultiplier: 3,
  cycles: 10,
  showExpSilver: false,
  // Raw-reward tests opt out; the gacha conversion has its own tests.
  convertTicketsToGacha: false,
  secPerWave: 12,
  altarWaitSec: 30,
}

const input = (over: Partial<RunConfig> = {}): CalcInput => ({
  config: { ...DEFAULT, ...over },
  rewards: REWARD_ROWS,
  giantTiers: GIANT_TIER_ROWS,
  costs: COSTS,
  gacha: GACHA_REF,
})

describe('runMinutes', () => {
  it('2x speed + 3 altar waits on Hell', () => {
    // 100 waves × 12s / 2 + 3 × 30s = 600 + 90 = 690s = 11.5m
    expect(computeRun(input()).minutesPerRun).toBeCloseTo(11.5)
  })
  it('1x speed doubles wave time', () => {
    // 1200 + 90 = 1290s = 21.5m
    expect(computeRun(input({ boughtNoAdsSpeed2x: false })).minutesPerRun).toBeCloseTo(21.5)
  })
  it('Hard: 90 waves, no altar waits', () => {
    // 90 × 12 / 2 = 540s = 9m (waves are fixed per difficulty)
    expect(computeRun(input({ difficulty: 'hard' })).minutesPerRun).toBeCloseTo(9)
  })
})

describe('cycle plan', () => {
  it('giant run counts as ticket progress: 10 cycles → 40 ticket runs + 10 giants', () => {
    const r = computeRun(input())
    expect(r.ticketRuns).toBe(40)
    expect(r.giantAttempts).toBe(10)
    // every run accrues progress: 50 runs / 5 per ticket = 10 earned = 10 used
    expect(r.ticketsEarned).toBe(10)
    expect(r.ticketsUsed).toBe(10)
    expect(r.ticketsShortfall).toBe(0)
  })
  it('total time covers all runs', () => {
    const r = computeRun(input())
    expect(r.totalMinutes).toBeCloseTo(11.5 * 50)
  })
})

describe('rewards', () => {
  it('ticket run uses the ticket multiplier row', () => {
    const r = computeRun(input({ ticketMultiplier: 5 }))
    expect(r.perTicketRun).toEqual({ exp: 12500, silver: 25000, tickets: 10, powder: 100 })
  })
  it('giant run = clear rewards at its multiplier + tier bonus scaled', () => {
    // Stage rewards are claimed per stage: a Hell T5 kill pays ONLY stage 5
    // (1 ticket + 8.5 liberationStones + 1 relic + 13.5 marks (base 1 +
    // 10~15 midpoint) at 1x). At 3x: 3 tickets + 25.5 + 3 relics, plus the
    // Hell 3x clear row (6 tickets, powder 60, …).
    const r = computeRun(input())
    expect(r.perGiantAttempt.tickets).toBeCloseTo(9) // 6 clear + 3 bonus
    expect(r.perGiantAttempt.godStones).toBeUndefined()
    expect(r.perGiantAttempt.liberationStones).toBeCloseTo(25.5)
    expect(r.perGiantAttempt.powder).toBeCloseTo(60)
    expect(r.perGiantAttempt.relics).toBeCloseTo(3) // 1 relic × 3x
    expect(r.perGiantAttempt.giantMarks).toBeCloseTo(40.5) // (1 + 12.5) × 3x
  })
  it('Giant Marks are data-driven per difficulty × stage', () => {
    // Hard T1: base 1 + 1~2 midpoint 1.5 = 2.5 at 1x → 12.5 over 10 cycles.
    const r = computeRun(input({ difficulty: 'hard', giantTier: 1, giantMultiplier: 1 }))
    expect(r.perGiantAttempt.giantMarks).toBeCloseTo(2.5)
    expect(r.totalRewards.giantMarks).toBeCloseTo(25)
  })
  it('deepSea stages 1-2 pay Jelly, 3-5 Royal Jelly', () => {
    const r = computeRun(input({ difficulty: 'deepSea', giantTier: 1 }))
    // clear row 3x: tickets 9; bonus 3x: 4×3=12 → 21
    expect(r.perGiantAttempt.tickets).toBeCloseTo(21)
    // jelly: clear 3x row 6 + stage-1 bonus 40×3 = 126; no royal at T1
    expect(r.perGiantAttempt.jelly).toBeCloseTo(126)
    expect(r.perGiantAttempt.royalJelly).toBeUndefined()
  })
  it('totals accumulate both phases', () => {
    const r = computeRun(input())
    // powder only from clear rows: 40×20 + 10×60 = 1400
    expect(r.totalRewards.powder).toBeCloseTo(1400)
    expect(r.totalRewards.tickets).toBeCloseTo(170)
    // relics only from giants: 10 × (1 × 3) = 30
    expect(r.totalRewards.relics).toBeCloseTo(30)
  })
  it('gacha conversion replaces total draw tickets with equivalent resources', () => {
    // Default plan totals 170 tickets. Owner session: 1389 draws →
    // 314000 silver etc. Per-ticket rates × 170; session ticket returns
    // (55/1389) are NOT re-injected.
    const r = computeRun(input({ convertTicketsToGacha: true }))
    expect(r.totalRewards.tickets).toBeUndefined()
    const per = (n: number) => (n / GACHA_REF.draws) * 170
    // silver also comes from clear rows: 40×5000 + 10×15000 = 350000
    expect(r.totalRewards.silver).toBeCloseTo(per(314000) + 350000)
    expect(r.totalRewards.diamonds).toBeCloseTo(per(28500))
    expect(r.totalRewards.godStones).toBeCloseTo(per(1730))
    expect(r.totalRewards.powder).toBeCloseTo(per(282) + 1400) // merged with clears
    expect(r.totalRewards.relics).toBeCloseTo(per(50) + 30)
    expect(r.totalRewards.relicsGod).toBeCloseTo(per(25))
    expect(r.totalRewards.monsters).toBeCloseTo(per(1405))
    expect(r.ticketEquivalent?.tickets).toBeUndefined()
  })
  it('gacha conversion leaves per-run rows untouched', () => {
    const r = computeRun(input({ convertTicketsToGacha: true }))
    expect(r.perGiantAttempt.tickets).toBeCloseTo(9)
    expect(r.perTicketRun.tickets).toBeCloseTo(2)
  })
})

describe('stamina plan', () => {
  it('fixed 5 stamina per run scaled by multipliers', () => {
    const r = computeRun(input())
    // 40×5×1 + 10×5×3 = 200 + 150 = 350
    expect(r.staminaNeeded).toBe(350)
    expect(r.staminaBudget).toBe(490)
    expect(r.extraStamina).toBe(0)
    expect(r.extraDiamonds).toBe(0)
  })
  it('budget 490 decomposes as regen + ads + purchases', () => {
    const parts = staminaBudgetParts(COSTS)
    expect(parts).toEqual({ regen: 240, ads: 100, purchases: 150, total: 490 })
  })
  it('overage walks the diamond ladder past the default budget', () => {
    // 20 cycles: 80×5 + 20×15 = 700 → 210 over → 9 purchases
    const r = computeRun(input({ cycles: 20 }))
    expect(r.staminaNeeded).toBe(700)
    expect(r.extraStamina).toBe(210)
    expect(r.extraPurchases).toBe(9)
    // purchases 7–15 (1-indexed): 1000×3 ladder tail? ladder is
    // [50,50,50,100,300,500] then 1000: #7..#15 → 9 × 1000 = 9000
    expect(r.extraDiamonds).toBe(9000)
  })
})

describe('helpers', () => {
  it('diamondCostOfPurchases walks ladder then repeat', () => {
    expect(diamondCostOfPurchases(0, COSTS)).toBe(0)
    expect(diamondCostOfPurchases(6, COSTS)).toBe(1050)
    expect(diamondCostOfPurchases(8, COSTS)).toBe(3050)
  })
  it('findRewardRow falls back to scaled 1x row', () => {
    const rows = [{ difficulty: 'hell', multiplier: 1, rewards: { exp: 100 } }] as const
    expect(findRewardRow(rows as never, 'hell', 5)).toEqual({ exp: 500 })
  })
  it('findGiantBonus returns {} for missing row', () => {
    expect(findGiantBonus([], 'hell', 3)).toEqual({})
  })
  it('addRewards merges and drops zeros', () => {
    expect(addRewards({ tickets: 2 }, { tickets: 0, jelly: 3 })).toEqual({
      tickets: 2,
      jelly: 3,
    })
  })
  it('formatMinutes', () => {
    expect(formatMinutes(45.4)).toBe('45m')
    expect(formatMinutes(690)).toBe('11h 30m')
  })
})
