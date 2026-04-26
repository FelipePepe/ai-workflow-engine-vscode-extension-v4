import * as vscode from "vscode";
import type { RunExperience } from "../types/engine-types.js";

const KEY_CURRENT_PLAN = "aiWorkflow.currentPlan";
const KEY_LAST_RUN = "aiWorkflow.lastRun";

export class StateService {
  constructor(private readonly storage: vscode.Memento) {}

  get currentPlan(): RunExperience | undefined {
    return this.storage.get<RunExperience>(KEY_CURRENT_PLAN);
  }

  set currentPlan(value: RunExperience | undefined) {
    void this.storage.update(KEY_CURRENT_PLAN, value);
  }

  get lastRun(): RunExperience | undefined {
    return this.storage.get<RunExperience>(KEY_LAST_RUN);
  }

  set lastRun(value: RunExperience | undefined) {
    void this.storage.update(KEY_LAST_RUN, value);
  }
}
