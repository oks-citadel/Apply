import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { InputSanitizationMiddleware } from '@applyforus/security';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { StripeModule } from './modules/stripe/stripe.module';
import { FlutterwaveModule } from './modules/flutterwave/flutterwave.module';
import { PaystackModule } from './modules/paystack/paystack.module';
import { CoinsModule } from './modules/coins/coins.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { TaxModule } from './modules/tax/tax.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { HealthModule } from './health/health.module';
import { LoggingModule } from './common/logging/logging.module';
import { typeOrmConfig } from './common/config/typeorm.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),

    // RabbitMQ for event publishing
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672')],
            queue: configService.get<string>('RABBITMQ_QUEUE_PAYMENT_EVENTS', 'payment_events'),
            queueOptions: {
              durable: true,
            },
            noAck: false,
            prefetchCount: 1,
          },
        }),
      },
      {
        name: 'SUBSCRIPTION_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672')],
            queue: configService.get<string>(
              'RABBITMQ_QUEUE_SUBSCRIPTION_EVENTS',
              'subscription_events',
            ),
            queueOptions: {
              durable: true,
            },
            noAck: false,
            prefetchCount: 1,
          },
        }),
      },
    ]),

    // Logging
    LoggingModule,

    // Rate limiting module
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: configService.get<number>('THROTTLE_TTL', 60000),
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Authentication
    AuthModule,

    // Feature modules
    StripeModule,
    FlutterwaveModule,
    PaystackModule,
    CoinsModule,
    SubscriptionsModule,
    InvoicesModule,
    TaxModule,
    CurrencyModule,
    RevenueModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(InputSanitizationMiddleware).forRoutes('*');
  }
}
