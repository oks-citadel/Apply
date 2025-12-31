import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookScheduler } from './webhook.scheduler';
import { WebhookAuthGuard } from './guards/webhook-auth.guard';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookSubscription, WebhookDelivery]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookScheduler, WebhookAuthGuard],
  exports: [WebhookService, WebhookAuthGuard],
})
export class WebhookModule {}
