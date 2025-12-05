import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormMappingService } from './form-mapping.service';
import { FormMapping } from './entities/form-mapping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FormMapping])],
  providers: [FormMappingService],
  exports: [FormMappingService],
})
export class FormMappingModule {}
