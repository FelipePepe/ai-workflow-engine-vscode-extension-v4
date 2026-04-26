import * as vscode from "vscode";
import type { RunExperience } from "../types/engine-types.js";

export class RunItem extends vscode.TreeItem {
  constructor(public readonly run: RunExperience) {
    super(`${run.runId} - ${run.task?.title ?? "Task"}`, vscode.TreeItemCollapsibleState.None);
    this.description = run.evaluation ? `score ${run.evaluation.score}` : "plan";
    this.tooltip = JSON.stringify(run, null, 2);
    this.iconPath = new vscode.ThemeIcon(run.evaluation?.success ? "pass" : "history");
  }
}

export class RunsProvider implements vscode.TreeDataProvider<RunItem> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;
  private runs: RunExperience[] = [];

  setRuns(runs: RunExperience[]): void {
    this.runs = runs;
    this.emitter.fire();
  }

  getTreeItem(element: RunItem): vscode.TreeItem {
    return element;
  }

  getChildren(): RunItem[] {
    return this.runs.map((run) => new RunItem(run)).reverse();
  }
}
