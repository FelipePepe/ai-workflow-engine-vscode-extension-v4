import * as vscode from "vscode";
import type { Priority, TaskInput, TaskType } from "../types/engine-types.js";
import { ConfigService } from "./config-service.js";

export class TaskInputService {
  constructor(private readonly config: ConfigService) {}

  async askTask(): Promise<TaskInput | undefined> {
    // Step 1: task type
    const typeItem = await vscode.window.showQuickPick(
      [
        { label: "$(file-directory) Nuevo proyecto", description: "Crear proyecto desde cero", value: "new_project" as TaskType },
        { label: "$(git-pull-request) Evolutivo",     description: "Añadir feature al proyecto actual", value: "evolutive" as TaskType },
        { label: "$(bug) Incidencia",                  description: "Corregir bug en el proyecto actual", value: "incident" as TaskType }
      ],
      { title: "Crear Plan — Tipo de tarea", placeHolder: "¿Qué tipo de tarea es?" }
    );
    if (!typeItem) { return undefined; }

    const taskType: TaskType = typeItem.value;

    // Step 2: resolve workspace path
    let workspacePath: string | undefined;
    if (taskType === "evolutive" || taskType === "incident") {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showWarningMessage("Abre primero un proyecto en VSCode para usar modo evolutivo o incidencia.");
        return undefined;
      }
      if (folders.length === 1) {
        workspacePath = folders[0].uri.fsPath;
      } else {
        const picked = await vscode.window.showQuickPick(
          folders.map((f) => ({ label: f.name, description: f.uri.fsPath, fsPath: f.uri.fsPath })),
          { title: "Crear Plan — Selecciona el proyecto a modificar" }
        );
        if (!picked) { return undefined; }
        workspacePath = picked.fsPath;
      }
    }

    // Step 3: title
    const title = await vscode.window.showInputBox({
      title: `Crear Plan — Título${workspacePath ? ` (${workspacePath.split("/").pop()})` : ""}`,
      prompt: "Título de la tarea",
      placeHolder: "Ej: Crear login seguro",
      validateInput: (v) => {
        if (!v.trim()) return "El título no puede estar vacío";
        if (v.trim().length > 200) return "Máximo 200 caracteres";
        return undefined;
      }
    });
    if (title === undefined) { return undefined; }

    // Step 4: description
    const description = await vscode.window.showInputBox({
      title: "Crear Plan — Descripción",
      prompt: "Descripción detallada",
      placeHolder: "Ej: Crear endpoint login con usuario, password y validación de errores",
      validateInput: (v) => !v.trim() ? "La descripción no puede estar vacía" : undefined
    });
    if (description === undefined) { return undefined; }

    return {
      title: title.trim(),
      description: description.trim(),
      constraints: [],
      priority: this.config.defaultPriority as Priority,
      taskType,
      ...(workspacePath ? { workspacePath } : {})
    };
  }
}
