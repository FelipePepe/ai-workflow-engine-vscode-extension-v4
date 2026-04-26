import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import type { RunExperience } from "../types/engine-types.js";

export class PlanRepository {
  private readonly db: DatabaseSync;

  constructor(storagePath: string) {
    fs.mkdirSync(storagePath, { recursive: true });
    this.db = new DatabaseSync(path.join(storagePath, "workflow.db"));
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plans (
        runId    TEXT PRIMARY KEY,
        branch   TEXT NOT NULL,
        title    TEXT NOT NULL,
        status   TEXT NOT NULL DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        data     TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS runs (
        runId      TEXT PRIMARY KEY,
        branch     TEXT NOT NULL,
        title      TEXT NOT NULL,
        score      REAL,
        success    INTEGER,
        finishedAt TEXT,
        data       TEXT NOT NULL
      );
    `);
  }

  savePlan(run: RunExperience): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO plans (runId, branch, title, status, createdAt, data)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).run(run.runId, run.branch, run.task?.title ?? "", new Date().toISOString(), JSON.stringify(run));
  }

  saveRun(run: RunExperience): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO runs (runId, branch, title, score, success, finishedAt, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      run.runId,
      run.branch,
      run.task?.title ?? "",
      run.evaluation?.score ?? null,
      run.evaluation?.success ? 1 : 0,
      run.finishedAt ?? new Date().toISOString(),
      JSON.stringify(run)
    );
  }

  updatePlanStatus(runId: string, status: string): void {
    this.db.prepare(`UPDATE plans SET status = ? WHERE runId = ?`).run(status, runId);
  }

  getPlans(limit = 50): RunExperience[] {
    const rows = this.db.prepare(`SELECT data FROM plans ORDER BY createdAt DESC LIMIT ?`).all(limit) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as RunExperience);
  }

  getRuns(limit = 50): RunExperience[] {
    const rows = this.db.prepare(`SELECT data FROM runs ORDER BY finishedAt DESC LIMIT ?`).all(limit) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as RunExperience);
  }

  getHistory(limit = 50): RunExperience[] {
    const rows = this.db.prepare(`
      SELECT data, createdAt AS date FROM plans
      UNION ALL
      SELECT data, finishedAt AS date FROM runs
      ORDER BY date DESC
      LIMIT ?
    `).all(limit) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as RunExperience);
  }
}
