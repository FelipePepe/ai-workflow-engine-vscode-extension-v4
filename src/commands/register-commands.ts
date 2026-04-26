import * as vscode from "vscode";
import { EngineClient } from "../api/engine-client.js";
import { EngineWebSocketClient } from "../api/ws-client.js";
import { DashboardPanel } from "../panels/dashboard-panel.js";
import { JsonPanel } from "../panels/json-panel.js";
import { ConfigService } from "../services/config-service.js";
import { Logger } from "../services/logger.js";
import { PlanRepository } from "../services/plan-repository.js";
import { StateService } from "../services/state-service.js";
import { TaskInputService } from "../services/task-input-service.js";
import { WorkspaceService } from "../services/workspace-service.js";
import type { RunExperience } from "../types/engine-types.js";
import { RunsProvider } from "../tree/runs-provider.js";

const LOG_BUFFER_MAX = 500;

export function registerCommands(
  context: vscode.ExtensionContext,
  services: {
    config: ConfigService;
    state: StateService;
    planRepo: PlanRepository;
    dashboard: DashboardPanel;
    jsonPanel: JsonPanel;
    runsProvider: RunsProvider;
    logger: Logger;
  }
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  const logs: Record<string, unknown>[] = [];
  let runningRunId: string | undefined;

  const createClient = () => new EngineClient(services.config.engineUrl);
  const taskInput = new TaskInputService(services.config);
  const workspaceService = new WorkspaceService();

  function connectRunWebSocket(runId: string): void {
    const ws = new EngineWebSocketClient(
      services.config.websocketUrl,
      runId,
      (event) => {
        if (logs.length >= LOG_BUFFER_MAX) logs.shift();
        logs.push(event);
        services.dashboard.postEvent(event);
      },
      (status) => {
        if (logs.length >= LOG_BUFFER_MAX) logs.shift();
        const statusEvent = { type: "ws-status", status };
        logs.push(statusEvent);
        services.dashboard.postEvent(statusEvent);
      }
    );
    ws.connect();
    context.subscriptions.push({ dispose: () => ws.dispose() });
  }

  async function refreshDashboard(extra?: Partial<{ metrics: Record<string, unknown>; memory: RunExperience[] }>): Promise<void> {
    const client = createClient();
    let metrics = extra?.metrics;
    let memory = extra?.memory ?? services.planRepo.getHistory(20);

    try {
      metrics ??= await client.getMetrics();
      const engineMemory = await client.getMemory(20);
      if (engineMemory.length > 0) memory = engineMemory;
      services.runsProvider.setRuns(memory);
    } catch {
      services.runsProvider.setRuns(memory);
    }

    const isRunning = !!runningRunId && runningRunId === services.state.currentPlan?.runId;
    const isCompleted = !!services.state.currentPlan?.evaluation || !!services.state.currentPlan?.finishedAt;

    services.dashboard.open(context, {
      currentPlan: services.state.currentPlan,
      lastRun: services.state.lastRun,
      metrics,
      memory,
      logs,
      version: "0.5.0",
      logPath: services.logger.path,
      canExecute: !isRunning && !isCompleted,
      isRunning
    });
  }

  disposables.push(vscode.commands.registerCommand("aiWorkflow.openDashboard", async () => {
    await refreshDashboard();
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.analyzeDiscovery", async () => {
    const task = await taskInput.askTask();
    if (!task) return;

    try {
      const result = await createClient().analyzeDiscovery(task);
      services.jsonPanel.open("Discovery Result", result);
    } catch (error) {
      vscode.window.showErrorMessage(String(error));
    }
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.createPlan", async () => {
    const task = await taskInput.askTask();
    if (!task) return;

    services.logger.info("createPlan: start", { title: task.title });
    try {
      const plan = await createClient().createPlan(task);
      // Engine may not echo back the original TaskInput — preserve it so runTask can use it
      if (!plan.task) {
        plan.task = task;
      }
      services.state.currentPlan = plan;
      services.planRepo.savePlan(plan);
      services.logger.info("createPlan: success", { runId: plan.runId });
      vscode.window.showInformationMessage(`Plan creado: ${plan.runId}`);
      await refreshDashboard();
    } catch (error) {
      services.logger.error("createPlan: failed", { error: String(error) });
      vscode.window.showErrorMessage(String(error));
    }
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.selectRun", async (run: RunExperience) => {
    services.logger.info("selectRun: invoked", { runId: run.runId });
    services.state.currentPlan = run;
    await refreshDashboard();
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.runTask", async () => {
    services.logger.info("runTask: invoked", { hasPlan: !!services.state.currentPlan });

    // Recover plan from repo if state was lost (e.g. after extension reload)
    if (!services.state.currentPlan) {
      const last = services.planRepo.getPlans(1)[0];
      services.logger.info("runTask: state empty, recovered from DB", { found: !!last, runId: last?.runId });
      if (last) {
        services.state.currentPlan = last;
      }
    }

    const plan = services.state.currentPlan;
    services.logger.info("runTask: resolved task", { task: plan?.task?.title ?? "none", planRunId: plan?.runId });

    if (!plan) {
      services.logger.warn("runTask: no plan in state");
      vscode.window.showWarningMessage("No hay plan activo. Crea uno primero con 'Crear plan'.");
      return;
    }

    if (!plan.task) {
      // Reconstruct a minimal TaskInput from plan data — no need to ask the user
      services.logger.warn("runTask: task missing, reconstructing from plan data", { runId: plan.runId });
      plan.task = {
        title: plan.plan?.summary ?? plan.branch ?? plan.runId,
        description: plan.plan?.summary ?? "",
        constraints: [],
        priority: "medium"
      };
      services.planRepo.savePlan(plan);
    }

    if (plan.evaluation || plan.finishedAt) {
      services.logger.warn("runTask: plan already completed", { runId: plan.runId });
      vscode.window.showWarningMessage("Este workflow ya fue ejecutado. Crea un nuevo plan.");
      return;
    }

    if (runningRunId === plan.runId) {
      services.logger.warn("runTask: plan already running", { runId: plan.runId });
      vscode.window.showWarningMessage("Este workflow ya está en ejecución.");
      return;
    }

    try {
      runningRunId = plan.runId;
      await refreshDashboard();
      services.logger.info("runTask: calling engine", { engineUrl: services.config.engineUrl });
      const run = await createClient().runTask(plan.task);
      services.state.lastRun = run;
      services.planRepo.saveRun(run);
      services.logger.info("runTask: success", { runId: run.runId, score: run.evaluation?.score });
      vscode.window.showInformationMessage(`Run completado: ${run.runId}`);

      connectRunWebSocket(run.runId);
    } catch (error) {
      services.logger.error("runTask: failed", { error: String(error) });
      vscode.window.showErrorMessage(String(error));
    } finally {
      runningRunId = undefined;
      await refreshDashboard();
    }
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.showMemory", async () => {
    try {
      const memory = await createClient().getMemory(50);
      services.runsProvider.setRuns(memory);
      services.jsonPanel.open("AI Workflow Memory", memory);
    } catch (error) {
      vscode.window.showErrorMessage(String(error));
    }
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.showMetrics", async () => {
    try {
      const metrics = await createClient().getMetrics();
      services.jsonPanel.open("AI Workflow Metrics", metrics);
    } catch (error) {
      vscode.window.showErrorMessage(String(error));
    }
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.showConfig", async () => {
    try {
      const config = await createClient().getConfig();
      services.jsonPanel.open("AI Workflow Config", config);
    } catch (error) {
      vscode.window.showErrorMessage(String(error));
    }
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.openWorkspaces", async () => {
    await workspaceService.openAiWorkspaces();
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.approvePlan", async () => {
    if (!services.state.currentPlan) {
      vscode.window.showWarningMessage("No hay plan actual para aprobar.");
      return;
    }

    vscode.window.showInformationMessage(`Plan ${services.state.currentPlan.runId} aprobado manualmente.`);
    services.planRepo.updatePlanStatus(services.state.currentPlan.runId, "approved");
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.rejectPlan", async () => {
    if (!services.state.currentPlan) {
      vscode.window.showWarningMessage("No hay plan actual para rechazar.");
      return;
    }

    const runId = services.state.currentPlan.runId;
    services.planRepo.updatePlanStatus(runId, "rejected");
    services.state.currentPlan = undefined;
    vscode.window.showWarningMessage(`Plan ${runId} rechazado.`);
    await refreshDashboard();
  }));

  return disposables;
}
