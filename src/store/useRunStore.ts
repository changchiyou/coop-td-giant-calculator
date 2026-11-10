import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { RunConfig } from '../core/types'

export const DEFAULT_CONFIG: RunConfig = {
  bought3xStamina: false,
  boughtNoAdsSpeed2x: false,
  runMultiplier: 1,
  difficulty: 'hell',
  giantTier: 1,
  giantType: 'any',
  runMinutes: 15,
  sessions: 10,
  useAdDoubleReward: true,
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
    { name: 'coop-td-calc-config' },
  ),
)
