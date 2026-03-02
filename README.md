# Bastion Twin: SME Cyber Defense Planner (Turkmen-First)

MVP blueprint and rollout plan:
- [Bastion Twin MVP Blueprint](docs/BASTION_TWIN_MVP_BLUEPRINT.md)

Bastion Twin is a practical cyber-defense planning app for SME security teams.
It extends the existing brute-force simulator into an interactive decision platform with:

- Scenario Composer (attack + business context)
- Live Workspace Dashboard (real-time telemetry)
- Defense Lab (interactive control tuning)
- Baseline vs Hardened comparison snapshots
- Bilingual report export (`tk-TM`, `en-US`)
- In-app Guide page explaining workflow, usefulness, and quick-start steps
- Turkmen-first localization with locale completeness checks

## What was implemented

### Frontend (active in this repository)
- Upgraded app to multi-view Bastion Twin workflow:
  - `Workspace Dashboard`
  - `Scenario Composer`
  - `Defense Lab`
  - `Comparison View`
  - `Reports`
- Added custom Bastion Atlas design system (tokens + shape language + motion)
- Added localization provider with `tk-TM` default and language switcher
- Added persisted scenarios (local storage)
- Added baseline/hardened snapshots and comparison charts
- Added recommendation generation engine
- Added report exporter for `tk`, `en`, and `both` modes

### Monorepo architecture scaffold
- `apps/api` (Fastify + WS + Prisma/BullMQ ready)
- `apps/web` (workspace package metadata)
- `workers/sim-runner` (BullMQ worker skeleton)
- `packages/sim-core` (shared simulation engine)
- `packages/contracts` (shared domain contracts)
- `packages/i18n` (locale dictionaries + completeness checker)

## Repository layout

- `apps/api` - API service scaffold with required endpoints
- `apps/web` - web workspace package metadata
- `workers/sim-runner` - async simulation worker scaffold
- `packages/sim-core` - shared simulation logic package
- `packages/contracts` - shared TypeScript contracts
- `packages/i18n` - locale dictionaries and CI i18n checks
- `src` - active Vite frontend implementation for Bastion Twin

## API endpoints scaffolded

The API service (`apps/api/src/server.ts`) includes implementations for:

1. `POST /api/v1/scenarios`
2. `GET /api/v1/scenarios/:id`
3. `POST /api/v1/runs`
4. `POST /api/v1/runs/:id/stop`
5. `GET /api/v1/runs/:id`
6. `GET /api/v1/runs/:id/events` (WebSocket upgrade path)
7. `POST /api/v1/runs/:id/recommendations`
8. `POST /api/v1/reports/:runId/export?lang=tk|en|both`

## Localization

Locale files:

- `packages/i18n/locales/tk-TM/*.json`
- `packages/i18n/locales/en-US/*.json`

Namespaces included:

- `common`
- `dashboard`
- `scenario`
- `defense`
- `report`
- `errors`

Run locale completeness check:

```bash
npm run check:i18n
```

## Run (frontend)

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

## Validate frontend

```bash
npm run lint
npm run build
npm run check:i18n
```

## Full-stack scaffold (compose)

A full-stack compose definition is included:

- `docker-compose.fullstack.yml`

It wires:
- web
- api
- postgres
- redis

Run:

```bash
docker compose -f docker-compose.fullstack.yml up -d --build
```

## Notes

- The active, tested runtime in this repo is the frontend app (`src/*`).
- Backend and worker layers are implemented as architecture-aligned scaffolds and require dependency installation for execution.
- The existing legacy/electron paths were preserved.
