/** Single typed entry point for all data tables. Raw JSON is validated
 *  with zod here so a malformed mapping table fails loudly at load,
 *  and callers get proper Difficulty/RunMultiplier literal types. */

import type { CostData, GachaReference, GiantTierRow, RewardRow } from '../core/types'
import {
  costDataSchema,
  giantTiersFileSchema,
  rewardsFileSchema,
  gachaFileSchema,
} from '../core/schema'

import costsRaw from './costs.json'
import gachaRefRaw from './gacha-reference.json'
import giantTiersRaw from './giant-tiers.json'
import rewardsRaw from './rewards.json'

// `_source` is human-facing provenance metadata, not table data. Row-level
// schemas stay .strict() so real typos still fail loudly.
const { _source: _r, ...rewardsDoc } = rewardsRaw
const { _source: _g, ...giantTiersDoc } = giantTiersRaw
const { _source: _c, ...costsDoc } = costsRaw
const { _source: _gc, ...gachaDoc } = gachaRefRaw

export const REWARD_ROWS: RewardRow[] = rewardsFileSchema.parse(rewardsDoc).rewards
export const GIANT_TIER_ROWS: GiantTierRow[] =
  giantTiersFileSchema.parse(giantTiersDoc).giantTiers
export const COSTS: CostData = costDataSchema.parse(costsDoc)
export const GACHA_REF: GachaReference = gachaFileSchema.parse(gachaDoc).gacha
