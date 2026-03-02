# Bastion Twin MVP Blueprint

## 1) Objective
Build a production-ready MVP of Bastion Twin as a **cyber defense planning and training platform** for SME teams.

The MVP must be:
- Useful in real workflows (not a visual-only demo)
- Safe and legally defensible
- Hostable on your own VPS infrastructure
- Turkmen-first (`tk-TM`) with full `en-US` parity

---

## 2) Product Positioning (Important)
Position the product as:
- **"SME cyber defense simulation, planning, and reporting platform"**

Do not position as:
- Attack tool
- Arbitrary IP brute-force utility

Reason:
- Legal and ethical risk reduction
- Better buyer fit (IT lead, SOC-lite team, training orgs)
- Easier long-term scaling with enterprise controls

---

## 3) MVP Scope

### In Scope
1. Scenario authoring (attack type, intensity, target surface, business profile)
2. Two execution modes:
   - `Simulation Mode` (pure simulation engine)
   - `Lab Mode` (controlled traffic to your own registered targets only)
3. Real-time dashboard telemetry
4. Defense tuning + presets
5. Baseline vs hardened comparison snapshots
6. Recommendation generation
7. Bilingual report export (`tk`, `en`, `both`)
8. Team/project persistence (scenarios, runs, reports)
9. Clear onboarding and teacher-style “How it works”

### Out of Scope (MVP)
1. Real offensive operations against arbitrary public targets
2. Advanced multi-tenant billing
3. External threat intel ingestion
4. Complex SIEM integrations

---

## 4) Safety & Compliance Guardrails (Mandatory)

For `Lab Mode`, enforce:
1. **Target allowlist only**
   - Only registered, verified target hosts/IPs you control
2. **Run limits**
   - max duration
   - max attempts
   - max RPS
3. **Kill switch**
   - Manual stop button (UI + API)
   - Auto-stop watchdog on threshold breach
4. **Credential safety**
   - Test-only credentials
   - Never store plaintext real credentials
5. **Network isolation**
   - Use private network/VPN or isolated segment between runner and target
6. **Auditability**
   - Signed run metadata
   - Immutable audit log for every run/start/stop/config change

---

## 5) Architecture (MVP)

## 5.1 Component Map
1. `bastion-web` (React/Vite UI)
2. `bastion-api` (Fastify control plane)
3. `sim-runner` (BullMQ worker for execution jobs)
4. `lab-target-agent` (optional executor sidecar for controlled tests)
5. `postgres` (state, scenarios, runs, reports, audit logs)
6. `redis` (queue + transient run state)
7. `nginx` (reverse proxy + TLS)

## 5.2 Execution Modes
1. `Simulation Mode`
   - Uses internal simulation engine (safe, deterministic demos)
2. `Lab Mode`
   - Sends controlled auth test traffic to allowlisted targets
   - Strict policy controls enforced by API + runner

## 5.3 Recommended VPS Topology
1. VPS-1 (Control Plane):
   - web, api, redis, postgres, nginx
2. VPS-2 (Lab Target):
   - intentionally instrumented test auth service
   - optional target agent

---

## 6) Core User Flows

1. User creates scenario.
2. User chooses mode (`Simulation` or `Lab`).
3. User starts run.
4. Dashboard streams telemetry and guidance.
5. User tunes defenses.
6. User captures:
   - baseline snapshot
   - hardened snapshot
7. Comparison view calculates deltas.
8. Recommendations generated.
9. Report exported (`tk`, `en`, `both`).

---

## 7) Data Model (MVP)

Minimum entities:
1. `organizations`
2. `workspaces`
3. `users`
4. `scenarios`
5. `runs`
6. `run_events`
7. `snapshots`
8. `recommendations`
9. `reports`
10. `allowed_targets`
11. `audit_logs`

Key notes:
- `runs.mode`: `simulation | lab`
- `runs.status`: `draft | queued | running | stopped | completed | failed`
- `allowed_targets` must include verification metadata
- `audit_logs` append-only

---

## 8) API Surface (MVP)

### Existing core routes
1. `POST /api/v1/scenarios`
2. `GET /api/v1/scenarios/:id`
3. `POST /api/v1/runs`
4. `POST /api/v1/runs/:id/stop`
5. `GET /api/v1/runs/:id`
6. `GET /api/v1/runs/:id/events` (WS)
7. `POST /api/v1/runs/:id/recommendations`
8. `POST /api/v1/reports/:runId/export?lang=tk|en|both`

