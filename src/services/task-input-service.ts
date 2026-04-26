import * as vscode from "vscode";
import type { Priority, TaskInput } from "../types/engine-types.js";
import { ConfigService } from "./config-service.js";

export class TaskInputService {
  constructor(private readonly config: ConfigService) {}

  async askTask(): Promise<TaskInput | undefined> {
    const title = await vscode.window.showInputBox({
      title: "Crear Plan — Paso 1 de 2",
      prompt: "Título de la tarea",
      placeHolder: "Ej: Crear login seguro",
      validateInput: (v) => {
        if (!v.trim()) return "El título no puede estar vacío";
        if (v.trim().length > 200) return "Máximo 200 caracteres";
        return undefined;
      }
    });

    if (title === undefined) { return undefined; }

    const description = await vscode.window.showInputBox({
      title: "Crear Plan — Paso 2 de 2",
      prompt: "Descripción detallada",
      placeHolder: "Ej: Crear endpoint login con usuario, password y validación de errores",
      validateInput: (v) => !v.trim() ? "La descripción no puede estar vacía" : undefined
    });

    if (description === undefined) { return undefined; }

    return {
      title: title.trim(),
      description: description.trim(),
      constraints: [],
      priority: this.config.defaultPriority as Priority
    };
  }
}
