import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { OrchestratorService } from '../orchestrator.service';
import { WorkflowService } from '../workflow/workflow.service';
import { AgentClientService } from '../services/agent-client.service';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import {
  OrchestrateRequestDto,
  TaskType,
  Priority,
} from '../dto/orchestrate.dto';
import {
  WorkflowType,
  WorkflowStatus,
  WorkflowExecution,
} from '../interfaces/workflow.interface';
import { AgentType, AgentHealth, AgentStatus } from '../interfaces/agent.interface';

describe('OrchestratorService', () => {
  let service: OrchestratorService;
  let workflowService: WorkflowService;
  let agentClient: AgentClientService;
  let circuitBreaker: CircuitBreakerService;
  let taskQueue: Queue;

  const mockTaskQueue = {
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
    getJob: jest.fn(),
    getJobs: jest.fn(),
  };

  const mockWorkflowService = {
    executeWorkflow: jest.fn(),
    getExecution: jest.fn(),
    cancelWorkflow: jest.fn(),
    getWorkflowHistory: jest.fn(),
  };

  const mockAgentClient = {
    checkAllAgentsHealth: jest.fn(),
    checkHealth: jest.fn(),
    callAgent: jest.fn(),
  };

  const mockCircuitBreaker = {
    execute: jest.fn(),
    getAllStats: jest.fn(),
    getStats: jest.fn(),
    resetCircuit: jest.fn(),
    resetAllCircuits: jest.fn(),
    isOpen: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrchestratorService,
        {
          provide: getQueueToken('orchestrator-tasks'),
          useValue: mockTaskQueue,
        },
        {
          provide: WorkflowService,
          useValue: mockWorkflowService,
        },
        {
          provide: AgentClientService,
          useValue: mockAgentClient,
        },
        {
          provide: CircuitBreakerService,
          useValue: mockCircuitBreaker,
        },
      ],
    }).compile();

    service = module.get<OrchestratorService>(OrchestratorService);
    workflowService = module.get<WorkflowService>(WorkflowService);
    agentClient = module.get<AgentClientService>(AgentClientService);
    circuitBreaker = module.get<CircuitBreakerService>(CircuitBreakerService);
    taskQueue = module.get<Queue>(getQueueToken('orchestrator-tasks'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('orchestrate', () => {
    const mockRequest: OrchestrateRequestDto = {
      user_id: 'user-123',
      task_type: TaskType.DISCOVER,
      priority: Priority.HIGH,
      parameters: {
        keywords: ['software engineer'],
        locations: ['San Francisco'],
      },
      timeout_seconds: 300,
    };

    it('should execute workflow for DISCOVER task type', async () => {
      const mockWorkflowExecution: WorkflowExecution = {
        id: 'workflow-1',
        workflowType: WorkflowType.JOB_DISCOVERY,
        userId: 'user-123',
        status: WorkflowStatus.PROCESSING,
        steps: [],
        startedAt: new Date(),
        metadata: { parameters: mockRequest.parameters },
      };

      mockCircuitBreaker.getAllStats.mockReturnValue({});
      mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);

      const result = await service.orchestrate(mockRequest);

      expect(result).toBeDefined();
      expect(result.task_id).toBeDefined();
      expect(result.status).toBe('processing');
      expect(result.started_at).toBeInstanceOf(Date);
      expect(workflowService.executeWorkflow).toHaveBeenCalledWith(
        WorkflowType.JOB_DISCOVERY,
        'user-123',
        mockRequest.parameters,
      );
    });

    it('should execute workflow for APPLY task type', async () => {
      const applyRequest = { ...mockRequest, task_type: TaskType.APPLY };
      const mockWorkflowExecution: WorkflowExecution = {
        id: 'workflow-2',
        workflowType: WorkflowType.APPLICATION,
        userId: 'user-123',
        status: WorkflowStatus.PROCESSING,
        steps: [],
        startedAt: new Date(),
        metadata: { parameters: mockRequest.parameters },
      };

      mockCircuitBreaker.getAllStats.mockReturnValue({});
      mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);

      const result = await service.orchestrate(applyRequest);

      expect(workflowService.executeWorkflow).toHaveBeenCalledWith(
        WorkflowType.APPLICATION,
        'user-123',
        mockRequest.parameters,
      );
    });

    it('should execute workflow for PREPARE task type', async () => {
      const prepareRequest = { ...mockRequest, task_type: TaskType.PREPARE };
      const mockWorkflowExecution: WorkflowExecution = {
        id: 'workflow-3',
        workflowType: WorkflowType.INTERVIEW_PREP,
        userId: 'user-123',
        status: WorkflowStatus.PROCESSING,
        steps: [],
        startedAt: new Date(),
        metadata: { parameters: mockRequest.parameters },
      };

      mockCircuitBreaker.getAllStats.mockReturnValue({});
      mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);

      const result = await service.orchestrate(prepareRequest);

      expect(workflowService.executeWorkflow).toHaveBeenCalledWith(
        WorkflowType.INTERVIEW_PREP,
        'user-123',
        mockRequest.parameters,
      );
    });

    it('should execute workflow for ANALYZE task type', async () => {
      const analyzeRequest = { ...mockRequest, task_type: TaskType.ANALYZE };
      const mockWorkflowExecution: WorkflowExecution = {
        id: 'workflow-4',
        workflowType: WorkflowType.ANALYTICS_OPTIMIZATION,
        userId: 'user-123',
        status: WorkflowStatus.PROCESSING,
        steps: [],
        startedAt: new Date(),
        metadata: { parameters: mockRequest.parameters },
      };

      mockCircuitBreaker.getAllStats.mockReturnValue({});
      mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);

      const result = await service.orchestrate(analyzeRequest);

      expect(workflowService.executeWorkflow).toHaveBeenCalledWith(
        WorkflowType.ANALYTICS_OPTIMIZATION,
        'user-123',
        mockRequest.parameters,
      );
    });

    it('should use default priority MEDIUM when not specified', async () => {
      const requestWithoutPriority = {
        user_id: 'user-123',
        task_type: TaskType.DISCOVER,
        parameters: {},
      };

      mockCircuitBreaker.getAllStats.mockReturnValue({});
      mockWorkflowService.executeWorkflow.mockResolvedValue({
        id: 'workflow-1',
        workflowType: WorkflowType.JOB_DISCOVERY,
        userId: 'user-123',
        status: WorkflowStatus.PROCESSING,
        steps: [],
        currentStep: 0,
        startedAt: new Date(),
      });

      await service.orchestrate(requestWithoutPriority);

      expect(workflowService.executeWorkflow).toHaveBeenCalled();
    });

    it('should handle workflow execution failure', async () => {
      mockCircuitBreaker.getAllStats.mockReturnValue({});
      mockWorkflowService.executeWorkflow.mockRejectedValue(
        new Error('Workflow execution failed'),
      );

      const result = await service.orchestrate(mockRequest);

      expect(result.status).toBe('failed');
      expect(result.results?.errors).toBeDefined();
      expect(result.results?.errors).toHaveLength(1);
      expect(result.results?.errors?.[0]?.agent).toBe('orchestrator');
    });

    it('should include agent states in response', async () => {
      const mockStats = {
        [AgentType.JOB_DISCOVERY]: {
          status: AgentStatus.HEALTHY,
          lastSuccess: new Date(),
        },
        [AgentType.AUTO_APPLY]: {
          status: AgentStatus.HEALTHY,
          lastSuccess: new Date(),
        },
      };

      mockCircuitBreaker.getAllStats.mockReturnValue(mockStats);
      mockWorkflowService.executeWorkflow.mockResolvedValue({
        id: 'workflow-1',
        workflowType: WorkflowType.JOB_DISCOVERY,
        userId: 'user-123',
        status: WorkflowStatus.PROCESSING,
        steps: [],
        startedAt: new Date(),
        metadata: {},
      });

      const result = await service.orchestrate(mockRequest);

      expect(result.agent_states).toBeDefined();
      expect(result.agent_states?.[AgentType.JOB_DISCOVERY]).toBeDefined();
      expect(result.agent_states?.[AgentType.AUTO_APPLY]).toBeDefined();
    });

    it('should queue task when no workflow mapping exists', async () => {
      const customRequest = {
        ...mockRequest,
        task_type: 'CUSTOM' as TaskType,
      };

      mockTaskQueue.add.mockResolvedValue({});
      mockCircuitBreaker.getAllStats.mockReturnValue({});

      const result = await service.orchestrate(customRequest);

      expect(result.status).toBe('queued');
      expect(taskQueue.add).toHaveBeenCalledWith(
        'process-task',
        expect.objectContaining({
          request: customRequest,
        }),
        expect.any(Object),
      );
    });

    it('should set correct queue priority for URGENT tasks', async () => {
      const urgentRequest = {
        ...mockRequest,
        priority: Priority.URGENT,
        task_type: 'CUSTOM' as TaskType,
      };

      mockTaskQueue.add.mockResolvedValue({});
      mockCircuitBreaker.getAllStats.mockReturnValue({});

      await service.orchestrate(urgentRequest);

      expect(taskQueue.add).toHaveBeenCalledWith(
        'process-task',
        expect.any(Object),
        expect.objectContaining({
          priority: 1,
        }),
      );
    });

    it('should set correct queue priority for LOW tasks', async () => {
      const lowPriorityRequest = {
        ...mockRequest,
        priority: Priority.LOW,
        task_type: 'CUSTOM' as TaskType,
      };

      mockTaskQueue.add.mockResolvedValue({});
      mockCircuitBreaker.getAllStats.mockReturnValue({});

      await service.orchestrate(lowPriorityRequest);

      expect(taskQueue.add).toHaveBeenCalledWith(
        'process-task',
        expect.any(Object),
        expect.objectContaining({
          priority: 4,
        }),
      );
    });

    it('should set queue timeout from request', async () => {
      const requestWithTimeout = {
        ...mockRequest,
        timeout_seconds: 600,
        task_type: 'CUSTOM' as TaskType,
      };

      mockTaskQueue.add.mockResolvedValue({});
      mockCircuitBreaker.getAllStats.mockReturnValue({});

      await service.orchestrate(requestWithTimeout);

      expect(taskQueue.add).toHaveBeenCalledWith(
        'process-task',
        expect.any(Object),
        expect.objectContaining({
          timeout: 600000,
        }),
      );
    });
  });

  describe('getTaskStatus', () => {
    it('should return null for non-existent task', async () => {
      const result = await service.getTaskStatus('nonexistent-task-id');

      expect(result).toBeNull();
    });

    it('should return task status with workflow execution', async () => {
      const mockRequest: OrchestrateRequestDto = {
        user_id: 'user-123',
        task_type: TaskType.DISCOVER,
        priority: Priority.MEDIUM,
        parameters: {},
      };

      mockCircuitBreaker.getAllStats.mockReturnValue({});
      mockWorkflowService.executeWorkflow.mockResolvedValue({
        id: 'workflow-1',
        workflowType: WorkflowType.JOB_DISCOVERY,
        userId: 'user-123',
        status: WorkflowStatus.PROCESSING,
        steps: [],
        currentStep: 0,
        startedAt: new Date(),
      });

      const orchestrateResult = await service.orchestrate(mockRequest);
      const taskId = orchestrateResult.task_id;

      mockWorkflowService.getExecution.mockReturnValue({
        id: 'workflow-1',
        workflowType: WorkflowType.JOB_DISCOVERY,
        userId: 'user-123',
        status: WorkflowStatus.COMPLETED,
        steps: [],
        currentStep: 1,
        startedAt: new Date(),
        completedAt: new Date(),
        result: {
          discover_jobs: {
            jobs: [
              { id: 'job-1' },
              { id: 'job-2' },
            ],
          },
        },
      });

      const statusResult = await service.getTaskStatus(taskId);

      expect(statusResult).toBeDefined();
      expect(statusResult?.status).toBe('completed');
      expect(statusResult?.completed_at).toBeDefined();
      expect(statusResult?.results?.jobs_discovered).toBe(2);
    });

    it('should extract application count from workflow result', async () => {
      const mockRequest: OrchestrateRequestDto = {
        user_id: 'user-123',
        task_type: TaskType.APPLY,
        priority: Priority.MEDIUM,
        parameters: {},
      };

      mockCircuitBreaker.getAllStats.mockReturnValue({});
      mockWorkflowService.executeWorkflow.mockResolvedValue({
        id: 'workflow-1',
        workflowType: WorkflowType.APPLICATION,
        userId: 'user-123',
        status: WorkflowStatus.PROCESSING,
        steps: [],
        currentStep: 0,
        startedAt: new Date(),
      });

      const orchestrateResult = await service.orchestrate(mockRequest);
      const taskId = orchestrateResult.task_id;

      mockWorkflowService.getExecution.mockReturnValue({
        id: 'workflow-1',
        workflowType: WorkflowType.APPLICATION,
        userId: 'user-123',
        status: WorkflowStatus.COMPLETED,
        steps: [],
        currentStep: 1,
        startedAt: new Date(),
        completedAt: new Date(),
        result: {
          submit_application: {
            success: true,
            applicationId: 'app-123',
          },
        },
      });

      const statusResult = await service.getTaskStatus(taskId);

      expect(statusResult?.results?.applications_submitted).toBe(1);
    });
  });

  describe('getAgentsHealth', () => {
    it('should return health status for all agents', async () => {
      const mockHealthStatuses: AgentHealth[] = [
        {
          agent: AgentType.JOB_DISCOVERY,
          status: AgentStatus.HEALTHY,
          responseTime: 120,
          lastChecked: new Date(),
          errorCount: 0,
          successRate: 99.9,
          circuitOpen: false,
        },
        {
          agent: AgentType.AUTO_APPLY,
          status: AgentStatus.HEALTHY,
          responseTime: 150,
          lastChecked: new Date(),
          errorCount: 0,
          successRate: 99.8,
          circuitOpen: false,
        },
      ];

      mockAgentClient.checkAllAgentsHealth.mockResolvedValue(mockHealthStatuses);

      const result = await service.getAgentsHealth();

      expect(result).toEqual(mockHealthStatuses);
      expect(result).toHaveLength(2);
      expect(agentClient.checkAllAgentsHealth).toHaveBeenCalled();
    });

    it('should handle empty agent list', async () => {
      mockAgentClient.checkAllAgentsHealth.mockResolvedValue([]);

      const result = await service.getAgentsHealth();

      expect(result).toEqual([]);
    });
  });

  describe('getAgentHealth', () => {
    it('should return health status for specific agent', async () => {
      const mockHealth: AgentHealth = {
        agent: AgentType.JOB_DISCOVERY,
        status: AgentStatus.HEALTHY,
        responseTime: 120,
        lastChecked: new Date(),
        errorCount: 0,
        successRate: 99.9,
        circuitOpen: false,
      };

      mockAgentClient.checkHealth.mockResolvedValue(mockHealth);

      const result = await service.getAgentHealth(AgentType.JOB_DISCOVERY);

      expect(result).toEqual(mockHealth);
      expect(agentClient.checkHealth).toHaveBeenCalledWith(AgentType.JOB_DISCOVERY);
    });

    it('should return unhealthy status for degraded agent', async () => {
      const mockHealth: AgentHealth = {
        agent: AgentType.AUTO_APPLY,
        status: AgentStatus.DEGRADED,
        responseTime: 500,
        lastChecked: new Date(),
        errorCount: 5,
        successRate: 95.0,
        circuitOpen: false,
      };

      mockAgentClient.checkHealth.mockResolvedValue(mockHealth);

      const result = await service.getAgentHealth(AgentType.AUTO_APPLY);

      expect(result.status).toBe(AgentStatus.DEGRADED);
    });
  });

  describe('getCircuitBreakerStats', () => {
    it('should return circuit breaker stats for all agents', () => {
      const mockStats = {
        [AgentType.JOB_DISCOVERY]: {
          status: AgentStatus.HEALTHY,
          isOpen: false,
          errorCount: 0,
          successCount: 100,
          lastSuccess: new Date(),
        },
        [AgentType.AUTO_APPLY]: {
          status: AgentStatus.DEGRADED,
          isOpen: false,
          errorCount: 5,
          successCount: 95,
          lastError: 'Rate limit exceeded',
        },
      };

      mockCircuitBreaker.getAllStats.mockReturnValue(mockStats);

      const result = service.getCircuitBreakerStats();

      expect(result).toEqual(mockStats);
      expect(result[AgentType.JOB_DISCOVERY]).toBeDefined();
      expect(result[AgentType.AUTO_APPLY]).toBeDefined();
    });

    it('should return empty stats when no circuits exist', () => {
      mockCircuitBreaker.getAllStats.mockReturnValue({});

      const result = service.getCircuitBreakerStats();

      expect(result).toEqual({});
    });
  });

  describe('resetCircuitBreaker', () => {
    it('should reset circuit breaker for specific agent', () => {
      service.resetCircuitBreaker(AgentType.JOB_DISCOVERY);

      expect(circuitBreaker.resetCircuit).toHaveBeenCalledWith(
        AgentType.JOB_DISCOVERY,
      );
    });

    it('should reset circuit breaker for all agent types', () => {
      service.resetCircuitBreaker(AgentType.AUTO_APPLY);
      service.resetCircuitBreaker(AgentType.RESUME_PARSER);
      service.resetCircuitBreaker(AgentType.INTERVIEW_PREP);

      expect(circuitBreaker.resetCircuit).toHaveBeenCalledTimes(3);
    });
  });
});
