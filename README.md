# AI Workflow Engine VSCode Extension V4

Extensión completa operativa para controlar el AI Workflow Engine V3/V4 desde VSCode.

## Qué incluye

- Activity Bar propia: **AI Workflow**
- Panel lateral de acciones
- Panel lateral de runs/memoria
- Dashboard webview
- Crear Plan Mode desde VSCode
- Ejecutar tarea desde VSCode
- Discovery Analysis
- Visualización de memoria
- Visualización de métricas
- Visualización de configuración del engine
- Conexión WebSocket por run
- Approval / Reject del plan
- Apertura de `.ai-workspaces`
- Configuración de `engineUrl` y `websocketUrl`

## Requisitos

1. Tener corriendo el engine V3 JSON:

```bash
cd ai_workflow_engine_ts_v3_json
npm install
cp .env.example .env
npm run dev
```

2. Tener corriendo la extensión en VSCode:

```bash
cd ai_workflow_engine_vscode_extension_v4
npm install
npm run compile
```

Después abre VSCode y ejecuta:

```txt
Run Extension (Fast Watch)
```

desde la pestaña de Debug.

## Debug comodo (recomendado)

Para iterar rapido mientras cambias codigo de la extension:

```txt
1. F5 con "Run Extension (Fast Watch)" (inicia TypeScript watch)
2. Edita codigo en src/
3. En la ventana Extension Development Host ejecuta "Developer: Reload Window"
4. Repite sin recompilar completo en cada ciclo
```

Si necesitas una ejecucion limpia de una sola compilacion:

```txt
Run Extension (Single Compile)
```

## Configuración VSCode

En `settings.json`:

```json
{
  "aiWorkflow.engineUrl": "http://127.0.0.1:3000",
  "aiWorkflow.websocketUrl": "ws://127.0.0.1:3000",
  "aiWorkflow.defaultPriority": "medium",
  "aiWorkflow.autoOpenDashboard": true
}
```

## Comandos

```txt
AI Workflow: Open Dashboard
AI Workflow: Create Plan
AI Workflow: Run Task
AI Workflow: Run End-to-End Demo
AI Workflow: Analyze Discovery
AI Workflow: Show Memory
AI Workflow: Show Metrics
AI Workflow: Show Engine Config
AI Workflow: Open AI Workspaces
AI Workflow: Approve Current Plan
AI Workflow: Reject Current Plan
```

## Demo E2E (recomendada para mostrar el plugin)

Puedes demostrar el plugin completo con un solo comando:

```txt
AI Workflow: Run End-to-End Demo
```

Qué hace internamente:

```txt
1. Crea una tarea demo con prioridades y restricciones
2. Intenta crear plan real contra el engine
3. Intenta ejecutar run real contra el engine
4. Abre/actualiza dashboard con plan, run, memory, metrics y logs
5. Si el engine no responde, activa fallback local y completa la demo igual
```

Resultado esperado en Dashboard:

```txt
- Plan actual con pasos, riesgos y branch demo/e2e-walkthrough
- Última ejecución con score y gates de seguridad/calidad
- Eventos recientes (incluye marca de source: engine o source: local)
- Memoria reciente con runs/planes demo persistidos en workflow.db
```

Mensaje de salida:

```txt
- Engine disponible: "Demo E2E completada contra engine real"
- Engine no disponible: "Demo E2E completada en modo local"
```

## Flujo recomendado

```txt
1. Abrir proyecto en VSCode
2. Arrancar engine V3 JSON
3. Abrir dashboard de la extensión
4. Crear plan
5. Revisar riesgos, pasos y archivos
6. Aprobar o rechazar
7. Ejecutar tarea
8. Revisar score, seguridad, calidad y memoria
9. Revisar workspaces
10. Integrar cambios manualmente con GitFlow
```

## Diseño de seguridad

La extensión no modifica código directamente.

El flujo seguro es:

```txt
VSCode → Engine → Workspace aislado → Review humano → GitFlow
```

## Empaquetar extensión

```bash
npm install -g @vscode/vsce
npm run package
```

Generará un `.vsix` instalable.
