# Coop TD Giant Farming Calculator

Static web calculator (GitHub Pages) for planning Giant Invasion farming in
Coop TD: Together — split into a **ticket-farming** phase (runs earn giant
tickets, 1 ticket per N runs regardless of stamina multiplier) and a **giant
phase** (each attempt consumes a ticket; the giant stamina multiplier scales
the giant's bonus rewards). Reports time, stamina plan vs daily budget
(regen + ad stamina + diamond purchase ladder), extra diamonds needed, and
rewards per run / total / per hour.

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
  - `giant-tiers.json` — placeholder rows for the difficulty × tier(1–5)
    reward mapping (giant type is reward-irrelevant); fill in real values as
    they become available.
  - `costs.json` — stamina economy: regen rate, daily ad stamina, diamond
    purchase ladder (50/50/50/100/300/500 then 1000 each, +25 stamina),
    default assumed purchases, Hell+ altar waits.
- `src/i18n/` — one JSON per locale; game terms (Hard/Hell/Abyss/Deep Sea,
  resources) are translated per locale.
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
