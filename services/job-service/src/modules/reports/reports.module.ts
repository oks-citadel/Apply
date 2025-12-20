import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobReport } from './entities/report.entity';
import { JobReportsController } from './job-reports.controller';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JwtAuthGuard, AdminGuard, RateLimitGuard } from '../../common/guards';
import { Job } from '../jobs/entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobReport, Job]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ReportsController, JobReportsController],
  providers: [ReportsService, JwtAuthGuard, AdminGuard, RateLimitGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
