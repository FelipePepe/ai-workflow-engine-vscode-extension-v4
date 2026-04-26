import * as vscode from "vscode";
import type { RunExperience } from "../types/engine-types.js";
import { escapeHtml, jsonBlock, shellHtml } from "./html.js";

export class DashboardPanel {
  private panel?: vscode.WebviewPanel;

  open(context: vscode.ExtensionContext, payload: {
    currentPlan?: RunExperience;
    lastRun?: RunExperience;
    metrics?: Record<string, unknown>;
    memory?: RunExperience[];
    pendingPlans?: RunExperience[];
    finishedRuns?: RunExperience[];
    logs?: Record<string, unknown>[];
    version?: string;
    logPath?: string;
    canExecute?: boolean;
    isRunning?: boolean;
  }): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        "aiWorkflowDashboard",
        "AI Workflow Dashboard",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [context.extensionUri]
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    this.panel.webview.html = shellHtml("AI Workflow Dashboard", this.render(payload), this.panel.webview);

    this.panel.webview.onDidReceiveMessage((message) => {
      if (message.command === "createPlan") {
        vscode.commands.executeCommand("aiWorkflow.createPlan");
      }

      if (message.command === "runTask") {
        vscode.commands.executeCommand("aiWorkflow.runTask");
      }

      if (message.command === "approvePlan") {
        vscode.commands.executeCommand("aiWorkflow.approvePlan");
      }

      if (message.command === "rejectPlan") {
        vscode.commands.executeCommand("aiWorkflow.rejectPlan");
      }

      if (message.command === "selectRun" && message.runId) {
        vscode.commands.executeCommand("aiWorkflow.selectRunById", message.runId as string);
      }
    });
  }

  postEvent(event: Record<string, unknown>): void {
    this.panel?.webview.postMessage({ type: "ws-event", event });
  }

  private render(payload: {
    currentPlan?: RunExperience;
    lastRun?: RunExperience;
    metrics?: Record<string, unknown>;
    memory?: RunExperience[];
    pendingPlans?: RunExperience[];
    finishedRuns?: RunExperience[];
    logs?: Record<string, unknown>[];
    version?: string;
    logPath?: string;
    canExecute?: boolean;
    isRunning?: boolean;
  }): string {
    const currentPlan = payload.currentPlan;
    const lastRun = payload.lastRun;
    const builtAt = new Date().toISOString();
    const version = payload.version ?? "?";
    const logPath = payload.logPath ?? "";
    const canExecute = payload.canExecute ?? true;
    const isRunning  = payload.isRunning  ?? false;
    const runBtnDisabled = canExecute ? "" : " disabled title=\"Este workflow no se puede ejecutar (ya completado o en ejecución)\"";
    const runBtnClass = canExecute ? "" : " secondary";

    return `
<h1>AI Workflow Engine</h1>
<p class="muted">Control Tower para Plan Mode, agentes, seguridad, calidad y memoria.</p>
<p class="muted" style="font-size:0.8em">v${escapeHtml(version)} · cargado ${escapeHtml(builtAt)}${logPath ? ` · log: <code>${escapeHtml(logPath)}</code>` : ""}</p>

<div class="card">
  <button data-command="createPlan">Crear plan</button>
  <button data-command="runTask" class="${runBtnClass}"${runBtnDisabled}>Ejecutar tarea</button>
  <button data-command="approvePlan">Aprobar plan</button>
  <button class="secondary" data-command="rejectPlan">Rechazar plan</button>
</div>

${isRunning && currentPlan ? `
<div id="exec-banner" class="card exec-running">
  <em class="spinner">&#9881;</em>
  <div style="flex:1">
    <strong>Ejecutando plan&hellip;</strong>
    <span class="muted" style="margin-left:12px">Run: ${escapeHtml(currentPlan.runId)}</span>
    <p class="muted" style="margin:2px 0 0;font-size:0.82em">Los pasos se actualizan en tiempo real vía WebSocket</p>
  </div>
</div>` : ""}

<div class="grid">
  <div class="card">
    <h2>Plan actual</h2>
    ${currentPlan ? this.renderPlan(currentPlan, isRunning) : "<p>No hay plan activo.</p>"}
  </div>

  <div class="card">
    <h2>Última ejecución</h2>
    ${lastRun ? this.renderRun(lastRun) : "<p>No hay ejecuciones todavía.</p>"}
  </div>
</div>

<div class="grid">
  <div class="card">
    <h2>Métricas</h2>
    ${payload.metrics ? jsonBlock(payload.metrics) : "<p>Sin métricas.</p>"}
  </div>

  <div class="card">
    <h2>Eventos WebSocket</h2>
    <div id="ws-log" class="ws-log">
      ${payload.logs?.length
        ? payload.logs.slice(-15).reverse().map((e) => `<div class="ws-entry">${escapeHtml(JSON.stringify(e))}</div>`).join("")
        : "<p class=\"muted\">Sin eventos aún.</p>"}
    </div>
  </div>
</div>

<div class="grid">
  <div class="card">
    <h2>En ejecución / Pendientes</h2>
    ${payload.pendingPlans?.length ? this.renderPendingPlans(payload.pendingPlans) : "<p class=\"muted\">Sin planes pendientes.</p>"}
  </div>
  <div class="card">
    <h2>Terminados</h2>
    ${payload.finishedRuns?.length ? this.renderFinishedRuns(payload.finishedRuns) : "<p class=\"muted\">Sin ejecuciones terminadas.</p>"}
  </div>
</div>
`;
  }

  private renderPlan(run: RunExperience, isRunning = false): string {
    const plan = run.plan;

    return `
<p><b>Run:</b> ${escapeHtml(run.runId)}</p>
<p><b>Branch:</b> ${escapeHtml(run.branch)}</p>
<p><b>Resumen:</b> ${escapeHtml(plan?.summary ?? "")}</p>
<h3>Pasos</h3>
<table>
<tr><th style="width:1.6em"></th><th>ID</th><th>Agente</th><th>Tarea</th><th>Paralelo</th></tr>
${plan?.steps?.map((step) => `
<tr data-step-id="${escapeHtml(step.id)}" data-agent="${escapeHtml(step.agent)}">
<td><span class="step-live-status">${isRunning ? "○" : ""}</span></td>
<td>${escapeHtml(step.id)}</td>
<td>${escapeHtml(step.agent)}</td>
<td>${escapeHtml(step.task)}</td>
<td>${escapeHtml(step.parallelizable)}</td>
</tr>`).join("") ?? ""}
</table>
<h3>Riesgos</h3>
<ul>${plan?.risks?.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("") ?? ""}</ul>
`;
  }

  private renderRun(run: RunExperience): string {
    const evaluation = run.evaluation;
    const scoreClass = evaluation?.success ? "ok" : "bad";

    return `
<p><b>Run:</b> ${escapeHtml(run.runId)}</p>
<p><b>Dry run:</b> ${escapeHtml(run.dryRun)}</p>
<p><b>Score:</b> <span class="${scoreClass}">${escapeHtml(evaluation?.score ?? "N/A")}</span></p>
<p><b>Security:</b> ${escapeHtml(evaluation?.securityGatePassed ?? "N/A")}</p>
<p><b>Quality:</b> ${escapeHtml(evaluation?.qualityGatePassed ?? "N/A")}</p>
<h3>Mejoras</h3>
<ul>${run.improvements?.map((item) => `<li>${escapeHtml(item)}</li>`).join("") ?? ""}</ul>
`;
  }

  private renderPendingPlans(plans: RunExperience[]): string {
    return `
<table>
<tr><th>Run</th><th>Tarea</th><th>Creado</th></tr>
${plans.map((run) => `
<tr class="run-row" data-run-id="${escapeHtml(run.runId)}">
<td><code>${escapeHtml(run.runId.slice(0, 8))}</code></td>
<td>${escapeHtml(run.task?.title ?? run.plan?.summary?.slice(0, 60) ?? "")}</td>
<td class="muted" style="font-size:0.8em">${escapeHtml((run as unknown as Record<string,unknown>).createdAt as string ?? "")}</td>
</tr>
`).join("")}
</table>`;
  }

  private renderFinishedRuns(runs: RunExperience[]): string {
    return `
<table>
<tr><th>Run</th><th>Tarea</th><th>Score</th><th>Terminado</th></tr>
${runs.map((run) => {
      const scoreClass = run.evaluation?.success ? "ok" : run.evaluation ? "bad" : "";
      return `
<tr class="run-row" data-run-id="${escapeHtml(run.runId)}">
<td><code>${escapeHtml(run.runId.slice(0, 8))}</code></td>
<td>${escapeHtml(run.task?.title ?? run.plan?.summary?.slice(0, 60) ?? "")}</td>
<td class="${scoreClass}">${escapeHtml(run.evaluation?.score ?? "—")}</td>
<td class="muted" style="font-size:0.8em">${escapeHtml(run.finishedAt?.slice(0, 16).replace("T", " ") ?? "")}</td>
</tr>`;
    }).join("")}
</table>`;
  }
}
