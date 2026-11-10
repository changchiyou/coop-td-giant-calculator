import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { RunConfig } from '../core/types'

export const DEFAULT_CONFIG: RunConfig = {
  boughtNoAdsSpeed2x: true,
  difficulty: 'hell',
  giantTier: 5,
  ticketMultiplier: 1,
  giantMultiplier: 3,
  cycles: 10,
  showExpSilver: false,
  secPerWave: 12,
  altarWaitSec: 30,
}

interface RunStore {
  config: RunConfig
  set: <K extends keyof RunConfig>(key: K, value: RunConfig[K]) => void
  reset: () => void
}

export const useRunStore = create<RunStore>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      set: (key, value) => set((s) => ({ config: { ...s.config, [key]: value } })),
      reset: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: 'coop-td-calc-config',
      // v1–v6 persisted superseded config shapes (v7 drops
      // runsPerGiantTicket — fixed game constant in costs.json — and adds
      // showExpSilver); drop on upgrade.
      version: 7,
      migrate: (persisted, version) => (version < 7 ? undefined : (persisted as RunStore)),
    },
  ),
)
