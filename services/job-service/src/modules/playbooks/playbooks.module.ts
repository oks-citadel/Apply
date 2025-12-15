import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaybooksController } from './playbooks.controller';
import { PlaybooksService } from './playbooks.service';
import { Playbook } from './entities/playbook.entity';
import { PlaybookApplication } from './entities/playbook-application.entity';
import { Job } from '../jobs/entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playbook, PlaybookApplication, Job]),
  ],
  controllers: [PlaybooksController],
  providers: [PlaybooksService],
  exports: [PlaybooksService],
})
export class PlaybooksModule {}
