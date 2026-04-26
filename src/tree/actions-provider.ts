import * as vscode from "vscode";

export class ActionItem extends vscode.TreeItem {
  constructor(
    label: string,
    commandId: string,
    icon: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: commandId,
      title: label
    };
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}

export class ActionsProvider implements vscode.TreeDataProvider<ActionItem> {
  private readonly items = [
    new ActionItem("Open Dashboard", "aiWorkflow.openDashboard", "dashboard"),
    new ActionItem("Create Plan", "aiWorkflow.createPlan", "list-tree"),
    new ActionItem("Run Task", "aiWorkflow.runTask", "run"),
    new ActionItem("Run E2E Demo", "aiWorkflow.runE2eDemo", "rocket"),
    new ActionItem("Analyze Discovery", "aiWorkflow.analyzeDiscovery", "search"),
    new ActionItem("Show Memory", "aiWorkflow.showMemory", "database"),
    new ActionItem("Show Metrics", "aiWorkflow.showMetrics", "graph"),
    new ActionItem("Show Config", "aiWorkflow.showConfig", "settings-gear")
  ];

  getTreeItem(element: ActionItem): vscode.TreeItem {
    return element;
  }

  getChildren(): ActionItem[] {
    return this.items;
  }
}
