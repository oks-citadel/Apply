import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReportsController } from './reports.controller';
import { JobReportsController } from './job-reports.controller';
import { ReportsService } from './reports.service';
import { JobReport } from './entities/report.entity';
import { Job } from '../jobs/entities/job.entity';
import { JwtAuthGuard, AdminGuard, RateLimitGuard } from '../../common/guards';

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
