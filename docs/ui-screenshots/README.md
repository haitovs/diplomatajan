# UI Screenshot Artifacts

This folder contains baseline (`before`) and redesigned (`after`) captures for major dashboard panels.

## Captured Sets

- `before/dashboard-full.png`
- `before/traffic.png`
- `before/control.png`
- `before/logs.png`
- `after/dashboard-full.png`
- `after/traffic.png`
- `after/map.png`
- `after/control.png`
- `after/logs.png`

## Regenerate

1. Build current UI and legacy baseline:
   - `npm run build`
   - `npx vite build --config vite.config.legacy.js`
2. Start preview servers:
   - `npm run preview -- --host 127.0.0.1 --port 4173`
   - `npx vite preview --config vite.config.legacy.js --host 127.0.0.1 --port 4174`
3. Run capture:
   - `node scripts/capture-ui-screenshots.mjs`

Note: legacy baseline does not include the attack map panel; `after/map.png` represents the new panel introduced in the redesign.
