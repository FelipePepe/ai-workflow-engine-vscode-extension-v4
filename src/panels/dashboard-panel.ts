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
    logs?: Record<string, unknown>[];
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

      if (message.command === "runE2eDemo") {
        vscode.commands.executeCommand("aiWorkflow.runE2eDemo");
      }

      if (message.command === "approvePlan") {
        vscode.commands.executeCommand("aiWorkflow.approvePlan");
      }

      if (message.command === "rejectPlan") {
        vscode.commands.executeCommand("aiWorkflow.rejectPlan");
      }
    });
  }

  private render(payload: {
    currentPlan?: RunExperience;
    lastRun?: RunExperience;
    metrics?: Record<string, unknown>;
    memory?: RunExperience[];
    logs?: Record<string, unknown>[];
  }): string {
    const currentPlan = payload.currentPlan;
    const lastRun = payload.lastRun;

    return `
<h1>AI Workflow Engine</h1>
<p class="muted">Control Tower para Plan Mode, agentes, seguridad, calidad y memoria.</p>

<div class="card">
  <button data-command="createPlan">Crear plan</button>
  <button data-command="runTask">Ejecutar tarea</button>
  <button data-command="runE2eDemo">Demo E2E</button>
  <button data-command="approvePlan">Aprobar plan</button>
  <button class="secondary" data-command="rejectPlan">Rechazar plan</button>
</div>

<div class="grid">
  <div class="card">
    <h2>Plan actual</h2>
    ${currentPlan ? this.renderPlan(currentPlan) : "<p>No hay plan activo.</p>"}
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
    ${payload.logs?.length ? jsonBlock(payload.logs.slice(-20)) : "<p>Sin eventos.</p>"}
  </div>
</div>

<div class="card">
  <h2>Memoria reciente</h2>
  ${payload.memory?.length ? this.renderMemory(payload.memory) : "<p>Sin memoria cargada.</p>"}
</div>
`;
  }

  private renderPlan(run: RunExperience): string {
    const plan = run.plan;

    return `
<p><b>Run:</b> ${escapeHtml(run.runId)}</p>
<p><b>Branch:</b> ${escapeHtml(run.branch)}</p>
<p><b>Resumen:</b> ${escapeHtml(plan?.summary ?? "")}</p>
<h3>Pasos</h3>
<table>
<tr><th>ID</th><th>Agente</th><th>Tarea</th><th>Paralelo</th></tr>
${plan?.steps?.map((step) => `
<tr>
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

  private renderMemory(memory: RunExperience[]): string {
    return `
<table>
<tr><th>Run</th><th>Tarea</th><th>Score</th><th>Fecha</th></tr>
${memory.slice(-10).reverse().map((run) => `
<tr>
<td>${escapeHtml(run.runId)}</td>
<td>${escapeHtml(run.task?.title ?? "")}</td>
<td>${escapeHtml(run.evaluation?.score ?? "plan")}</td>
<td>${escapeHtml(run.finishedAt ?? "")}</td>
</tr>
`).join("")}
</table>`;
  }
}
