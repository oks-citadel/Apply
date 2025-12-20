import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { JobAlert } from './entities/job-alert.entity';
import { JwtAuthGuard } from '../../common/guards';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobAlert]),
    SearchModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AlertsController],
  providers: [AlertsService, JwtAuthGuard],
  exports: [AlertsService],
})
export class AlertsModule {}
