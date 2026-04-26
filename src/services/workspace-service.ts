import * as vscode from "vscode";
import * as path from "node:path";

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
}
