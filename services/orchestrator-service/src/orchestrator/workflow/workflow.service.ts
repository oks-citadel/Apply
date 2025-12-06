import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowType,
  WorkflowStatus,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStep,
  WorkflowStepExecution,
  WorkflowContext,
} from '../interfaces/workflow.interface';
import { AgentType, AgentResponse } from '../interfaces/agent.interface';
import { AgentClientService } from '../services/agent-client.service';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private readonly executions: Map<string, WorkflowExecution> = new Map();
  private readonly workflowDefinitions: Map<WorkflowType, WorkflowDefinition>;

  constructor(private readonly agentClient: AgentClientService) {
    this.workflowDefinitions = this.initializeWorkflowDefinitions();
  }

  private initializeWorkflowDefinitions(): Map<WorkflowType, WorkflowDefinition> {
    const definitions = new Map<WorkflowType, WorkflowDefinition>();

    // Pattern 1: Job Discovery Flow
    definitions.set(WorkflowType.JOB_DISCOVERY, {
      type: WorkflowType.JOB_DISCOVERY,
      name: 'Job Discovery Workflow',
      description: 'Discover, verify, match, and analyze jobs for user',
      steps: [
        {
          id: 'compliance_check',
          agent: AgentType.COMPLIANCE,
          action: 'check',
          params: { operation: 'discovery' },
        },
        {
          id: 'discover_jobs',
          agent: AgentType.JOB_DISCOVERY,
          action: 'discover',
          params: {},
          dependsOn: ['compliance_check'],
        },
        {
          id: 'fraud_check',
          agent: AgentType.FRAUD_DETECTION,
          action: 'detect',
          params: {},
          dependsOn: ['discover_jobs'],
        },
        {
          id: 'match_jobs',
          agent: AgentType.JOB_MATCHING,
          action: 'match',
          params: {},
          dependsOn: ['fraud_check'],
        },
        {
          id: 'culture_analysis',
          agent: AgentType.CULTURE_FIT,
          action: 'analyze',
          params: {},
          dependsOn: ['match_jobs'],
          optional: true,
        },
        {
          id: 'send_notification',
          agent: AgentType.NOTIFICATION,
          action: 'digest',
          params: {},
          dependsOn: ['match_jobs'],
        },
      ],
      onError: 'continue',
      maxDuration: 300000,
    });

    // Pattern 2: Application Flow
    definitions.set(WorkflowType.APPLICATION, {
      type: WorkflowType.APPLICATION,
      name: 'Job Application Workflow',
      description: 'Complete job application with tailored resume and cover letter',
      steps: [
        {
          id: 'compliance_check',
          agent: AgentType.COMPLIANCE,
          action: 'check',
          params: { operation: 'application' },
        },
        {
          id: 'timing_optimization',
          agent: AgentType.APPLICATION_TIMING,
          action: 'optimize',
          params: {},
          dependsOn: ['compliance_check'],
        },
        {
          id: 'tailor_resume',
          agent: AgentType.RESUME_TAILORING,
          action: 'tailor',
          params: {},
          dependsOn: ['compliance_check'],
        },
        {
          id: 'generate_cover_letter',
          agent: AgentType.COVER_LETTER,
          action: 'generate',
          params: {},
          dependsOn: ['tailor_resume'],
        },
        {
          id: 'submit_application',
          agent: AgentType.APPLICATION_FORM,
          action: 'submit',
          params: {},
          dependsOn: ['generate_cover_letter', 'timing_optimization'],
        },
        {
          id: 'log_analytics',
          agent: AgentType.ANALYTICS,
          action: 'track',
          params: { event: 'application_submitted' },
          dependsOn: ['submit_application'],
        },
        {
          id: 'schedule_followup',
          agent: AgentType.FOLLOW_UP,
          action: 'schedule',
          params: {},
          dependsOn: ['submit_application'],
        },
        {
          id: 'send_confirmation',
          agent: AgentType.NOTIFICATION,
          action: 'send',
          params: { type: 'application_confirmation' },
          dependsOn: ['submit_application'],
        },
      ],
      onError: 'abort',
      maxDuration: 180000,
    });

    // Pattern 3: Interview Preparation Flow
    definitions.set(WorkflowType.INTERVIEW_PREP, {
      type: WorkflowType.INTERVIEW_PREP,
      name: 'Interview Preparation Workflow',
      description: 'Comprehensive interview preparation with research and practice',
      steps: [
        {
          id: 'company_research',
          agent: AgentType.INTERVIEW_PREP,
          action: 'prepare',
          params: { include_company_research: true },
        },
        {
          id: 'culture_analysis',
          agent: AgentType.CULTURE_FIT,
          action: 'analyze',
          params: {},
        },
        {
          id: 'generate_questions',
          agent: AgentType.INTERVIEW_PREP,
          action: 'questions',
          params: {},
          dependsOn: ['company_research'],
        },
        {
          id: 'salary_research',
          agent: AgentType.SALARY_NEGOTIATION,
          action: 'analyze',
          params: {},
          optional: true,
        },
        {
          id: 'network_analysis',
          agent: AgentType.NETWORK_INTELLIGENCE,
          action: 'analyze',
          params: {},
          optional: true,
        },
        {
          id: 'schedule_simulation',
          agent: AgentType.INTERVIEW_SIMULATION,
          action: 'simulate',
          params: {},
          dependsOn: ['generate_questions'],
          optional: true,
        },
        {
          id: 'send_prep_package',
          agent: AgentType.NOTIFICATION,
          action: 'send',
          params: { type: 'interview_prep_package' },
          dependsOn: ['generate_questions', 'culture_analysis'],
        },
      ],
      onError: 'continue',
      maxDuration: 240000,
    });

    // Pattern 4: Analytics & Optimization Flow
    definitions.set(WorkflowType.ANALYTICS_OPTIMIZATION, {
      type: WorkflowType.ANALYTICS_OPTIMIZATION,
      name: 'Analytics and Optimization Workflow',
      description: 'Analyze application patterns and provide improvement recommendations',
      steps: [
        {
          id: 'get_metrics',
          agent: AgentType.ANALYTICS,
          action: 'report',
          params: { report_type: 'detailed' },
        },
        {
          id: 'rejection_analysis',
          agent: AgentType.REJECTION_ANALYSIS,
          action: 'analyze',
          params: {},
          dependsOn: ['get_metrics'],
        },
        {
          id: 'skill_gap_analysis',
          agent: AgentType.SKILL_GAP,
          action: 'analyze',
          params: {},
          dependsOn: ['rejection_analysis'],
        },
        {
          id: 'resume_analysis',
          agent: AgentType.RESUME_TAILORING,
          action: 'analyze',
          params: {},
        },
        {
          id: 'competitive_analysis',
          agent: AgentType.COMPETITIVE_ANALYSIS,
          action: 'analyze',
          params: {},
          dependsOn: ['get_metrics'],
        },
        {
          id: 'brand_audit',
          agent: AgentType.PERSONAL_BRAND,
          action: 'optimize',
          params: {},
          optional: true,
        },
      ],
      onError: 'continue',
      maxDuration: 300000,
    });

    return definitions;
  }

  async executeWorkflow(
    workflowType: WorkflowType,
    userId: string,
    parameters: Record<string, unknown>,
  ): Promise<WorkflowExecution> {
    const definition = this.workflowDefinitions.get(workflowType);
    if (!definition) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    const executionId = uuidv4();
    const correlationId = uuidv4();

    const execution: WorkflowExecution = {
      id: executionId,
      workflowType,
      userId,
      status: WorkflowStatus.PROCESSING,
      steps: definition.steps.map((step) => ({
        stepId: step.id,
        agent: step.agent,
        status: WorkflowStatus.PENDING,
        retryCount: 0,
      })),
      startedAt: new Date(),
      metadata: { correlationId, parameters },
    };

    this.executions.set(executionId, execution);

    // Execute workflow asynchronously
    this.runWorkflow(execution, definition, {
      userId,
      correlationId,
      variables: parameters,
      stepResults: new Map(),
    }).catch((error) => {
      this.logger.error(`Workflow execution failed: ${error.message}`);
      execution.status = WorkflowStatus.FAILED;
      execution.error = error.message;
      execution.completedAt = new Date();
    });

    return execution;
  }

  private async runWorkflow(
    execution: WorkflowExecution,
    definition: WorkflowDefinition,
    context: WorkflowContext,
  ): Promise<void> {
    const completedSteps = new Set<string>();
    const failedSteps = new Set<string>();

    while (completedSteps.size + failedSteps.size < definition.steps.length) {
      const readySteps = definition.steps.filter((step) => {
        if (completedSteps.has(step.id) || failedSteps.has(step.id)) {
          return false;
        }

        if (!step.dependsOn || step.dependsOn.length === 0) {
          return true;
        }

        return step.dependsOn.every(
          (depId) => completedSteps.has(depId) || (failedSteps.has(depId) && step.optional),
        );
      });

      if (readySteps.length === 0) {
        if (completedSteps.size + failedSteps.size < definition.steps.length) {
          execution.status = WorkflowStatus.FAILED;
          execution.error = 'Workflow deadlock: no steps can proceed';
          break;
        }
        break;
      }

      // Execute ready steps in parallel
      const stepPromises = readySteps.map((step) =>
        this.executeStep(execution, step, context),
      );

      const results = await Promise.allSettled(stepPromises);

      for (let i = 0; i < results.length; i++) {
        const step = readySteps[i];
        const result = results[i];

        if (result.status === 'fulfilled' && result.value.success) {
          completedSteps.add(step.id);
          context.stepResults.set(step.id, result.value);
        } else {
          if (step.optional) {
            completedSteps.add(step.id);
          } else {
            failedSteps.add(step.id);

            if (definition.onError === 'abort') {
              execution.status = WorkflowStatus.FAILED;
              execution.error = `Step ${step.id} failed: ${
                result.status === 'rejected' ? result.reason : 'Unknown error'
              }`;
              execution.completedAt = new Date();
              return;
            }
          }
        }
      }
    }

    // Determine final status
    if (failedSteps.size > 0) {
      execution.status = WorkflowStatus.PARTIAL;
    } else {
      execution.status = WorkflowStatus.COMPLETED;
    }

    execution.completedAt = new Date();

    // Aggregate results
    execution.result = {};
    for (const [stepId, response] of context.stepResults) {
      execution.result[stepId] = response.data;
    }
  }

  private async executeStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    context: WorkflowContext,
  ): Promise<AgentResponse> {
    const stepExecution = execution.steps.find((s) => s.stepId === step.id);
    if (!stepExecution) {
      throw new Error(`Step not found: ${step.id}`);
    }

    stepExecution.status = WorkflowStatus.PROCESSING;
    stepExecution.startedAt = new Date();

    try {
      const response = await this.agentClient.callAgent({
        agentType: step.agent,
        action: step.action,
        payload: {
          ...step.params,
          ...context.variables,
          previousResults: Object.fromEntries(context.stepResults),
        },
        userId: context.userId,
        correlationId: context.correlationId,
        priority: 'medium',
        timeout: step.timeout,
      });

      stepExecution.result = response;
      stepExecution.completedAt = new Date();

      if (response.success) {
        stepExecution.status = WorkflowStatus.COMPLETED;
      } else {
        stepExecution.status = WorkflowStatus.FAILED;
        stepExecution.error = response.error;
      }

      return response;
    } catch (error) {
      stepExecution.status = WorkflowStatus.FAILED;
      stepExecution.error = error instanceof Error ? error.message : 'Unknown error';
      stepExecution.completedAt = new Date();
      stepExecution.retryCount++;

      throw error;
    }
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutionsByUser(userId: string): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter((e) => e.userId === userId);
  }

  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === WorkflowStatus.PROCESSING) {
      execution.status = WorkflowStatus.CANCELLED;
      execution.completedAt = new Date();
      return true;
    }
    return false;
  }

  getWorkflowDefinition(workflowType: WorkflowType): WorkflowDefinition | undefined {
    return this.workflowDefinitions.get(workflowType);
  }

  listWorkflowDefinitions(): WorkflowDefinition[] {
    return Array.from(this.workflowDefinitions.values());
  }
}
