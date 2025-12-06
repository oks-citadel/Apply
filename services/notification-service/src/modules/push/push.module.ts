import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { DeviceToken } from './entities/device-token.entity';
import { PushQueueProcessor } from './processors/push-queue.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceToken]),
    BullModule.registerQueue({
      name: 'push-notifications',
    }),
  ],
  controllers: [PushController],
  providers: [PushService, PushQueueProcessor],
  exports: [PushService],
})
export class PushModule {}
