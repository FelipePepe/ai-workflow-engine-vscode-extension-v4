import * as fs from "node:fs";
import * as path from "node:path";

export class Logger {
  private readonly logPath: string;

  constructor(storagePath: string) {
    fs.mkdirSync(storagePath, { recursive: true });
    this.logPath = path.join(storagePath, "extension.log");
  }

  private write(level: string, message: string, data?: unknown): void {
    const ts = new Date().toISOString();
    const extra = data === undefined ? "" : " " + JSON.stringify(data);
    const line = `${ts} [${level}] ${message}${extra}\n`;
    fs.appendFileSync(this.logPath, line, "utf8");
  }

  info(message: string, data?: unknown): void { this.write("INFO", message, data); }
  warn(message: string, data?: unknown): void { this.write("WARN", message, data); }
  error(message: string, data?: unknown): void { this.write("ERROR", message, data); }

  get path(): string { return this.logPath; }
}
