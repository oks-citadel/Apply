import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { WebhookService } from './webhook.service';

@Injectable()
export class WebhookScheduler {
  private readonly logger = new Logger(WebhookScheduler.name);

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Retry failed webhook deliveries every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleRetryFailedDeliveries(): Promise<void> {
    this.logger.debug('Running webhook retry job');
    try {
      await this.webhookService.retryFailedDeliveries();
    } catch (error) {
      this.logger.error(`Webhook retry job failed: ${error.message}`, error.stack);
    }
  }
}
