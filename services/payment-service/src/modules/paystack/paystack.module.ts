import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaystackService } from './paystack.service';
import { PaystackController } from './paystack.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [ConfigModule, SubscriptionsModule, InvoicesModule],
  controllers: [PaystackController],
  providers: [PaystackService],
  exports: [PaystackService],
})
export class PaystackModule {}
