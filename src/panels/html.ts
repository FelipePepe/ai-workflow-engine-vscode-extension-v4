import * as vscode from "vscode";

export function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";

  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return nonce;
}

export function shellHtml(title: string, body: string, webview: vscode.Webview): string {
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 18px; }
    h1, h2, h3 { color: var(--vscode-foreground); }
    .card { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 14px; margin: 12px 0; background: var(--vscode-editorWidget-background); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
    code, pre { background: var(--vscode-textCodeBlock-background); padding: 8px; border-radius: 6px; overflow: auto; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; margin-right: 8px; }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .ok { color: #10b981; }
    .warn { color: #f59e0b; }
    .bad { color: #ef4444; }
    .muted { opacity: 0.8; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border-bottom: 1px solid var(--vscode-panel-border); padding: 6px; text-align: left; vertical-align: top; }
  </style>
</head>
<body>
${body}
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    vscode.postMessage({ command: button.getAttribute("data-command") });
  });
});
</script>
</body>
</html>`;
}

export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function jsonBlock(value: unknown): string {
  return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}
