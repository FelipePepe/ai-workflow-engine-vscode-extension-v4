import * as vscode from "vscode";
import { registerCommands } from "./commands/register-commands.js";
import { DashboardPanel } from "./panels/dashboard-panel.js";
import { JsonPanel } from "./panels/json-panel.js";
import { ConfigService } from "./services/config-service.js";
import { Logger } from "./services/logger.js";
import { PlanRepository } from "./services/plan-repository.js";
import { StateService } from "./services/state-service.js";
import { ActionsProvider } from "./tree/actions-provider.js";
import { RunsProvider } from "./tree/runs-provider.js";

const VERSION = "0.7.0";

export function activate(context: vscode.ExtensionContext): void {
  const config = new ConfigService();
  const state = new StateService(context.workspaceState);
  const planRepo = new PlanRepository(context.globalStorageUri.fsPath);
  const logger = new Logger(context.globalStorageUri.fsPath);
  logger.info("Extension activated", { version: VERSION, storagePath: context.globalStorageUri.fsPath });
  const dashboard = new DashboardPanel();
  const jsonPanel = new JsonPanel();
  const runsProvider = new RunsProvider();

  vscode.window.registerTreeDataProvider("aiWorkflow.actions", new ActionsProvider());
  vscode.window.registerTreeDataProvider("aiWorkflow.runs", runsProvider);

  const commands = registerCommands(context, {
    config,
    state,
    planRepo,
    dashboard,
    jsonPanel,
    runsProvider,
    logger
  });

  context.subscriptions.push(...commands);

  vscode.window.setStatusBarMessage(`AI Workflow Engine v${VERSION} ready`, 3000);
  logger.info("Commands registered", { count: commands.length });

  if (config.autoOpenDashboard) {
    void vscode.commands.executeCommand("aiWorkflow.openDashboard");
  }
}

export function deactivate(): void {
  // Nothing to dispose manually. VSCode disposes registered subscriptions.
}
