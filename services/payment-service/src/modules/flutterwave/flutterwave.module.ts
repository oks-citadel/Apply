import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FlutterwaveService } from './flutterwave.service';
import { FlutterwaveController } from './flutterwave.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [ConfigModule, SubscriptionsModule, InvoicesModule],
  controllers: [FlutterwaveController],
  providers: [FlutterwaveService],
  exports: [FlutterwaveService],
})
export class FlutterwaveModule {}
