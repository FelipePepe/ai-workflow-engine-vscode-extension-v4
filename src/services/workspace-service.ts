import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";
import type { RunExperience } from "../types/engine-types.js";

export class WorkspaceService {
  async openAiWorkspaces(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];

    if (!folder) {
      vscode.window.showWarningMessage("Abre primero una carpeta de proyecto.");
      return;
    }

    const aiWorkspacePath = path.join(folder.uri.fsPath, ".ai-workspaces");
    const uri = vscode.Uri.file(aiWorkspacePath);
    await vscode.commands.executeCommand("revealFileInOS", uri);
  }

  addRunFolders(run: RunExperience): void {
    const workspaces = run.workspaces ?? {};
    const paths = Object.values(workspaces).filter((p) => typeof p === "string" && p.length > 0);

    if (paths.length === 0) return;

    const existingPaths = new Set(
      (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath)
    );

    const toAdd = paths
      .filter((p) => fs.existsSync(p) && !existingPaths.has(p))
      .map((p) => ({ uri: vscode.Uri.file(p) }));

    if (toAdd.length === 0) return;

    const startIndex = vscode.workspace.workspaceFolders?.length ?? 0;
    vscode.workspace.updateWorkspaceFolders(startIndex, 0, ...toAdd);
    vscode.window.showInformationMessage(
      `${toAdd.length} workspace(s) del run añadidos al editor.`
    );
  }

  openFolder(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
      vscode.window.showWarningMessage(`La carpeta no existe: ${folderPath}`);
      return;
    }
    const existing = (vscode.workspace.workspaceFolders ?? []).find(
      (f) => f.uri.fsPath === folderPath
    );
    if (existing) {
      vscode.commands.executeCommand("workbench.files.action.focusFilesExplorer");
      return;
    }
    const startIndex = vscode.workspace.workspaceFolders?.length ?? 0;
    vscode.workspace.updateWorkspaceFolders(startIndex, 0, { uri: vscode.Uri.file(folderPath) });
  }
}
