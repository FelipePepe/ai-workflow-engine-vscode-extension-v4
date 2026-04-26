import * as vscode from "vscode";
import { EngineClient } from "../api/engine-client.js";
import { EngineWebSocketClient } from "../api/ws-client.js";
import { DashboardPanel } from "../panels/dashboard-panel.js";
import { JsonPanel } from "../panels/json-panel.js";
import { ConfigService } from "../services/config-service.js";
import { PlanRepository } from "../services/plan-repository.js";
import { StateService } from "../services/state-service.js";
import { TaskInputService } from "../services/task-input-service.js";
import { WorkspaceService } from "../services/workspace-service.js";
import type { ProjectSpec, RunExperience, TaskInput } from "../types/engine-types.js";
import { RunsProvider } from "../tree/runs-provider.js";

function createDemoTask(): TaskInput {
  return {
    title: "Demo E2E: Implementar feature con seguridad y calidad",
    description: "Flujo completo para demostrar createPlan, runTask, evaluation gates y memoria en el dashboard.",
    constraints: [
      "Incluir pruebas automáticas",
      "Validar seguridad OWASP",
      "Mantener cobertura minima de 80%"
    ],
    priority: "high"
  };
}

function createDemoProjectSpec(): ProjectSpec {
  return {
    projectType: "vscode-extension",
    language: "typescript",
    framework: "vscode-api",
    architecture: "control-tower",
    database: "sqlite",
    qualityLevel: "strict",
    securityLevel: "high",
    deploymentTarget: "vsix",
    testingStrategy: "smoke+integration",
    observability: true
  };
}

function createDemoPlanRun(task: TaskInput): RunExperience {
  const runId = `demo-plan-${Date.now()}`;
  const projectSpec = createDemoProjectSpec();

  return {
    runId,
    branch: "demo/e2e-walkthrough",
    task,
    discovery: {
      confidence: 0.92,
      projectSpec,
      missingQuestions: [],
      canProceed: true,
      assumptions: [
        "El backend real puede no estar disponible durante la demo",
        "Se prioriza trazabilidad del flujo sobre ejecucion real"
      ]
    },
    projectSpec,
    spec: {
      objective: "Demostrar UX completa de la extension de principio a fin"
    },
    plan: {
      planMode: true,
      summary: "Plan de demo E2E: discovery, plan, ejecucion, evaluacion y memoria",
      steps: [
        { id: "S1", agent: "DiscoveryAgent", task: "Validar contexto y restricciones", parallelizable: false },
        { id: "S2", agent: "PlannerAgent", task: "Construir plan en modo seguro", parallelizable: false },
        { id: "S3", agent: "ExecutorAgent", task: "Aplicar cambios y ejecutar checks", parallelizable: true },
        { id: "S4", agent: "EvaluatorAgent", task: "Calcular score y gates", parallelizable: false }
      ],
      risks: [
        "Engine backend no disponible",
        "Datos de memory/metrics incompletos durante la demo"
      ],
      filesToInspect: [
        "src/commands/register-commands.ts",
        "src/panels/dashboard-panel.ts",
        "src/tree/actions-provider.ts"
      ],
      commandsToRun: ["npm run compile", "npm test"],
      approvalRequired: true,
      metadata: {
        demo: true,
        source: "local-fallback"
      }
    },
    dryRun: true,
    finishedAt: new Date().toISOString()
  };
}

function createDemoCompletedRun(task: TaskInput): RunExperience {
  const projectSpec = createDemoProjectSpec();
  const runId = `demo-run-${Date.now()}`;

  return {
    runId,
    branch: "demo/e2e-walkthrough",
    task,
    discovery: {
      confidence: 0.95,
      projectSpec,
      missingQuestions: [],
      canProceed: true,
      assumptions: ["Se simulan eventos del engine para una demo offline"]
    },
    projectSpec,
    spec: {
      objective: "Mostrar que el plugin soporta un flujo E2E completo"
    },
    plan: {
      planMode: true,
      summary: "Ejecucion demo completada con gates en verde",
      steps: [
        { id: "S1", agent: "DiscoveryAgent", task: "Recolectar contexto", parallelizable: false },
        { id: "S2", agent: "PlannerAgent", task: "Crear plan aprobado", parallelizable: false },
        { id: "S3", agent: "ExecutorAgent", task: "Ejecutar implementacion", parallelizable: true },
        { id: "S4", agent: "QualityAgent", task: "Ejecutar pruebas y quality gate", parallelizable: true },
        { id: "S5", agent: "SecurityAgent", task: "Ejecutar policy checks", parallelizable: true }
      ],
      risks: ["Sincronizar decisiones finales con el equipo antes de merge"],
      filesToInspect: ["src/commands/register-commands.ts", "README.md"],
      commandsToRun: ["npm run compile", "npm test"],
      approvalRequired: true,
      metadata: {
        demo: true,
        source: "local-fallback"
      }
    },
    agentResults: [
      {
        agentName: "PlannerAgent",
        status: "success",
        output: { planCreated: true, totalSteps: 5 },
        logs: ["Plan generated in Plan Mode"]
      },
      {
        agentName: "ExecutorAgent",
        status: "success",
        output: { filesChanged: 4, testsExecuted: true },
        logs: ["Implementation applied in isolated workspace"]
      },
      {
        agentName: "SecurityAgent",
        status: "success",
        output: { policiesChecked: 6, violations: 0 },
        logs: ["Security gate passed"]
      }
    ],
    evaluation: {
      success: true,
      score: 93,
      testsPassed: true,
      acceptanceCriteriaMet: true,
      securityGatePassed: true,
      qualityGatePassed: true,
      issues: [],
      recommendations: ["Preparar release notes antes de empaquetar VSIX"]
    },
    improvements: [
      "Añadir telemetria por agente",
      "Incluir selector de plantillas de tarea para demos"
    ],
    dryRun: false,
    finishedAt: new Date().toISOString()
  };
}

