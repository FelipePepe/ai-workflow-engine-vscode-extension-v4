import * as vscode from "vscode";
import type { Priority, TaskInput } from "../types/engine-types.js";
import { ConfigService } from "./config-service.js";

export class TaskInputService {
  constructor(private readonly config: ConfigService) {}

  async askTask(): Promise<TaskInput | undefined> {
    const title = await vscode.window.showInputBox({
      prompt: "Título de la tarea",
      placeHolder: "Ej: Crear login seguro",
      validateInput: (v) => v.trim().length > 200 ? "Title must be 200 characters or less" : undefined
    });

    if (!title) {
      return undefined;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      vscode.window.showWarningMessage("El título no puede estar vacío.");
      return undefined;
    }

    const description = await vscode.window.showInputBox({
      prompt: "Descripción detallada",
      placeHolder: "Ej: Crear endpoint login con usuario, password y validación de errores"
    });

    if (!description) {
      return undefined;
    }

    const constraintsRaw = await vscode.window.showInputBox({
      prompt: "Restricciones separadas por coma",
      placeHolder: "Debe incluir tests, No exponer secretos, OWASP"
    });

    const priority = await vscode.window.showQuickPick(["low", "medium", "high", "critical"], {
      title: "Prioridad",
      placeHolder: this.config.defaultPriority
    }) as Priority | undefined;

    return {
      title: trimmedTitle,
      description,
      constraints: constraintsRaw
        ? [...new Set(constraintsRaw.split(",").map((x) => x.trim()).filter((c) => c.length > 0))]
        : [],
      priority: priority ?? this.config.defaultPriority as Priority
    };
  }
}
