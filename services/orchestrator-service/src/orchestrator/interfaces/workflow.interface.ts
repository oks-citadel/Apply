import { AgentType, AgentResponse } from './agent.interface';

export enum WorkflowType {
  JOB_DISCOVERY = 'job_discovery',
  APPLICATION = 'application',
  INTERVIEW_PREP = 'interview_prep',
  ANALYTICS_OPTIMIZATION = 'analytics_optimization',
  PROFILE_SETUP = 'profile_setup',
  BATCH_APPLY = 'batch_apply',
}

export enum WorkflowStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled',
}

export interface WorkflowStep {
  id: string;
  agent: AgentType;
  action: string;
  params: Record<string, unknown>;
  dependsOn?: string[];
  optional?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export interface WorkflowDefinition {
  type: WorkflowType;
  name: string;
  description: string;
  steps: WorkflowStep[];
  onError?: 'abort' | 'continue' | 'retry';
  maxDuration?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowType: WorkflowType;
  userId: string;
  status: WorkflowStatus;
  steps: WorkflowStepExecution[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface WorkflowStepExecution {
  stepId: string;
  agent: AgentType;
  status: WorkflowStatus;
  startedAt?: Date;
  completedAt?: Date;
  result?: AgentResponse;
  error?: string;
  retryCount: number;
}

export interface WorkflowContext {
  userId: string;
  correlationId: string;
  variables: Record<string, unknown>;
  stepResults: Map<string, AgentResponse>;
}
