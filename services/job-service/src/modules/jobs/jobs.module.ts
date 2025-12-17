import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { SavedJob } from './entities/saved-job.entity';
import { JwtAuthGuard } from '../../common/guards';
// SearchModule and ReportsModule disabled until ES/Redis deployed
// import { SearchModule } from '../search/search.module';
// import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, SavedJob]),
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    // SearchModule,  // Disabled - requires Elasticsearch
    // ReportsModule, // Disabled - requires dependencies
  ],
  controllers: [JobsController],
  providers: [JobsService, JwtAuthGuard],
  exports: [JobsService],
})
export class JobsModule {}
