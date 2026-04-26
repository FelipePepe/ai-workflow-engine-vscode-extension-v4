# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.0] - 2026-04-26

### Added
- **Live execution progress** in the dashboard while a plan is running:
  - Amber spinning banner "Ejecutando plan…" with the active `runId`
  - Plan step table with per-row live status indicators: `○` pending → `⚙` running (amber row) → `✓` done (green row) / `✗` error (red row)
  - Steps are matched by `stepId`/`step_id` or `agent`/`agentName` from WebSocket events — no full re-render needed
  - `DashboardPanel.postEvent()` pushes events directly to the webview via `postMessage`
  - `connectRunWebSocket` now calls `postEvent()` on every WS event
- **Scrollable live WebSocket event log** (`#ws-log`) that appends new entries in real time instead of a static JSON block

---

## [0.5.0] - 2026-04-26

### Added
- **Sidebar run selection** — clicking a run in the RUNS tree view updates the dashboard to show that run's plan (`aiWorkflow.selectRun` command)
- `RunItem` has `.command` that triggers `aiWorkflow.selectRun` on click
- Completed runs show a `pass` icon; pending runs show `history`

### Fixed
- **`canExecute` button guard** — "Ejecutar tarea" button is disabled when the workflow is already completed (`evaluation` present or `finishedAt` set) or currently running (`runningRunId` matches)
- `runningRunId` state variable tracks in-flight executions to prevent double execution
- `createPlan`: engine `/plan/create` does not echo back `TaskInput` — it is now preserved before saving to state/DB
- `runTask`: when `plan.task` is missing (plans saved before the fix), a minimal `TaskInput` is reconstructed from `plan.summary` silently — no user prompt
- Migrated to **pnpm** — fixes corrupted `node_modules/.bin/tsc` (0-byte binary from npm)
- `tsconfig.json`: added `"include": ["src"]` so `tsc` resolves NodeNext imports correctly

### Added
- **Logger service** (`src/services/logger.ts`) — writes timestamped log lines to `globalStorageUri/extension.log`; path shown in dashboard header

---

## [0.4.1] - 2026-04-25

### Changed
- Removed Demo E2E button from dashboard

### Added
- Version and log path displayed in dashboard header

---

## [0.4.0] - 2026-04-25

### Added
- `PlanRepository` — SQLite-backed persistence for plans and runs (`node:sqlite`)
- `Logger` service with file-based output to `globalStorageUri`

---

## [0.3.x] - 2026-04-25 (extension-hardening phases)

### Added
- Phase 3: input validation and constraint deduplication
- Phase 2: log buffer rotation capped at 500 entries
- Phase 1: fetch timeout via `AbortController` (30 s default)

---

## [0.1.0] - 2026-04-25

### Added
- Initial commit — VSCode extension v4 baseline
- REST client (`EngineClient`), WebSocket client (`EngineWebSocketClient`)
- Dashboard webview, JSON panel, tree providers (Runs, Actions)
- Services: ConfigService, StateService, TaskInputService, WorkspaceService
