import { z } from 'zod'

/** Zod schemas for the JSON data files. Mapping tables the user supplies
 *  later must validate against these before the engine touches them. */

export const rewardSetSchema = z
  .object({
    exp: z.number().nonnegative().optional(),
    silver: z.number().nonnegative().optional(),
    /** Gacha tickets (抽獎券), not giant entry tickets. */
    tickets: z.number().nonnegative().optional(),
    powder: z.number().nonnegative().optional(),
    jelly: z.number().nonnegative().optional(),
    royalJelly: z.number().nonnegative().optional(),
    pearl: z.number().nonnegative().optional(),
    godStones: z.number().nonnegative().optional(),
    liberationStones: z.number().nonnegative().optional(),
    /** Generic relics (文物): general~Super-God-exclusive drops. */
    relics: z.number().nonnegative().optional(),
    giantMarks: z.number().nonnegative().optional(),
    diamonds: z.number().nonnegative().optional(),
    relicsGod: z.number().nonnegative().optional(),
    relicsSuperGod: z.number().nonnegative().optional(),
    monsters: z.number().nonnegative().optional(),
    rareMonsters: z.number().nonnegative().optional(),
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
    rewards: rewardSetSchema,
  })
  .strict()

export const costDataSchema = z
  .object({
    /** Fixed stamina cost of any run at 1x — economy constant, not an input. */
    staminaPerRun: z.number().positive(),
    staminaRegenMinutes: z.number().positive(),
    adStaminaPerDay: z.number().nonnegative(),
    diamondPurchaseCosts: z.array(z.number().positive()).nonempty(),
    diamondPurchaseRepeatCost: z.number().positive(),
    staminaPerPurchase: z.number().positive(),
    defaultDiamondPurchases: z.number().int().nonnegative(),
    altarWaitsHellPlus: z.number().int().nonnegative(),
    /** Runs to earn one giant entry ticket: fixed game constant (5). */
    runsPerGiantTicket: z.number().int().positive(),
    /** Wave count per run, fixed per difficulty (Hard 90, Hell+ 100). */
    wavesByDifficulty: z.object({
      hard: z.number().positive(),
      hell: z.number().positive(),
      abyss: z.number().positive(),
      deepSea: z.number().positive(),
    }),
  })
  .strict()

export const gachaFileSchema = z.object({
  gacha: z.object({ draws: z.number().int().positive(), rewards: rewardSetSchema }).strict(),
})

export const rewardsFileSchema = z.object({ rewards: z.array(rewardRowSchema) })
export const giantTiersFileSchema = z.object({ giantTiers: z.array(giantTierRowSchema) })

export type RewardRowInput = z.infer<typeof rewardRowSchema>
export type GiantTierRowInput = z.infer<typeof giantTierRowSchema>
export type CostDataInput = z.infer<typeof costDataSchema>
