import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruiterController } from './recruiter.controller';
import { RecruiterService } from './recruiter.service';
import { RecruiterProfile } from './entities/recruiter-profile.entity';
import { RecruiterAssignment } from './entities/recruiter-assignment.entity';
import { PlacementOutcome } from './entities/placement-outcome.entity';
import { RecruiterReview } from './entities/recruiter-review.entity';
import { RecruiterRevenue } from './entities/recruiter-revenue.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecruiterProfile,
      RecruiterAssignment,
      PlacementOutcome,
      RecruiterReview,
      RecruiterRevenue,
    ]),
    AuthModule,
  ],
  controllers: [RecruiterController],
  providers: [RecruiterService],
  exports: [RecruiterService],
})
export class RecruiterModule {}
