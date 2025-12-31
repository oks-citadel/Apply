import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Profile } from '../profile/entities/profile.entity';
import { WorkExperience } from '../career/entities/work-experience.entity';
import { Education } from '../career/entities/education.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      WorkExperience,
      Education,
      Skill,
      Subscription,
    ]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    ConfigModule,
    JwtModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, JwtAuthGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
