import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OrchestratorService } from '../orchestrator.service';
import { OrchestrateRequestDto } from '../dto/orchestrate.dto';

interface TaskJobData {
  taskId: string;
  request: OrchestrateRequestDto;
}

@Processor('orchestrator-tasks')
export class TaskQueueProcessor {
  private readonly logger = new Logger(TaskQueueProcessor.name);

  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Process('process-task')
  async processTask(job: Job<TaskJobData>) {
    this.logger.log(`Processing task ${job.data.taskId}`);

    const { taskId, request } = job.data;

    try {
      // The actual processing is handled by the orchestrator service
      // This processor is for background/queued tasks
      const result = await this.orchestratorService.orchestrate(request);

      this.logger.log(`Task ${taskId} completed with status: ${result.status}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Task ${taskId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job<TaskJobData>) {
    this.logger.log(`Task ${job.data.taskId} started processing`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<TaskJobData>, result: unknown) {
    this.logger.log(`Task ${job.data.taskId} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job<TaskJobData>, error: Error) {
    this.logger.error(`Task ${job.data.taskId} failed: ${error.message}`);
  }
}
