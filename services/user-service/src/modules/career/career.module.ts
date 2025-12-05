import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { WorkExperience } from './entities/work-experience.entity';
import { Education } from './entities/education.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkExperience, Education])],
  controllers: [CareerController],
  providers: [CareerService],
  exports: [CareerService],
})
export class CareerModule {}
