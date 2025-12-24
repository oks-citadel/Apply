import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GdprRequest } from './entities/gdpr-request.entity';
import { GdprController } from './gdpr.controller';
import { GdprService } from './gdpr.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GdprRequest]),
    UsersModule,
  ],
  controllers: [GdprController],
  providers: [GdprService],
  exports: [GdprService],
})
export class GdprModule {}
