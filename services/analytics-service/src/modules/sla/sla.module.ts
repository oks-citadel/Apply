import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SLAController } from './sla.controller';
import { SLAService } from './services/sla.service';
import { EligibilityCheckerService } from './services/eligibility-checker.service';
import { ViolationHandlerService } from './services/violation-handler.service';
import { SLAContract } from './entities/sla-contract.entity';
import { SLAProgress } from './entities/sla-progress.entity';
import { SLAViolation } from './entities/sla-violation.entity';
import { SLARemedy } from './entities/sla-remedy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SLAContract, SLAProgress, SLAViolation, SLARemedy]),
    ScheduleModule.forRoot(),
  ],
  controllers: [SLAController],
  providers: [SLAService, EligibilityCheckerService, ViolationHandlerService],
  exports: [SLAService, EligibilityCheckerService, ViolationHandlerService],
})
export class SLAModule {}
