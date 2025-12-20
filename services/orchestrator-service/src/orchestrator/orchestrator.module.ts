import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';
import { TaskQueueProcessor } from './processors/task-queue.processor';
import { AgentClientService } from './services/agent-client.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { WorkflowService } from './workflow/workflow.service';

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
