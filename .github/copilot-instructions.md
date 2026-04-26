# Copilot Instructions — AI Workflow Engine VSCode Extension V4

VSCode extension that acts as a control tower for the AI Workflow Engine V3/V4 (a separate backend process). The extension never modifies code directly — it orchestrates plan creation, task execution, and agent supervision through the engine's REST and WebSocket APIs.

## Build & Dev Commands

```bash
npm run compile       # TypeScript compile (outputs to dist/)
npm run watch         # Compile in watch mode during development
npm run lint          # ESLint on src/
npm run package       # Bundle as .vsix (requires vsce installed globally)
npm test              # Smoke test — runs dist/test/smoke.test.js (requires compile first)
```

**Running the extension:** open in VSCode → Debug tab → "Run Extension" (launches Extension Development Host).  
**Prerequisite:** the engine backend must be running at `http://127.0.0.1:3000` (see README for setup).

## Architecture

```
extension.ts          ← activate(): wires services, registers tree providers, calls registerCommands()
commands/
  register-commands.ts ← all vscode.commands.registerCommand calls; single entry point for command logic
api/
  engine-client.ts    ← thin REST client (GET/POST, throws on non-ok)
  ws-client.ts        ← WebSocket client per run (connects to /ws/runs/{runId})
services/
  config-service.ts   ← reads vscode.workspace.getConfiguration("aiWorkflow") — no caching
  state-service.ts    ← in-memory only: currentPlan + lastRun (lost on extension reload)
  task-input-service.ts
  workspace-service.ts
panels/
  dashboard-panel.ts  ← main webview; lazy-created on first open(), reused afterwards
  json-panel.ts       ← generic JSON viewer webview
  html.ts             ← shared HTML shell, escaping, and CSS utilities
tree/
  runs-provider.ts    ← TreeDataProvider for the "Runs" sidebar view
  actions-provider.ts ← TreeDataProvider for the "Actions" sidebar view
types/
  engine-types.ts     ← all shared interfaces (TaskInput, RunExperience, ExecutionPlan, etc.)
```

**Data flow:** Commands call `createClient()` (new `EngineClient` per call) → engine returns `RunExperience` → stored in `StateService` → `refreshDashboard()` re-renders the webview.

After `runTask`, a `EngineWebSocketClient` is opened for the run's `runId` and its events are pushed into a local `logs[]` array shown in the dashboard.

## Key Conventions

**TypeScript module resolution is `NodeNext`** — all local imports must use `.js` extensions even when the source file is `.ts`:
```ts
import { EngineClient } from "../api/engine-client.js"; // correct
import { EngineClient } from "../api/engine-client";    // will fail at runtime
```

**`EngineClient` is not a singleton.** `createClient()` is called inside each command handler using the current `config.engineUrl`. Never store a long-lived `EngineClient` instance.

**Webview HTML is built in `html.ts`.** All content rendered in webviews must go through `escapeHtml()`. Buttons use the `data-command` attribute pattern — the shared script in `shellHtml` dispatches `postMessage` automatically:
```html
<button data-command="createPlan">Create Plan</button>
```
New webview interactions follow this pattern rather than inline `onclick` handlers.

**CSP is enforced on webviews.** `shellHtml` sets a strict Content-Security-Policy with a per-render nonce. Scripts injected outside of `shellHtml`'s `<script nonce="...">` block will be blocked.

**All commands are registered in `register-commands.ts`**, not scattered across the codebase. New commands belong there and their `Disposable` must be returned in the array pushed to `context.subscriptions`.

**State is in-memory only.** `StateService` holds `currentPlan` and `lastRun` for the session. There is no persistence to disk or `ExtensionContext.globalState`.

**Error handling pattern:** every async command wraps the call in `try/catch` and shows errors with `vscode.window.showErrorMessage(String(error))`. The dashboard can open even when the engine is offline (errors in `refreshDashboard` are silently swallowed).
