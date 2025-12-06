import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';
import { WorkflowService } from './workflow/workflow.service';
import { AgentClientService } from './services/agent-client.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { TaskQueueProcessor } from './processors/task-queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'orchestrator-tasks',
    }),
    BullModule.registerQueue({
      name: 'workflow-jobs',
    }),
    HttpModule,
  ],
  controllers: [OrchestratorController],
  providers: [
    OrchestratorService,
    WorkflowService,
    AgentClientService,
    CircuitBreakerService,
    TaskQueueProcessor,
  ],
  exports: [OrchestratorService, WorkflowService, AgentClientService],
})
export class OrchestratorModule {}
