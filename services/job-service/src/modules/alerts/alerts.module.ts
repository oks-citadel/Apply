import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { JobAlert } from './entities/job-alert.entity';
import { SearchModule } from '../search/search.module';
import { JwtAuthGuard } from '../../common/guards';

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
