export type Priority = "low" | "medium" | "high" | "critical";

export interface TaskInput {
  title: string;
  description: string;
  constraints: string[];
  priority: Priority;
  projectSpec?: ProjectSpec;
  answers?: Record<string, string>;
}

export interface ProjectSpec {
  projectType: string;
  language: string;
  framework: string;
  architecture: string;
  database: string;
  qualityLevel: string;
  securityLevel: string;
  deploymentTarget: string;
  testingStrategy: string;
  observability: boolean;
}

export interface DiscoveryQuestion {
  id: string;
  question: string;
  reason: string;
  required: boolean;
  options?: string[];
}

export interface DiscoveryResult {
  confidence: number;
  projectSpec: ProjectSpec;
  missingQuestions: DiscoveryQuestion[];
  canProceed: boolean;
  assumptions: string[];
}

export interface PlanStep {
  id: string;
  agent: string;
  task: string;
  workspace?: string;
  parallelizable: boolean;
}

export interface ExecutionPlan {
  planMode: true;
  summary: string;
  steps: PlanStep[];
  risks: string[];
  filesToInspect: string[];
  commandsToRun: string[];
  approvalRequired: boolean;
  metadata: Record<string, unknown>;
}

export interface EvaluationResult {
  success: boolean;
  score: number;
  testsPassed: boolean;
  acceptanceCriteriaMet: boolean;
  securityGatePassed: boolean;
  qualityGatePassed: boolean;
  issues: string[];
  recommendations: string[];
}

export interface AgentResult {
  agentName: string;
  status: string;
  output: Record<string, unknown>;
  logs: string[];
}

export interface RunExperience {
  runId: string;
  branch: string;
  workspaces?: Record<string, string>;
  task: TaskInput;
  discovery: DiscoveryResult;
  projectSpec: ProjectSpec;
  spec: Record<string, unknown>;
  plan: ExecutionPlan;
  agentResults?: AgentResult[];
  evaluation?: EvaluationResult;
  improvements?: string[];
  dryRun?: boolean;
  finishedAt?: string;
}
