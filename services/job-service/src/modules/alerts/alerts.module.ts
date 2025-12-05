import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { JobAlert } from './entities/job-alert.entity';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [TypeOrmModule.forFeature([JobAlert]), SearchModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
