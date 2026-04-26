import * as vscode from "vscode";
import { registerCommands } from "./commands/register-commands.js";
import { DashboardPanel } from "./panels/dashboard-panel.js";
import { JsonPanel } from "./panels/json-panel.js";
import { ConfigService } from "./services/config-service.js";
import { PlanRepository } from "./services/plan-repository.js";
import { StateService } from "./services/state-service.js";
import { ActionsProvider } from "./tree/actions-provider.js";
import { RunsProvider } from "./tree/runs-provider.js";

export function activate(context: vscode.ExtensionContext): void {
  const config = new ConfigService();
  const state = new StateService(context.workspaceState);
  const planRepo = new PlanRepository(context.globalStorageUri.fsPath);
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
    runsProvider
  });

  context.subscriptions.push(...commands);

  vscode.window.setStatusBarMessage("AI Workflow Engine ready", 3000);

  if (config.autoOpenDashboard) {
    void vscode.commands.executeCommand("aiWorkflow.openDashboard");
  }
}

export function deactivate(): void {
  // Nothing to dispose manually. VSCode disposes registered subscriptions.
}
