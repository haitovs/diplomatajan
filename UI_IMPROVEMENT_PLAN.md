# UI Improvement Plan Tracking

This document tracks implementation progress for the frontend redesign.

## Project Goal
Upgrade the dashboard from raw prototype quality to a production-grade SOC interface with accurate, readable, and consistent visual behavior.

## Status Legend
- `[ ]` Not started
- `[-]` In progress
- `[x]` Complete

## Phase Plan

### Phase 0 - Baseline and Standards
- [x] Define redesign direction and implementation roadmap.
- [x] Identify critical visual debt and accuracy gaps in current UI.
- [ ] Capture before/after screenshots for each major panel.

### Phase 1 - Style Foundation (Design Tokens + Utility Reliability)
- [x] Ensure all class names used by components are backed by real CSS rules.
- [-] Normalize spacing, radius, and panel elevation scale.
- [-] Improve typography hierarchy for headings, metrics, and logs.
- [-] Reduce theme-specific hacks by introducing semantic color tokens.

### Phase 2 - Layout and Hierarchy
- [x] Refine dashboard shell structure and section rhythm.
- [x] Improve responsive behavior for tablet/mobile layouts.
- [x] Tighten KPI readability and header status grouping.

### Phase 3 - Attack Origin Map Redesign (High Priority)
- [x] Replace toy-style continent drawing with coordinate-based projection.
- [x] Use origin `lat/lon` to render attack-to-target flows.
- [x] Add ranked origin list and clearer severity encoding.
- [x] Add interaction polish (hover detail, stronger legend, cleaner empty state).

### Phase 4 - Component Quality Pass
- [x] Standardize card and panel internals (`StatCard`, `ServerHealth`, `AlertPanel`).
- [x] Improve `ControlPanelV2` structure and action hierarchy.
- [x] Refine `LogTable` readability and sticky header behavior.

### Phase 5 - Accuracy and Data Integrity
- [x] Increase payload window so map/analytics are less truncated.
- [x] Align metric labels and data windows across chart/map/cards.
- [x] Validate attack-type-specific map representation.

### Phase 6 - Accessibility and Performance
- [x] Add reduced-motion behavior for high-motion components.
- [x] Improve focus states and keyboard navigation clarity.
- [x] Verify contrast and readability in all themes.
- [x] Validate smooth rendering under high simulated load.

#### Phase 6 Validation Notes
- 2026-02-17 benchmark (CLI simulation stress): `distributed` attack, intensity `20x`, `2000` ticks, average tick processing `~2.0ms`, peak observed `1010 RPS`, telemetry bounded at `45,000` events.
- 2026-02-17 local preview smoke check (served build): `/` returned `200`, root mount found, and all generated JS/CSS assets returned `200`.
- 2026-02-17 WCAG contrast audit for key theme text/background pairs: dark text `16.00:1`, dark secondary `7.01:1`, light text `16.12:1`, light secondary `7.58:1`, light red state `4.62:1`, light warning `6.78:1`, midnight text `12.26:1`, hacker text `14.22:1`.

## Current Sprint Focus
1. Phase 0 before/after screenshot capture for final documentation.
2. Phase 1 spacing/radius/elevation normalization completion.
3. Phase 1 semantic token cleanup to reduce theme-specific overrides.

## Change Log
- 2026-02-17: Initialized tracking document and started implementation sprint for Phase 1 + Phase 3 + Phase 5.
- 2026-02-17: Implemented first production pass for map redesign, increased streamed log window for map accuracy, rebuilt CSS utility/token foundation, and validated with `npm run build`.
- 2026-02-17: Added unified chart/map window handling, promoted telemetry in header and traffic panel, and implemented map hover drill-down + stronger legend semantics.
- 2026-02-17: Added map-level attack-type and outcome filters, including live attack-type focus action, to ensure scenario-specific origin analysis.
- 2026-02-17: Completed component quality pass by upgrading StatCard, AlertPanel, ServerHealth, ControlPanelV2, and LogTable information hierarchy and interaction clarity.
- 2026-02-17: Improved tablet responsiveness by moving key dashboard rows from single-column to two-column at medium breakpoints.
- 2026-02-17: Reworked attack-map data pipeline to use a rolling 90s telemetry snapshot from `SimulationEngineV2` instead of truncated UI logs, improving map accuracy under load.
- 2026-02-17: Added dirty-cache snapshot generation for attack telemetry so map aggregation recalculates only when underlying events change, reducing update cost under high attack intensity.
- 2026-02-17: Aligned dashboard hierarchy labels and tablet spans (`md:col-span-2`) so chart and control sections no longer leave dead space at medium breakpoints.
- 2026-02-17: Added global keyboard focus-visible styles plus aria-pressed semantics on filter controls, and tuned light-theme gray text contrast for readability.
- 2026-02-17: Completed lint remediation across `ThemeProvider`, `MobileNav`, and `AttackPatterns`; full project `eslint` now passes.
- 2026-02-17: Upgraded `ControlPanelV2` with complete attack-type coverage, selected attack profile details, nominal RPS estimation, and clearer defense-gap telemetry chips.
- 2026-02-17: Recorded high-load simulation benchmark metrics to track Phase 6 performance progress with concrete numbers.
- 2026-02-17: Added lazy-loading boundaries for `TrafficChartV2`, `AttackMap`, and `LogTable` with panel fallbacks to improve initial loading behavior.
- 2026-02-17: Added Vite manual chunking for `recharts`, `framer-motion`, and `lucide-react`; build output is now split into smaller vendor chunks with no >500kB warning.
- 2026-02-17: Completed served-build render-path smoke checks and theme contrast ratio validation; Phase 6 moved to complete.
