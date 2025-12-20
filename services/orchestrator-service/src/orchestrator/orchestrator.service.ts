import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  TaskType,
  Priority,
} from './dto/orchestrate.dto';
import { WorkflowType, WorkflowStatus } from './interfaces/workflow.interface';


import type {
  OrchestrateRequestDto,
  OrchestrateResponseDto} from './dto/orchestrate.dto';
import type { AgentType, AgentHealth } from './interfaces/agent.interface';
import type { WorkflowExecution } from './interfaces/workflow.interface';
import type { AgentClientService } from './services/agent-client.service';
import type { CircuitBreakerService } from './services/circuit-breaker.service';
import type { WorkflowService } from './workflow/workflow.service';
import type { Queue } from 'bull';

interface TaskExecution {
  id: string;
  userId: string;
  taskType: TaskType;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'partial';
  priority: Priority;
  startedAt: Date;
  completedAt?: Date;
  workflowExecutionId?: string;
  results?: Record<string, unknown>;
  errors?: Array<{ agent: string; error: string; recoverable: boolean }>;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly tasks: Map<string, TaskExecution> = new Map();

  constructor(
    @InjectQueue('orchestrator-tasks') private readonly taskQueue: Queue,
    private readonly workflowService: WorkflowService,
    private readonly agentClient: AgentClientService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async orchestrate(request: OrchestrateRequestDto): Promise<OrchestrateResponseDto> {
    const taskId = uuidv4();
    const startedAt = new Date();

    this.logger.log(`Starting orchestration task ${taskId} for user ${request.user_id}`);

    const task: TaskExecution = {
      id: taskId,
      userId: request.user_id,
      taskType: request.task_type,
      status: 'queued',
      priority: request.priority || Priority.MEDIUM,
      startedAt,
    };

    this.tasks.set(taskId, task);

    // Map task type to workflow type
    const workflowType = this.mapTaskTypeToWorkflow(request.task_type);

    if (workflowType) {
      // Execute workflow
      try {
        task.status = 'processing';

        const workflowExecution = await this.workflowService.executeWorkflow(
          workflowType,
          request.user_id,
          (request.parameters || {}) as Record<string, unknown>,
        );

        task.workflowExecutionId = workflowExecution.id;

        // For immediate response, return the initial state
        // The workflow continues asynchronously
        return {
          task_id: taskId,
          status: this.mapWorkflowStatus(workflowExecution.status),
          started_at: startedAt,
          results: {
            jobs_discovered: 0,
            applications_submitted: 0,
            errors: [],
          },
          agent_states: this.getAgentStates(),
        };
      } catch (error) {
        task.status = 'failed';
        task.completedAt = new Date();
        task.errors = [
          {
            agent: 'orchestrator',
            error: error instanceof Error ? error.message : 'Unknown error',
            recoverable: false,
          },
        ];

        return {
          task_id: taskId,
          status: 'failed',
          started_at: startedAt,
          completed_at: task.completedAt,
          results: {
            errors: task.errors,
          },
        };
      }
    }

    // If no workflow mapping, queue for background processing
    await this.taskQueue.add(
      'process-task',
      { taskId, request },
      {
        priority: this.getPriorityNumber(request.priority || Priority.MEDIUM),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        timeout: (request.timeout_seconds || 300) * 1000,
      },
    );

    return {
      task_id: taskId,
      status: 'queued',
      started_at: startedAt,
      agent_states: this.getAgentStates(),
    };
  }

  async getTaskStatus(taskId: string): Promise<OrchestrateResponseDto | null> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    // If task has a workflow execution, get its status
    if (task.workflowExecutionId) {
      const workflowExecution = this.workflowService.getExecution(task.workflowExecutionId);
      if (workflowExecution) {
        return {
          task_id: taskId,
          status: this.mapWorkflowStatus(workflowExecution.status),
          started_at: task.startedAt,
          completed_at: workflowExecution.completedAt,
          results: this.extractResults(workflowExecution.result),
          agent_states: this.getAgentStatesFromWorkflow(workflowExecution),
        };
      }
    }

    return {
      task_id: taskId,
      status: task.status,
      started_at: task.startedAt,
      completed_at: task.completedAt,
      results: {
        errors: task.errors,
      },
      agent_states: this.getAgentStates(),
    };
  }

