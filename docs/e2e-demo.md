# Demo E2E del plugin

## Objetivo

Mostrar en vivo todo el flujo del plugin desde VSCode: plan, ejecucion, evaluacion, memoria y dashboard.

## Preparacion

1. Compilar la extension (`npm run compile`) cuando corresponda en tu flujo.
2. Abrir la extension en modo desarrollo (`Run Extension` desde VSCode).
3. Opcional: levantar backend en `http://127.0.0.1:3000` para demo online.

## Ejecucion

Lanzar desde Command Palette:

```txt
AI Workflow: Run End-to-End Demo
```

Tambien disponible en:

- Sidebar `AI Workflow > Actions > Run E2E Demo`
- Boton `Demo E2E` dentro del dashboard

## Comportamiento

### Modo online (backend disponible)

1. Crea plan real con `createPlan`.
2. Ejecuta run real con `runTask`.
3. Intenta conectar WebSocket al `runId` para eventos.
4. Refresca dashboard con memoria/metricas del engine.

### Modo local (fallback)

Si falla cualquier llamada al backend:

1. Genera plan demo local (`demo-plan-*`).
2. Genera run demo local (`demo-run-*`) con score y gates en verde.
3. Inserta logs de fallback para trazabilidad.
4. Refresca dashboard con metricas sinteticas (`mode: demo-local`).

## Que mostrar durante la demo

1. En dashboard, el bloque `Plan actual` con pasos por agente.
2. En `Última ejecución`, score y gates de seguridad/calidad.
3. En `Eventos WebSocket`, eventos `demo-started`, `demo-plan-created`, `demo-run-finished`.
4. En `Memoria reciente`, historial con runId de la demo.
5. En el arbol `Runs`, items nuevos con `score` o estado `plan`.

## Criterio de exito

La demo es exitosa si:

- Se completa sin errores bloqueantes.
- El dashboard muestra un flujo completo de punta a punta.
- Funciona tanto con backend real como en modo fallback local.