### Add for MVP completeness
1. `GET /api/v1/scenarios`
2. `GET /api/v1/runs`
3. `POST /api/v1/runs/:id/snapshots`
4. `GET /api/v1/reports/:runId`
5. `POST /api/v1/targets`
6. `GET /api/v1/targets`
7. `POST /api/v1/targets/:id/verify`

---

## 9) UX/Design Requirements for MVP

1. Always-visible Start/Stop controls.
2. Teacher-style explanatory content:
   - attack types
   - business profiles
   - command center controls
3. Workflow guidance card visible on workspace:
   - Step 1 to Step 5
4. Comparison/report screens must provide recovery actions when empty:
   - capture baseline
   - capture hardened
   - jump to workspace
5. Light mode must be first-class (not theme fallback artifacts).
6. UI responsiveness target:
   - control interactions < 150ms perceived response
   - avoid render storms from high-frequency telemetry

---

## 10) Non-Functional Targets

1. Telemetry stream latency: p95 < 300ms
2. No UI freeze under 1k simulated RPS
3. WCAG AA for key text/background pairs
4. Keyboard-accessible critical controls
5. Structured logs and health endpoints for web/api/worker

---

## 11) MVP Delivery Plan (6 Weeks)

## Week 1: Stabilization + UX Fundamentals
Deliver:
1. Fix light mode token system completely
2. Add explicit Start/Stop controls in all relevant screens
3. Throttle UI updates + optimistic control state updates
4. Add teacher-style explanatory panels
5. Add snapshot/report recovery actions

Exit criteria:
1. `lint`, `build`, `i18n check` pass
2. Presenter can run end-to-end flow without confusion

## Week 2: Backend Persistence & Run State Machine
Deliver:
1. DB migration for scenarios/runs/snapshots/reports/audit logs
2. Full CRUD list endpoints
3. Run state machine with deterministic transitions

Exit criteria:
1. Runs persist across restart
2. Snapshot and report data no longer volatile in-memory

## Week 3: Worker Orchestration + Simulation Reliability
Deliver:
1. Queue-backed run execution
2. Robust stop/cancel handling
3. Backpressure-aware WS event streaming

Exit criteria:
1. Stop always works
2. No orphan jobs

## Week 4: Controlled Lab Mode (Safe Realism)
Deliver:
1. Allowlisted target registration + verification
2. Runner policy constraints (attempt/rps/time limits)
3. Kill switch + watchdog
4. Audit log coverage for all lab runs

Exit criteria:
1. Lab mode cannot run against non-allowlisted targets
2. Hard limits always enforced

## Week 5: Recommendation Engine + Reporting Quality
Deliver:
1. Deterministic recommendation scoring model
2. Rich report sections with baseline/hardened deltas
3. Bilingual template parity and formatting cleanup

Exit criteria:
1. Recommendations explain "why"
2. Reports are actionable for engineering team

## Week 6: Deployment Hardening + Observability
Deliver:
1. Production docker-compose stack on VPS
2. TLS + reverse proxy + health checks
3. Monitoring/logging (minimum dashboards + alerts)
4. Backup + restore runbook

Exit criteria:
1. 24h soak test without critical failures
2. Recovery procedures tested

---

## 12) Definition of Done (MVP)

MVP is done when:
1. User can complete full flow in one session:
   - create scenario -> run -> tune -> snapshot x2 -> compare -> recommend -> report
2. Light and dark themes both fully usable
3. No command center control confusion in user test
4. Lab mode is safely constrained and audited
5. Production deployment on your server is stable and monitored

---

## 13) Production Deployment Checklist (Server)

1. Deploy PostgreSQL with backups enabled.
2. Deploy Redis with persistence policy configured.
3. Deploy API + worker + web behind nginx + TLS.
4. Restrict lab-target network routes (private only).
5. Add environment secrets (JWT, DB, Redis) via secure vault/env.
6. Enable log rotation and central collection.
7. Configure alerts:
   - worker failures
   - stop endpoint errors
   - API 5xx spikes

---

## 14) Risks and Mitigation

1. **Misuse risk** (lab mode treated as offensive tool)
   - Mitigation: strict allowlist + legal wording + audit logs
2. **UI complexity risk**
   - Mitigation: guided workflow and contextual explanations
3. **Performance risk under live telemetry**
   - Mitigation: throttling, memoization, bounded event windows
4. **Presenter confusion**
   - Mitigation: explicit Start/Stop and scriptable demo flow

---

## 15) Immediate Next Actions (This Repo)

1. Finish wiring the newly added explanatory copy into all components.
2. Complete run-state persistence in API (DB-backed).
3. Integrate snapshots/reports with backend storage.
4. Add safe `Lab Mode` target allowlist endpoints.
5. Add VPS deployment docs and one-command compose profile.