export function registerCommands(
  context: vscode.ExtensionContext,
  services: {
    config: ConfigService;
    state: StateService;
    planRepo: PlanRepository;
    dashboard: DashboardPanel;
    jsonPanel: JsonPanel;
    runsProvider: RunsProvider;
  }
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  const logs: Record<string, unknown>[] = [];

  const createClient = () => new EngineClient(services.config.engineUrl);
  const taskInput = new TaskInputService(services.config);
  const workspaceService = new WorkspaceService();

  function connectRunWebSocket(runId: string): void {
    const ws = new EngineWebSocketClient(
      services.config.websocketUrl,
      runId,
      (event) => {
        logs.push(event);
      },
      (status) => {
        logs.push({ type: "ws-status", status });
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

    services.dashboard.open(context, {
      currentPlan: services.state.currentPlan,
      lastRun: services.state.lastRun,
      metrics,
      memory,
      logs
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

    try {
      const plan = await createClient().createPlan(task);
      services.state.currentPlan = plan;
      services.planRepo.savePlan(plan);
      vscode.window.showInformationMessage(`Plan creado: ${plan.runId}`);
      await refreshDashboard();
    } catch (error) {
      vscode.window.showErrorMessage(String(error));
    }
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.runTask", async () => {
    let task = services.state.currentPlan?.task;

    if (!task) {
      task = await taskInput.askTask();
      if (!task) return;
    }

    try {
      const run = await createClient().runTask(task);
      services.state.lastRun = run;
      services.planRepo.saveRun(run);
      vscode.window.showInformationMessage(`Run completado: ${run.runId}`);

      connectRunWebSocket(run.runId);

      await refreshDashboard();
    } catch (error) {
      vscode.window.showErrorMessage(String(error));
    }
  }));

  disposables.push(vscode.commands.registerCommand("aiWorkflow.runE2eDemo", async () => {
    const demoTask = createDemoTask();
    logs.push({ type: "demo-started", mode: "e2e" });

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "AI Workflow: Ejecutando demo E2E",
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ increment: 25, message: "Creando plan en el engine" });
        const plan = await createClient().createPlan(demoTask);
        services.state.currentPlan = plan;
        services.planRepo.savePlan(plan);
        logs.push({ type: "demo-plan-created", runId: plan.runId, source: "engine" });

        progress.report({ increment: 35, message: "Ejecutando tarea en el engine" });
        const run = await createClient().runTask(demoTask);
        services.state.lastRun = run;
        services.planRepo.saveRun(run);
        connectRunWebSocket(run.runId);
        logs.push({ type: "demo-run-finished", runId: run.runId, source: "engine" });

        progress.report({ increment: 40, message: "Actualizando dashboard" });
        await refreshDashboard();
        vscode.window.showInformationMessage(`Demo E2E completada contra engine real: ${run.runId}`);
      } catch (error) {
        progress.report({ increment: 50, message: "Sin engine: activando demo local" });

        const localPlan = createDemoPlanRun(demoTask);
        services.state.currentPlan = localPlan;
        services.planRepo.savePlan(localPlan);
        logs.push({ type: "demo-plan-created", runId: localPlan.runId, source: "local" });

        const localRun = createDemoCompletedRun(demoTask);
        services.state.lastRun = localRun;
        services.planRepo.saveRun(localRun);
        logs.push({ type: "demo-run-finished", runId: localRun.runId, source: "local" });
        logs.push({ type: "demo-fallback-reason", reason: String(error) });

        progress.report({ increment: 50, message: "Renderizando dashboard con datos demo" });
        await refreshDashboard({
          metrics: {
            mode: "demo-local",
            activeRuns: 1,
            qualityGatePassRate: 1,
            securityGatePassRate: 1,
            generatedAt: new Date().toISOString()
          }
        });

        vscode.window.showWarningMessage("Demo E2E completada en modo local (engine no disponible).");
      }
    });
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
