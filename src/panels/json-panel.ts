import * as vscode from "vscode";
import { jsonBlock, shellHtml } from "./html.js";

export class JsonPanel {
  open(title: string, data: unknown): void {
    const panel = vscode.window.createWebviewPanel(
      "aiWorkflowJsonPanel",
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: false
      }
    );

    panel.webview.html = shellHtml(title, `<h1>${title}</h1>${jsonBlock(data)}`, panel.webview);
  }
}
