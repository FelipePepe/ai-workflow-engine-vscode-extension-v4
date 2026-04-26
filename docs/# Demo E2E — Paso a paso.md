# Demo E2E — Paso a paso

## Prerequisitos

| Requisito | Detalle |
|-----------|---------|
| Backend arrancado | `cd ai_workflow_engine_ts_v3_json && npx tsx src/server.ts` |
| Extension compilada | `cd ai_workflow_engine_vscode_extension_v4 && npm run compile` |
| Extension activa | Debug tab → **Run Extension** (abre Extension Development Host) |
| Backend URL | `http://127.0.0.1:3000` (valor por defecto) |

---

## Pasos

### 1 · Abrir el Dashboard

**Command Palette** (`Ctrl+Shift+P`) → `AI Workflow: Open Dashboard`

- El panel se abre en el lateral o en un webview
- Muestra: *Plan actual*, *Última ejecución*, *Eventos WebSocket*, *Memoria reciente*
- Si el backend está offline, el dashboard carga igualmente (muestra vacío)

---

### 2 · Lanzar la Demo E2E automática

**Command Palette** → `AI Workflow: Run End-to-End Demo`

También disponible en:
- Sidebar `AI Workflow > Actions > Run E2E Demo`
- Botón `Demo E2E` dentro del dashboard

La demo arranca automáticamente. **No hay inputs manuales.**

---

### 3 · Observar los pasos narrados

La barra de progreso y los toasts en la esquina explican cada fase:

| Paso | Mensaje toast | Qué ocurre internamente |
|------|--------------|------------------------|
| **1/5 Discovery** | 🔍 *El engine analiza el workspace — lenguaje, arquitectura, nivel de calidad y seguridad.* | `DiscoveryAgent` detecta stack y genera `ProjectSpec` |
| **2/5 Create Plan** | 📋 *Genera spec + pasos paralelos por agente.* | `POST /plans/run` → `SpecAgent` + `Planner` generan `ExecutionPlan` |
| **3/5 Run Agents** | ⚙️ *Los agentes developer, qa, security, reviewer y documentation trabajan en paralelo.* | `POST /tasks/run` → `AgentOrchestrator` ejecuta; WebSocket emite `agent_complete` por cada uno |
| **4/5 Evaluator** | ✅ *Verifica quality gate y security gate (OWASP).* | `Evaluator` puntúa + `Improver` genera sugerencias |
| **5/5 Dashboard** | 📊 *Plan actual, última ejecución, eventos WebSocket y memoria persistente.* | Dashboard refresca con plan + lastRun + logs WS + métricas |

---

### 4 · Revisar el Dashboard tras la demo

**Bloque "Plan actual"** — `runId`, `branch`, spec generada, pasos con agente asignado

**Bloque "Última ejecución"** — score (0–1), quality gate, security gate, resultados por agente

**Bloque "Eventos WebSocket"** — `demo-started`, `demo-plan-created`, `agent_complete` ×5, `demo-run-finished`

**Bloque "Memoria reciente"** — el `runId` de la demo aparece al tope

---

### 5 · Explorar manualmente (opcional)

| Comando | Descripción |
|---------|-------------|
| `AI Workflow: Show Current Plan` | Abre el plan como JSON |
| `AI Workflow: Show Memory` | Lista las últimas 50 ejecuciones |
| `AI Workflow: Show Metrics` | Métricas del engine |
| `AI Workflow: Show Config` | Configuración activa (LLM, URL) |
| `AI Workflow: Run Task` | Ejecuta una tarea nueva con inputs manuales |

---

## Modo fallback (sin backend)

Si el backend no está disponible, la demo continúa con datos sintéticos:

- Plan local: `runId demo-plan-*`, branch `demo/e2e-walkthrough`, score 0.95
- Todos los gates en verde
- Dashboard con `mode: "demo-local"`
- Toast: *⚡ El engine no está disponible. Activando modo demo local con datos sintéticos.*

---

## Criterio de éxito

- [ ] Barra de progreso avanza los 5 pasos sin error bloqueante
- [ ] Se muestran los 5 toasts explicativos en orden
- [ ] Dashboard muestra plan + ejecución + eventos
- [ ] Memoria tiene al menos un run nuevo
- [ ] Funciona tanto con backend real como en modo fallback local