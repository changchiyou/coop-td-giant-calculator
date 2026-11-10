import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { RunConfig } from '../core/types'

export const DEFAULT_CONFIG: RunConfig = {
  boughtNoAdsSpeed2x: false,
  difficulty: 'hell',
  giantTier: 5,
  ticketMultiplier: 1,
  giantMultiplier: 3,
  ticketRuns: 10,
  giantAttempts: 2,
  staminaPerRun: 20,
  runsPerGiantTicket: 5,
  wavesPerRun: 100,
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
      // v1 persisted the old single-run config shape; drop it on upgrade.
      version: 2,
      migrate: (persisted, version) => (version < 2 ? undefined : (persisted as RunStore)),
    },
  ),
)
