# Palforge — Palworld 1.0 Breeding Planner

Web app for planning Palworld **1.0** breeding:

- **Combo calculator** — what two parents produce
- **Find parents** — every pair that makes a target Pal
- **Breeding tree** — auto-plan a path (uses owned pals when provided)
- **Passives** — browse standard 1.0 passive skills

## Quick start

From the project root:

```bash
npm run install:web
npm run data
npm run dev
```

Or from `web/`:

```bash
cd web
npm install
npm run data
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Data

See [`data/DATA_SOURCE.md`](data/DATA_SOURCE.md). Source exports come from [tylercamp/palcalc](https://github.com/tylercamp/palcalc).

## v1 scope

- Species breeding only (no OCR, no save import yet)
- Passive browser included; perfect-passive solving comes later