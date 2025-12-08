import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsController } from './applications.controller';
import { AutoApplyController } from './auto-apply.controller';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';
import { AutoApplySettings } from './entities/auto-apply-settings.entity';
import { AutoApplyService } from './services/auto-apply.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, AutoApplySettings]),
    forwardRef(() => QueueModule),
  ],
  controllers: [ApplicationsController, AutoApplyController],
  providers: [ApplicationsService, AutoApplyService],
  exports: [ApplicationsService, AutoApplyService],
})
export class ApplicationsModule {}
