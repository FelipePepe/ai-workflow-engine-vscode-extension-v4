import type {
  DiscoveryResult,
  RunExperience,
  TaskInput
} from "../types/engine-types.js";

export class EngineClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number = 30_000
  ) {}

  async health(): Promise<Record<string, unknown>> {
    return this.get("/");
  }

  async analyzeDiscovery(task: TaskInput): Promise<DiscoveryResult> {
    return this.post("/discovery/analyze", task);
  }

  async createPlan(task: TaskInput): Promise<RunExperience> {
    return this.post("/plan/create", task);
  }

  async runTask(task: TaskInput): Promise<RunExperience> {
    return this.post("/tasks/run", task);
  }

  async getMemory(limit = 20): Promise<RunExperience[]> {
    return this.get(`/memory?limit=${limit}`);
  }

  async getMetrics(): Promise<Record<string, unknown>> {
    return this.get("/metrics");
  }

  async getConfig(): Promise<Record<string, unknown>> {
    return this.get("/config");
  }

  private async fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        const method = init?.method ?? "GET";
        throw new Error(`${method} ${input} timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`GET ${path} failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`POST ${path} failed: ${response.status} ${response.statusText}\n${text}`);
    }

    return response.json() as Promise<T>;
  }
}
