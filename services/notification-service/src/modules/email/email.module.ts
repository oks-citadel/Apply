import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailQueueProcessor } from '../queue/processors/email-queue.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'email' })],
  providers: [EmailService, EmailQueueProcessor],
  exports: [EmailService],
})
export class EmailModule {}
