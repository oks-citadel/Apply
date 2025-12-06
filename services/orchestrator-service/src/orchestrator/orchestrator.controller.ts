import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrchestratorService } from './orchestrator.service';
import { WorkflowService } from './workflow/workflow.service';
import {
  OrchestrateRequestDto,
  OrchestrateResponseDto,
} from './dto/orchestrate.dto';
import {
  ExecuteWorkflowDto,
  WorkflowExecutionDto,
} from './dto/workflow.dto';
import { WorkflowType } from './interfaces/workflow.interface';
import { AgentType, AgentHealth } from './interfaces/agent.interface';

@ApiTags('orchestration')
@ApiBearerAuth()
@Controller()
export class OrchestratorController {
  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly workflowService: WorkflowService,
  ) {}

  @Post('orchestrate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start an orchestration task' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Task accepted and queued for processing',
    type: OrchestrateResponseDto,
  })
  async orchestrate(
    @Body() request: OrchestrateRequestDto,
  ): Promise<OrchestrateResponseDto> {
    return this.orchestratorService.orchestrate(request);
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get task status' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task status retrieved',
    type: OrchestrateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
  })
  async getTaskStatus(
    @Param('taskId') taskId: string,
  ): Promise<OrchestrateResponseDto> {
    const status = await this.orchestratorService.getTaskStatus(taskId);
    if (!status) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    return status;
  }

  @Post('workflows/:type')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Execute a specific workflow' })
  @ApiParam({
    name: 'type',
    enum: WorkflowType,
    description: 'Workflow type to execute',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Workflow started',
    type: WorkflowExecutionDto,
  })
  async executeWorkflow(
    @Param('type') type: WorkflowType,
    @Body() request: ExecuteWorkflowDto,
  ): Promise<WorkflowExecutionDto> {
    const execution = await this.workflowService.executeWorkflow(
      type,
      request.user_id,
      request.parameters || {},
    );

    return {
      id: execution.id,
      workflow_type: execution.workflowType,
      user_id: execution.userId,
      status: execution.status,
      steps: execution.steps.map((step) => ({
        step_id: step.stepId,
        agent: step.agent,
        status: step.status,
        started_at: step.startedAt,
        completed_at: step.completedAt,
        result: step.result as Record<string, unknown> | undefined,
        error: step.error,
        retry_count: step.retryCount,
      })),
      started_at: execution.startedAt,
      completed_at: execution.completedAt,
      error: execution.error,
      result: execution.result,
    };
  }

  @Get('workflows/:executionId/status')
  @ApiOperation({ summary: 'Get workflow execution status' })
  @ApiParam({ name: 'executionId', description: 'Workflow execution ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow status retrieved',
    type: WorkflowExecutionDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workflow execution not found',
  })
  async getWorkflowStatus(
    @Param('executionId') executionId: string,
  ): Promise<WorkflowExecutionDto> {
    const execution = this.workflowService.getExecution(executionId);
    if (!execution) {
      throw new NotFoundException(`Workflow execution ${executionId} not found`);
    }

    return {
      id: execution.id,
      workflow_type: execution.workflowType,
      user_id: execution.userId,
      status: execution.status,
      steps: execution.steps.map((step) => ({
        step_id: step.stepId,
        agent: step.agent,
        status: step.status,
        started_at: step.startedAt,
        completed_at: step.completedAt,
        result: step.result as Record<string, unknown> | undefined,
        error: step.error,
        retry_count: step.retryCount,
      })),
      started_at: execution.startedAt,
      completed_at: execution.completedAt,
      error: execution.error,
      result: execution.result,
    };
  }

  @Get('workflows')
  @ApiOperation({ summary: 'List available workflow definitions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of workflow definitions',
  })
  listWorkflows(): Array<{
    type: WorkflowType;
    name: string;
    description: string;
  }> {
    return this.workflowService.listWorkflowDefinitions().map((def) => ({
      type: def.type,
      name: def.name,
      description: def.description,
    }));
  }

  @Get('agents/health')
  @ApiOperation({ summary: 'Get health status of all agents' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Agent health status',
  })
  async getAgentsHealth(): Promise<AgentHealth[]> {
    return this.orchestratorService.getAgentsHealth();
  }

  @Get('agents/:agentType/health')
  @ApiOperation({ summary: 'Get health status of a specific agent' })
  @ApiParam({
    name: 'agentType',
    enum: AgentType,
    description: 'Agent type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Agent health status',
  })
  async getAgentHealth(
    @Param('agentType') agentType: AgentType,
  ): Promise<AgentHealth> {
    return this.orchestratorService.getAgentHealth(agentType);
  }

  @Get('agents/circuits')
  @ApiOperation({ summary: 'Get circuit breaker statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Circuit breaker stats',
  })
  getCircuitBreakerStats(): Record<string, Record<string, unknown>> {
    return this.orchestratorService.getCircuitBreakerStats();
  }

  @Post('agents/:agentType/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset circuit breaker for an agent' })
  @ApiParam({
    name: 'agentType',
    enum: AgentType,
    description: 'Agent type',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Circuit breaker reset',
  })
  resetCircuitBreaker(@Param('agentType') agentType: AgentType): void {
    this.orchestratorService.resetCircuitBreaker(agentType);
  }
}
