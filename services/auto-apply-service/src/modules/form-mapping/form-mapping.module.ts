import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormMapping } from './entities/form-mapping.entity';
import { FormMappingService } from './form-mapping.service';

@Module({
  imports: [TypeOrmModule.forFeature([FormMapping])],
  providers: [FormMappingService],
  exports: [FormMappingService],
})
export class FormMappingModule {}
