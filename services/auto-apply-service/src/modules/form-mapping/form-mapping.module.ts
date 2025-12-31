import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { FormMapping } from './entities/form-mapping.entity';
import { Answer } from '../answer-library/entities/answer.entity';
import { FormMappingService } from './form-mapping.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FormMapping, Answer]),
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
    ConfigModule,
  ],
  providers: [FormMappingService],
  exports: [FormMappingService],
})
export class FormMappingModule {}
