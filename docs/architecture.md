# Arquitectura de la extensión V4

## Componentes

```txt
VSCode Extension
  ├── Commands
  ├── Dashboard Webview
  ├── Runs Tree View
  ├── Actions Tree View
  ├── Engine REST Client
  ├── Engine WebSocket Client
  └── Workspace Service
```

## Comunicación

```txt
VSCode
  ↓ REST
AI Workflow Engine
  ↓ WebSocket
VSCode Dashboard
```

## Responsabilidades

- VSCode: control humano, visualización, aprobación
- Engine: plan, agentes, seguridad, calidad, memoria
- Workspaces: aislamiento
- GitFlow: integración controlada
