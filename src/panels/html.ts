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
    .exec-running { border-color: #f59e0b !important; background: rgba(245,158,11,0.08) !important; display: flex; align-items: center; gap: 10px; }
    .exec-done    { border-color: #10b981 !important; background: rgba(16,185,129,0.06) !important; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { display: inline-block; animation: spin 1.2s linear infinite; font-style: normal; }
    tr[data-status="running"] td { background: rgba(245,158,11,0.10); }
    tr[data-status="done"]    td { background: rgba(16,185,129,0.07); }
    tr[data-status="error"]   td { background: rgba(239,68,68,0.10); }
    .step-live-status { font-size: 0.9em; min-width: 1.2em; display: inline-block; }
    .ws-log { max-height: 180px; overflow-y: auto; font-size: 0.76em; font-family: monospace; padding: 6px; }
    .ws-entry { padding: 2px 0; border-bottom: 1px solid var(--vscode-panel-border); word-break: break-all; }
    tr.run-row { cursor: pointer; }
    tr.run-row:hover td { background: rgba(100,100,255,0.07); }
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

document.querySelectorAll("tr.run-row[data-run-id]").forEach((row) => {
  row.addEventListener("click", () => {
    vscode.postMessage({ command: "selectRun", runId: row.getAttribute("data-run-id") });
  });
});

window.addEventListener('message', (evt) => {
  const msg = evt.data;
  if (msg.type !== 'ws-event') return;
  const e = msg.event;

  // --- Live log ---
  const log = document.getElementById('ws-log');
  if (log) {
    const entry = document.createElement('div');
    entry.className = 'ws-entry';
    entry.textContent = JSON.stringify(e);
    log.prepend(entry);
    while (log.children.length > 60) log.removeChild(log.lastChild);
  }

  // --- Step status ---
  const stepId = e.stepId ?? e.step_id ?? null;
  const agent  = e.agent  ?? e.agentName ?? null;
  const evType = String(e.type ?? '').toLowerCase();
  if (stepId || agent) {
    document.querySelectorAll('tr[data-step-id]').forEach((row) => {
      const match = (stepId && row.getAttribute('data-step-id') === stepId)
                 || (agent  && row.getAttribute('data-agent')   === agent);
      if (!match) return;
      const statusEl = row.querySelector('.step-live-status');
      if (evType.includes('start') || evType.includes('running')) {
        row.setAttribute('data-status', 'running');
        if (statusEl) statusEl.textContent = '⚙';
      } else if (evType.includes('done') || evType.includes('complet') || evType.includes('finish') || evType.includes('success')) {
        row.setAttribute('data-status', 'done');
        if (statusEl) statusEl.textContent = '✓';
      } else if (evType.includes('error') || evType.includes('fail')) {
        row.setAttribute('data-status', 'error');
        if (statusEl) statusEl.textContent = '✗';
      }
    });
  }

  // --- Banner done ---
  if (evType === 'run_complete' || evType === 'finished' || evType === 'done') {
    const banner = document.getElementById('exec-banner');
    if (banner) {
      banner.className = banner.className.replace('exec-running', 'exec-done');
      const spinner = banner.querySelector('.spinner');
      if (spinner) spinner.textContent = '✓';
    }
  }
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
