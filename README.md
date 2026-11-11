# Coop TD Giant Farming Calculator

Static web calculator (GitHub Pages) for planning Giant Invasion farming in
Coop TD: Together, planned in whole **cycles**: 4 ticket-farming runs +
one giant attempt (each run costs fixed 5 stamina; every giant entry ticket
needs a fixed 5 runs — every run including the giant attempt adds one unit
of ticket progress, so tickets always break even). EXP and silver rows are
hidden by default (checkbox to show).
Giant fights pay extra draw tickets and stage rewards (God Stones / Liberation
Stones / Jelly / Royal Jelly / Giant Marks per the official announcement
tables, ranges taken as midpoints; each giant kill pays base 1 mark + the
stage range, all data-driven). Total draw tickets can optionally be converted
into equivalent resources using an owner-measured gacha session (default on;
`gacha-reference.json`). Reports time,
stamina plan vs daily budget (regen + ad stamina + diamond purchase ladder),
extra diamonds needed, and rewards per run / total / per hour.

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
  - `giant-tiers.json` — giant kill rewards for difficulty × tier(1–5)
    at 1x (base gacha tickets + that stage's drop only — stages are
    claimed separately; OCR'd from the official wiki table).
  - `costs.json` — stamina economy: fixed 5 stamina per run at 1x, regen
    rate, daily ad stamina, diamond purchase ladder (50/50/50/100/300/500
    then 1000 each, +25 stamina), default assumed purchases, Hell+ altar waits,
    fixed runs-per-giant-ticket (5).
  - `gacha-reference.json` — one measured draw-ticket gacha session
    (1389 draws → silver / diamonds / god stones / powder / relics / monsters);
    drives the "convert tickets to equivalent resources" option.
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
