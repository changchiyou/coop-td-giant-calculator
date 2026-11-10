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
  mutualTicketing: false,
  giantMarkPerGiant: 1,
  runsPerGiantTicket: 5,
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
      // v1–v4 persisted superseded config shapes (wavesPerRun removed in
      // v5 — waves are fixed per difficulty in costs.json); drop on upgrade.
      version: 5,
      migrate: (persisted, version) => (version < 5 ? undefined : (persisted as RunStore)),
    },
  ),
)
