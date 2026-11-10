import { describe, expect, it } from 'vitest'

import { computeRun, findGiantBonus, findRewardRow } from './engine'
import type { GiantTierRow, RewardRow, RunConfig } from './types'
import { DEFAULT_CONFIG } from '../store/useRunStore'

// Frozen fixture independent of shipped JSON so engine math stays pinned.
const REWARDS: RewardRow[] = [
  { difficulty: 'hell', multiplier: 1, rewards: { exp: 2500, silver: 5000, tickets: 2, powder: 20 } },
  { difficulty: 'hell', multiplier: 3, rewards: { exp: 7500, silver: 15000, tickets: 6, powder: 60 } },
]

const TIERS: GiantTierRow[] = [
  { difficulty: 'hell', tier: 3, type: 'any', rewards: { tickets: 4, jelly: 10 } },
  { difficulty: 'hell', tier: 3, type: 'healing', rewards: { tickets: 6 } },
]

const cfg = (over: Partial<RunConfig> = {}): RunConfig => ({ ...DEFAULT_CONFIG, ...over })

describe('findRewardRow', () => {
  it('returns exact difficulty × multiplier row', () => {
    expect(findRewardRow(REWARDS, 'hell', 3).exp).toBe(7500)
  })

  it('scales the 1x row when the multiplier row is missing', () => {
    // 5x omitted from fixture → 2500 × 5.
    expect(findRewardRow(REWARDS, 'hell', 5).exp).toBe(12500)
  })

  it('returns empty for unknown difficulty', () => {
    expect(findRewardRow(REWARDS, 'deepSea', 1)).toEqual({})
  })
})

describe('findGiantBonus', () => {
  it('prefers the exact type row', () => {
    expect(findGiantBonus(TIERS, 'hell', 3, 'healing').tickets).toBe(6)
  })

  it('falls back to the any-blend row', () => {
    expect(findGiantBonus(TIERS, 'hell', 3, 'shield').jelly).toBe(10)
  })

  it('returns empty for missing tier', () => {
    expect(findGiantBonus(TIERS, 'hell', 5, 'any')).toEqual({})
  })
})

describe('computeRun', () => {
  it('2x speed halves real time; totals and per-hour follow', () => {
    const r = computeRun(
      {
        config: cfg({
          boughtNoAdsSpeed2x: true,
          runMinutes: 20,
          sessions: 6,
          useAdDoubleReward: false,
          difficulty: 'hell',
          runMultiplier: 1,
          giantTier: 3,
          giantType: 'healing',
        }),
        rewards: REWARDS,
        giantTiers: TIERS,
      },
      10,
    )
    expect(r.minutesPerRun).toBe(10)
    expect(r.totalMinutes).toBe(60)
    // per-run = hell1x + healing tier-3 bonus, no ad factor.
    expect(r.perRun.exp).toBe(2500)
    expect(r.perRun.tickets).toBe(2 + 6)
    expect(r.totalRewards.tickets).toBe(8 * 6)
    // 60 min total → per-hour == total.
    expect(r.perHour.exp).toBeCloseTo(2500 * 6)
  })

  it('ad-double uplift adds expected 20% on top', () => {
    const r = computeRun(
      {
        config: cfg({
          useAdDoubleReward: true,
          boughtNoAdsSpeed2x: false,
          giantTier: 1,
          difficulty: 'hell',
          runMultiplier: 1,
          sessions: 1,
        }),
        rewards: REWARDS,
        giantTiers: [],
      },
      10,
    )
    expect(r.perRun.exp).toBe(2500 * 1.2)
  })

  it('no-ads package kills the ad-double uplift', () => {
    const r = computeRun(
      {
        config: cfg({ useAdDoubleReward: true, boughtNoAdsSpeed2x: true, giantTier: 1 }),
        rewards: REWARDS,
        giantTiers: [],
      },
      10,
    )
    expect(r.adBonusFactor).toBe(1)
  })

  it('zero sessions yields zero totals, no NaN per-hour', () => {
    const r = computeRun(
      { config: cfg({ sessions: 0 }), rewards: REWARDS, giantTiers: [] },
      10,
    )
    expect(r.totalMinutes).toBe(0)
    expect(r.perHour).toEqual({})
  })
})
