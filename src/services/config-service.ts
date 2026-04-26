import * as vscode from "vscode";

export class ConfigService {
  get engineUrl(): string {
    return vscode.workspace.getConfiguration("aiWorkflow").get<string>("engineUrl", "http://127.0.0.1:3000");
  }

  get websocketUrl(): string {
    return vscode.workspace.getConfiguration("aiWorkflow").get<string>("websocketUrl", "ws://127.0.0.1:3000");
  }

  get defaultPriority(): string {
    return vscode.workspace.getConfiguration("aiWorkflow").get<string>("defaultPriority", "medium");
  }

  get autoOpenDashboard(): boolean {
    return vscode.workspace.getConfiguration("aiWorkflow").get<boolean>("autoOpenDashboard", true);
  }
}
