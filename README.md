# Coop TD Giant Farming Calculator

Static web calculator (GitHub Pages) for planning Giant Invasion farming in
Coop TD: Together — total time, total rewards, and average rewards per run /
per hour, based on stamina purchases, run multiplier, difficulty, and Giant
tier.

Live: https://changchiyou.github.io/coop-td-giant-calculator/

## Stack

Vite + React + TypeScript, Tailwind CSS v4, zustand (persisted inputs),
react-i18next (en / zh-TW / ja / ko), zod (data-table validation), vitest.

## Layout

- `src/core/` — pure calculation layer (`types.ts`, `engine.ts`, `schema.ts`).
  No React/IO. Unit-tested in `engine.test.ts`.
- `src/data/` — data-driven reward tables (JSON, zod-validated at load):
  - `rewards.json` — difficulty × run-multiplier clear rewards
    (seeded from <https://meowdb.com/db/coop-td/rewards>).
  - `giant-tiers.json` — placeholder rows for the difficulty × tier(1–5) ×
    giant-type reward mapping; fill in real values as they become available.
  - `costs.json` — stamina/pack economy knobs.
- `src/i18n/` — one JSON per locale; game terms (Hard/Hell/Abyss/Deep Sea,
  Giant types, resources) are translated per locale.
- `src/store/` — zustand store; every input has a default and persists to
  localStorage.
- `src/components/` — input panel + result panel.

## Adding a reward mapping table

Add rows to `src/data/*.json` matching the zod schemas in
`src/core/schema.ts` — no engine code changes needed. Rows are validated at
load; malformed data fails visibly.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173/coop-td-giant-calculator/
npm test           # vitest (engine math)
npm run build      # tsc -b && vite build → dist/
```

Deploy: push to `main` → `.github/workflows/deploy.yml` builds and publishes
to GitHub Pages. Keep `base` in `vite.config.ts` equal to `/<repo>/`.
