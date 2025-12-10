import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoinsService } from './coins.service';
import { CoinsController } from './coins.controller';

@Module({
  imports: [ConfigModule],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
