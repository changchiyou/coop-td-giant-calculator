import { z } from 'zod'

/** Zod schemas for the JSON data files. Mapping tables the user supplies
 *  later must validate against these before the engine touches them. */

export const resourceKeySchema = z.enum([
  'exp',
  'silver',
  'tickets',
  'powder',
  'jelly',
  'pearl',
])

export const rewardSetSchema = z
  .object({
    exp: z.number().nonnegative().optional(),
    silver: z.number().nonnegative().optional(),
    tickets: z.number().nonnegative().optional(),
    powder: z.number().nonnegative().optional(),
    jelly: z.number().nonnegative().optional(),
    pearl: z.number().nonnegative().optional(),
  })
  .strict()

export const rewardRowSchema = z
  .object({
    difficulty: z.enum(['hard', 'hell', 'abyss', 'deepSea']),
    multiplier: z.union([z.literal(1), z.literal(3), z.literal(5)]),
    rewards: rewardSetSchema,
  })
  .strict()

export const giantTierRowSchema = z
  .object({
    difficulty: z.enum(['hard', 'hell', 'abyss', 'deepSea']),
    tier: z.number().int().min(1).max(5),
    type: z.enum(['hitCount', 'shield', 'healing', 'any']),
    rewards: rewardSetSchema,
  })
  .strict()

export const costDataSchema = z
  .object({
    staminaPackDailyBonus: z.number().nonnegative(),
    staminaRegenPerTick: z.number().nonnegative(),
    staminaRegenMinutes: z.number().positive(),
    runsPerDayBase: z.number().int().nonnegative(),
    runsPerDay3x: z.number().int().nonnegative(),
  })
  .strict()

export const rewardsFileSchema = z.object({ rewards: z.array(rewardRowSchema) })
export const giantTiersFileSchema = z.object({ giantTiers: z.array(giantTierRowSchema) })

export type RewardRowInput = z.infer<typeof rewardRowSchema>
export type GiantTierRowInput = z.infer<typeof giantTierRowSchema>
export type CostDataInput = z.infer<typeof costDataSchema>