  async getAgentsHealth(): Promise<AgentHealth[]> {
    return this.agentClient.checkAllAgentsHealth();
  }

  async getAgentHealth(agentType: AgentType): Promise<AgentHealth> {
    return this.agentClient.checkHealth(agentType);
  }

  getCircuitBreakerStats(): Record<string, Record<string, unknown>> {
    return this.circuitBreaker.getAllStats();
  }

  resetCircuitBreaker(agentType: AgentType): void {
    this.circuitBreaker.resetCircuit(agentType);
  }

  private mapTaskTypeToWorkflow(taskType: TaskType): WorkflowType | null {
    const mapping: Record<TaskType, WorkflowType> = {
      [TaskType.DISCOVER]: WorkflowType.JOB_DISCOVERY,
      [TaskType.APPLY]: WorkflowType.APPLICATION,
      [TaskType.PREPARE]: WorkflowType.INTERVIEW_PREP,
      [TaskType.ANALYZE]: WorkflowType.ANALYTICS_OPTIMIZATION,
    };

    return mapping[taskType] || null;
  }

  private mapWorkflowStatus(
    status: WorkflowStatus,
  ): 'queued' | 'processing' | 'completed' | 'failed' | 'partial' {
    const mapping: Record<
      WorkflowStatus,
      'queued' | 'processing' | 'completed' | 'failed' | 'partial'
    > = {
      [WorkflowStatus.PENDING]: 'queued',
      [WorkflowStatus.QUEUED]: 'queued',
      [WorkflowStatus.PROCESSING]: 'processing',
      [WorkflowStatus.COMPLETED]: 'completed',
      [WorkflowStatus.FAILED]: 'failed',
      [WorkflowStatus.PARTIAL]: 'partial',
      [WorkflowStatus.CANCELLED]: 'failed',
    };

    return mapping[status] || 'processing';
  }

  private getPriorityNumber(priority: Priority): number {
    const mapping: Record<Priority, number> = {
      [Priority.URGENT]: 1,
      [Priority.HIGH]: 2,
      [Priority.MEDIUM]: 3,
      [Priority.LOW]: 4,
    };

    return mapping[priority] || 3;
  }

  private getAgentStates(): Record<string, { status: string; last_run?: Date }> {
    const stats = this.circuitBreaker.getAllStats();
    const states: Record<string, { status: string; last_run?: Date }> = {};

    for (const [agent, stat] of Object.entries(stats)) {
      states[agent] = {
        status: stat.status as string,
        last_run: stat.lastSuccess as Date | undefined,
      };
    }

    return states;
  }

  private getAgentStatesFromWorkflow(
    _execution: WorkflowExecution,
  ): Record<string, { status: string; last_run?: Date }> {
    // Extract agent states from workflow execution
    return this.getAgentStates();
  }

  private extractResults(
    result: Record<string, unknown> | undefined,
  ): Record<string, unknown> {
    if (!result) {
      return {};
    }

    // Extract meaningful results based on workflow outputs
    let jobsDiscovered = 0;
    let applicationsSubmitted = 0;
    const errors: Array<{ agent: string; error: string; recoverable: boolean }> = [];

    if (result.discover_jobs && typeof result.discover_jobs === 'object') {
      const discoverResult = result.discover_jobs as Record<string, unknown>;
      if (Array.isArray(discoverResult.jobs)) {
        jobsDiscovered = discoverResult.jobs.length;
      }
    }

    if (result.submit_application && typeof result.submit_application === 'object') {
      const submitResult = result.submit_application as Record<string, unknown>;
      if (submitResult.success) {
        applicationsSubmitted = 1;
      }
    }

    return {
      jobs_discovered: jobsDiscovered,
      applications_submitted: applicationsSubmitted,
      errors,
      raw: result,
    };
  }
}
